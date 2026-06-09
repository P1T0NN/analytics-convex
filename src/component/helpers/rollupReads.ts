// LIBRARIES
import { ConvexError } from "convex/values";

// CONSTANTS
import { DAY_MS, TOTAL_DIMENSION } from "../../shared/constants.js";

// UTILS
import { getAnalyticsRanking } from "../../shared/utils/analyticsRankingUtils";
import { internalStartOfUtcDay } from "../utils/common/dateUtils";

// TYPES
import type { QueryCtx } from "../_generated/server";
import type {
	typesAnalyticsConfigState,
	typesAnalyticsScope,
	typesAnalyticsScopeType,
	typesAnalyticsSettings,
} from "../../shared/types/index.js";

const DEFAULT_TOTAL_DAYS = 30;
const DEFAULT_MAX_TOTAL_ROWS = 20_000;

export async function internalCollectDailyMetricRows(
	ctx: Pick<QueryCtx, "db">,
	args: {
		metric: string;
		scope: typesAnalyticsScope;
		dimensionKey: string;
		from: number;
		to: number;
		settings: typesAnalyticsSettings;
	},
) {
	const rows = await ctx.db
		.query("analyticsDailyMetrics")
		.withIndex("by_metric_scope_dimension_bucket", (q) =>
			q
				.eq("metric", args.metric)
				.eq("scopeType", args.scope.type)
				.eq("scopeId", args.scope.id)
				.eq("granularity", "day")
				.eq("dimensionKey", args.dimensionKey)
				.gte("bucketStart", internalStartOfUtcDay(args.from))
				.lte("bucketStart", internalStartOfUtcDay(args.to)),
		)
		.take(args.settings.maxRollupRowsPerQuery + 1);

	if (rows.length > args.settings.maxRollupRowsPerQuery) {
		throw new ConvexError({
			code: "QUERY_TOO_LARGE",
			message:
				`Analytics query matched more than ${args.settings.maxRollupRowsPerQuery} rollup rows. ` +
				"Narrow the date range, scope, or configured dimensions.",
		});
	}

	return rows;
}

export function internalSumDailyMetricRowsForRange(
	rows: Array<{ bucketStart: number; value: number }>,
	from: number,
	to: number,
) {
	const fromDay = internalStartOfUtcDay(from);
	const toDay = internalStartOfUtcDay(to);

	return rows.reduce((total, row) => {
		if (row.bucketStart < fromDay || row.bucketStart > toDay) {
			return total;
		}

		return total + row.value;
	}, 0);
}

export async function internalGetMetricTotalForRange(
	ctx: Pick<QueryCtx, "db">,
	config: typesAnalyticsConfigState,
	args: {
		metric: string;
		scope: typesAnalyticsScope;
		from: number;
		to: number;
		dimensionKey?: string;
	},
) {
	const rows = await internalCollectDailyMetricRows(ctx, {
		metric: args.metric,
		scope: args.scope,
		dimensionKey: args.dimensionKey ?? TOTAL_DIMENSION,
		from: args.from,
		to: args.to,
		settings: config.settings,
	});

	return internalSumDailyMetricRowsForRange(rows, args.from, args.to);
}

export async function internalGetMetricTotalsForRanges(
	ctx: Pick<QueryCtx, "db">,
	config: typesAnalyticsConfigState,
	args: {
		metric: string;
		scope: typesAnalyticsScope;
		ranges: Array<{ key: string; from: number; to: number }>;
		dimensionKey?: string;
	},
) {
	if (args.ranges.length === 0) {
		return new Map<string, number>();
	}

	const minFrom = Math.min(...args.ranges.map((range) => range.from));
	const maxTo = Math.max(...args.ranges.map((range) => range.to));
	const rows = await internalCollectDailyMetricRows(ctx, {
		metric: args.metric,
		scope: args.scope,
		dimensionKey: args.dimensionKey ?? TOTAL_DIMENSION,
		from: minFrom,
		to: maxTo,
		settings: config.settings,
	});

	const totals = new Map<string, number>();
	for (const range of args.ranges) {
		totals.set(
			range.key,
			internalSumDailyMetricRowsForRange(rows, range.from, range.to),
		);
	}

	return totals;
}

/**
 * @internal
 *
 * Get aggregated totals by dimension value from the component database.
 * App code should use analytics.fetchMetricTotalsByDimension(ctx, ...).
 */
export async function internalGetAnalyticsMetricTotalsByDimension(
	ctx: Pick<QueryCtx, "db">,
	args: {
		metric: string;
		scopeType: typesAnalyticsScopeType;
		scopeId: string;
		dimensionKey: string;
		days?: number;
		maxRows?: number;
	},
): Promise<Map<string, number>> {
	const days = args.days ?? DEFAULT_TOTAL_DAYS;
	if (!Number.isInteger(days) || days <= 0) {
		throw new ConvexError({
			code: "BAD_REQUEST",
			message: "`days` must be a positive integer.",
		});
	}

	const maxRows = args.maxRows ?? DEFAULT_MAX_TOTAL_ROWS;
	if (!Number.isInteger(maxRows) || maxRows <= 0) {
		throw new ConvexError({
			code: "BAD_REQUEST",
			message: "`maxRows` must be a positive integer.",
		});
	}

	const todayStart = internalStartOfUtcDay(Date.now());
	const from = todayStart - DAY_MS * (days - 1);

	const rows = await ctx.db
		.query("analyticsDailyMetrics")
		.withIndex("by_metric_scope_dimension_bucket", (q) =>
			q
				.eq("metric", args.metric)
				.eq("scopeType", args.scopeType)
				.eq("scopeId", args.scopeId)
				.eq("granularity", "day")
				.eq("dimensionKey", args.dimensionKey)
				.gte("bucketStart", from)
				.lte("bucketStart", todayStart),
		)
		.take(maxRows + 1);

	if (rows.length > maxRows) {
		throw new ConvexError({
			code: "QUERY_TOO_LARGE",
			message:
				`Analytics total query matched more than ${maxRows} rollup rows. ` +
				"Reduce the requested days, scope, or dimension cardinality.",
		});
	}

	const totals = new Map<string, number>();

	for (const row of rows) {
		totals.set(
			row.dimensionValue,
			(totals.get(row.dimensionValue) ?? 0) + row.value,
		);
	}

	return totals;
}

/**
 * @internal
 *
 * Get the single highest-value dimension entry from the component database.
 * App code should use analytics.fetchTopDimensionValue(ctx, ...).
 */
export async function internalGetAnalyticsTopDimensionValue(
	ctx: Pick<QueryCtx, "db">,
	args: {
		metric: string;
		scopeType: typesAnalyticsScopeType;
		scopeId: string;
		dimensionKey: string;
		days?: number;
	},
): Promise<string | null> {
	const totals = await internalGetAnalyticsMetricTotalsByDimension(ctx, args);

	const [top] = getAnalyticsRanking({
		items: [...totals.entries()],
		getScore: ([, value]) => value,
		limit: 1,
	});

	return top?.[0] ?? null;
}
