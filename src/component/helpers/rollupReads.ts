// LIBRARIES
import { ConvexError } from "convex/values";

// CONSTANTS
import { DAY_MS, TOTAL_DIMENSION } from "../../shared/constants.js";

// UTILS
import { getAnalyticsRanking } from "../../shared/utils/analyticsRankingUtils";
import {
	internalReduceMetricRollupRows,
	internalReduceMetricRollupTotalsByKey,
} from "../../shared/utils/metricAggregationUtils.js";
import {
	startOfUtcDay,
	startOfUtcHour,
} from "../../shared/utils/analyticsDateRangeUtils.js";
import {
	internalGetMetricConfigOrThrow,
	internalGetMetricRollupGranularity,
} from "../utils/shared/metricUtils";

// TYPES
import type { QueryCtx } from "../_generated/server";
import type {
	typesAnalyticsConfigState,
} from "../../shared/types/componentInternal.js";
import type {
	typesAnalyticsMetricScope,
	typesAnalyticsScope,
	typesAnalyticsScopeType,
} from "../../shared/types/scopes.js";
import type {
	typesAnalyticsRollupGranularity,
} from "../../shared/types/primitives.js";
import type {
	typesAnalyticsSettings,
} from "../../shared/types/settings.js";

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
		granularity?: typesAnalyticsRollupGranularity;
	},
) {
	const granularity = args.granularity ?? "day";
	const fromBucket =
		granularity === "hour"
			? startOfUtcHour(args.from)
			: startOfUtcDay(args.from);
	const toBucket =
		granularity === "hour"
			? startOfUtcHour(args.to)
			: startOfUtcDay(args.to);

	const rows = await ctx.db
		.query("analyticsDailyMetrics")
		.withIndex("by_metric_scope_dimension_bucket", (q) =>
			q
				.eq("metric", args.metric)
				.eq("scopeType", args.scope.type)
				.eq("scopeId", args.scope.id)
				.eq("granularity", granularity)
				.eq("dimensionKey", args.dimensionKey)
				.gte("bucketStart", fromBucket)
				.lte("bucketStart", toBucket),
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

export async function internalCollectDailyActorClaims(
	ctx: Pick<QueryCtx, "db">,
	args: {
		metric: string;
		scope: typesAnalyticsScope | typesAnalyticsMetricScope;
		dimensionKey: string;
		from: number;
		to: number;
		settings: typesAnalyticsSettings;
		maxRows?: number;
	},
) {
	const scopeType =
		"scopeType" in args.scope ? args.scope.scopeType : args.scope.type;
	const scopeId = "scopeId" in args.scope ? args.scope.scopeId : args.scope.id;
	const limit = args.maxRows ?? args.settings.maxRollupRowsPerQuery;
	const rows = await ctx.db
		.query("analyticsDailyActorClaims")
		.withIndex("by_metric_scope_dimension_bucket", (q) =>
			q
				.eq("metric", args.metric)
				.eq("scopeType", scopeType)
				.eq("scopeId", scopeId)
				.eq("dimensionKey", args.dimensionKey)
				.gte("bucketStart", startOfUtcDay(args.from))
				.lte("bucketStart", startOfUtcDay(args.to)),
		)
		.take(limit + 1);

	if (rows.length > limit) {
		throw new ConvexError({
			code: "QUERY_TOO_LARGE",
			message:
				`Analytics query matched more than ${limit} actor claim rows. ` +
				"Narrow the date range, scope, or configured dimensions.",
		});
	}

	return rows;
}

function internalIsSingleUtcDayRange(from: number, to: number) {
	return startOfUtcDay(from) === startOfUtcDay(to);
}

export function internalCountDistinctActorsFromClaims(
	claims: Array<{ actorKey: string }>,
) {
	return new Set(claims.map((claim) => claim.actorKey)).size;
}

export function internalCountDistinctActorsByDimensionFromClaims(
	claims: Array<{ actorKey: string; dimensionValue: string }>,
) {
	const actorsByDimension = new Map<string, Set<string>>();

	for (const claim of claims) {
		const actors =
			actorsByDimension.get(claim.dimensionValue) ?? new Set<string>();
		actors.add(claim.actorKey);
		actorsByDimension.set(claim.dimensionValue, actors);
	}

	return new Map(
		[...actorsByDimension.entries()].map(([dimensionValue, actors]) => [
			dimensionValue,
			actors.size,
		]),
	);
}

export function internalSumDailyMetricRowsForRange(
	rows: Array<{ bucketStart: number; value: number; sampleCount?: number }>,
	from: number,
	to: number,
	aggregation: typesAnalyticsConfigState["metrics"][number]["aggregation"] = "sum",
	granularity: typesAnalyticsRollupGranularity = "day",
) {
	const fromBucket =
		granularity === "hour" ? startOfUtcHour(from) : startOfUtcDay(from);
	const toBucket =
		granularity === "hour" ? startOfUtcHour(to) : startOfUtcDay(to);

	return internalReduceMetricRollupRows(aggregation, rows, fromBucket, toBucket);
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
	const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
	const dimensionKey = args.dimensionKey ?? TOTAL_DIMENSION;
	const granularity = internalGetMetricRollupGranularity(metricConfig);

	if (
		metricConfig.aggregation === "distinctActors" &&
		!internalIsSingleUtcDayRange(args.from, args.to)
	) {
		const claims = await internalCollectDailyActorClaims(ctx, {
			metric: args.metric,
			scope: args.scope,
			dimensionKey,
			from: args.from,
			to: args.to,
			settings: config.settings,
		});

		return internalCountDistinctActorsFromClaims(claims);
	}

	const rows = await internalCollectDailyMetricRows(ctx, {
		metric: args.metric,
		scope: args.scope,
		dimensionKey,
		from: args.from,
		to: args.to,
		settings: config.settings,
		granularity,
	});

	return internalSumDailyMetricRowsForRange(
		rows,
		args.from,
		args.to,
		metricConfig.aggregation,
		granularity,
	);
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
	const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
	const granularity = internalGetMetricRollupGranularity(metricConfig);
	const rows = await internalCollectDailyMetricRows(ctx, {
		metric: args.metric,
		scope: args.scope,
		dimensionKey: args.dimensionKey ?? TOTAL_DIMENSION,
		from: minFrom,
		to: maxTo,
		settings: config.settings,
		granularity,
	});

	const totals = new Map<string, number>();
	for (const range of args.ranges) {
		if (
			metricConfig.aggregation === "distinctActors" &&
			!internalIsSingleUtcDayRange(range.from, range.to)
		) {
			const claims = await internalCollectDailyActorClaims(ctx, {
				metric: args.metric,
				scope: args.scope,
				dimensionKey: args.dimensionKey ?? TOTAL_DIMENSION,
				from: range.from,
				to: range.to,
				settings: config.settings,
			});
			totals.set(
				range.key,
				internalCountDistinctActorsFromClaims(claims),
			);
			continue;
		}

		totals.set(
			range.key,
			internalSumDailyMetricRowsForRange(
				rows,
				range.from,
				range.to,
				metricConfig.aggregation,
				granularity,
			),
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
		aggregation?: typesAnalyticsConfigState["metrics"][number]["aggregation"];
		settings?: typesAnalyticsSettings;
		granularity?: typesAnalyticsRollupGranularity;
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

	const todayStart = startOfUtcDay(Date.now());
	const from = todayStart - DAY_MS * (days - 1);
	const aggregation = args.aggregation ?? "sum";

	if (aggregation === "distinctActors" && days > 1) {
		if (!args.settings) {
			throw new ConvexError({
				code: "BAD_REQUEST",
				message:
					"Distinct actor totals by dimension require analytics settings for query limits.",
			});
		}

		const claims = await internalCollectDailyActorClaims(ctx, {
			metric: args.metric,
			scope: {
				scopeType: args.scopeType,
				scopeId: args.scopeId,
			},
			dimensionKey: args.dimensionKey,
			from,
			to: todayStart,
			settings: args.settings,
			maxRows,
		});

		return internalCountDistinctActorsByDimensionFromClaims(claims);
	}

	const granularity = args.granularity ?? "day";
	const rows = await ctx.db
		.query("analyticsDailyMetrics")
		.withIndex("by_metric_scope_dimension_bucket", (q) =>
			q
				.eq("metric", args.metric)
				.eq("scopeType", args.scopeType)
				.eq("scopeId", args.scopeId)
				.eq("granularity", granularity)
				.eq("dimensionKey", args.dimensionKey)
				.gte("bucketStart", from)
				// Hourly buckets within today start at or after todayStart, so
				// include the whole final day for both granularities.
				.lt("bucketStart", todayStart + DAY_MS),
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

	const totals = internalReduceMetricRollupTotalsByKey(
		args.aggregation ?? "sum",
		rows,
	);

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
		maxRows?: number;
		aggregation?: typesAnalyticsConfigState["metrics"][number]["aggregation"];
		settings?: typesAnalyticsSettings;
		granularity?: typesAnalyticsRollupGranularity;
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
