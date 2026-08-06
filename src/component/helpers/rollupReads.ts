// LIBRARIES
import { ConvexError } from "convex/values";

// CONSTANTS
import {
	ANALYTICS_LIMITS,
	ANALYTICS_READ_BUDGET_CEILING,
	DAY_MS,
	TOTAL_DIMENSION,
} from "../../shared/constants.js";

// UTILS
import { getAnalyticsRanking } from "../../shared/utils/analyticsRankingUtils";
import {
	internalReduceMetricRollupRows,
	internalReduceMetricRollupTotalsByKey,
} from "../../shared/utils/metricAggregationUtils.js";
import {
	decomposeUtcRangeForRollups,
	startOfUtcDay,
	startOfUtcHour,
	startOfUtcMonth,
} from "../../shared/utils/analyticsDateRangeUtils.js";
import {
	internalGetMetricConfigOrThrow,
	internalGetMetricRollupGranularity,
} from "../utils/shared/metricUtils";
import {
	internalCreateReadBudget,
	internalDrawFromReadBudget,
	internalReadBudgetLimit,
	type typesReadBudget,
} from "./readBudget";

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
	typesAnalyticsRollupBucketGranularity,
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
		granularity?: typesAnalyticsRollupBucketGranularity;
		budget?: typesReadBudget;
	},
) {
	const granularity = args.granularity ?? "day";
	const floorToBucket = (timestamp: number) => {
		if (granularity === "hour") return startOfUtcHour(timestamp);
		if (granularity === "month") return startOfUtcMonth(timestamp);
		return startOfUtcDay(timestamp);
	};
	const fromBucket = floorToBucket(args.from);
	const toBucket = floorToBucket(args.to);

	// Every read draws from the query's shared budget (or a fresh one clamped
	// to the same ceiling), so total rows scanned per query stay well under
	// Convex's transaction limit.
	const budget = args.budget ?? internalCreateReadBudget(args.settings);
	const limit = internalReadBudgetLimit(budget);

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
		.take(limit + 1);

	internalDrawFromReadBudget(budget, rows.length);
	return rows;
}

/**
 * Collect the rollup rows that exactly cover a UTC day range, reading month
 * rollup rows for every full calendar month inside it and day rows only for
 * the partial edges. A 366-day total reads ~12 month rows plus at most ~60
 * edge day rows instead of one row per day.
 *
 * Falls back to plain day (or hour) rows when the metric stores hourly
 * rollups, when the aggregation is distinctActors (month sums would double
 * count actors), or when the range contains no full month. The returned rows
 * never overlap, so callers can reduce them without range filtering.
 */
export async function internalCollectMetricTotalRows(
	ctx: Pick<QueryCtx, "db">,
	args: {
		metric: string;
		metricConfig: typesAnalyticsConfigState["metrics"][number];
		scope: typesAnalyticsScope;
		dimensionKey: string;
		from: number;
		to: number;
		settings: typesAnalyticsSettings;
		budget?: typesReadBudget;
	},
) {
	const granularity = internalGetMetricRollupGranularity(args.metricConfig);
	const budget = args.budget ?? internalCreateReadBudget(args.settings);

	if (
		granularity !== "day" ||
		args.metricConfig.aggregation === "distinctActors"
	) {
		return internalCollectDailyMetricRows(ctx, {
			metric: args.metric,
			scope: args.scope,
			dimensionKey: args.dimensionKey,
			from: args.from,
			to: args.to,
			settings: args.settings,
			granularity,
			budget,
		});
	}

	const { dayRanges, months } = decomposeUtcRangeForRollups(args.from, args.to);

	if (!months) {
		return internalCollectDailyMetricRows(ctx, {
			metric: args.metric,
			scope: args.scope,
			dimensionKey: args.dimensionKey,
			from: args.from,
			to: args.to,
			settings: args.settings,
			granularity: "day",
			budget,
		});
	}

	// Sequential so each part's take() is bounded by what the shared budget
	// still allows — parallel reads could each consume a full budget before
	// accounting catches up.
	const rows: Awaited<ReturnType<typeof internalCollectDailyMetricRows>> = [];
	for (const range of dayRanges) {
		rows.push(
			...(await internalCollectDailyMetricRows(ctx, {
				metric: args.metric,
				scope: args.scope,
				dimensionKey: args.dimensionKey,
				from: range.from,
				to: range.to,
				settings: args.settings,
				granularity: "day",
				budget,
			})),
		);
	}
	rows.push(
		...(await internalCollectDailyMetricRows(ctx, {
			metric: args.metric,
			scope: args.scope,
			dimensionKey: args.dimensionKey,
			from: months.from,
			to: months.to,
			settings: args.settings,
			granularity: "month",
			budget,
		})),
	);

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
		budget?: typesReadBudget;
	},
) {
	const scopeType =
		"scopeType" in args.scope ? args.scope.scopeType : args.scope.type;
	const scopeId = "scopeId" in args.scope ? args.scope.scopeId : args.scope.id;
	const budget = args.budget ?? internalCreateReadBudget(args.settings);
	const limit = Math.min(
		args.maxRows ?? Number.POSITIVE_INFINITY,
		internalReadBudgetLimit(budget),
	);
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

	internalDrawFromReadBudget(budget, rows.length);
	// Month-tier claim rows share this index (their bucketStart is a day
	// start); day-level consumers must not see them.
	return rows.filter((row) => row.granularity === undefined);
}

/**
 * Month-tier claim read: one row per distinct actor per month.
 */
export async function internalCollectMonthActorClaims(
	ctx: Pick<QueryCtx, "db">,
	args: {
		metric: string;
		scope: typesAnalyticsScope | typesAnalyticsMetricScope;
		dimensionKey: string;
		monthsFrom: number;
		monthsTo: number;
		settings: typesAnalyticsSettings;
		budget?: typesReadBudget;
	},
) {
	const scopeType =
		"scopeType" in args.scope ? args.scope.scopeType : args.scope.type;
	const scopeId = "scopeId" in args.scope ? args.scope.scopeId : args.scope.id;
	const budget = args.budget ?? internalCreateReadBudget(args.settings);
	const limit = internalReadBudgetLimit(budget);

	const rows = await ctx.db
		.query("analyticsDailyActorClaims")
		.withIndex("by_metric_scope_granularity_dim_bucket", (q) =>
			q
				.eq("metric", args.metric)
				.eq("scopeType", scopeType)
				.eq("scopeId", scopeId)
				.eq("granularity", "month")
				.eq("dimensionKey", args.dimensionKey)
				.gte("bucketStart", args.monthsFrom)
				.lte("bucketStart", args.monthsTo),
		)
		.take(limit + 1);

	internalDrawFromReadBudget(budget, rows.length);
	return rows;
}

/**
 * Collect the actor-claim rows that exactly cover a UTC day range for distinct
 * counting: month-tier claims for full calendar months, day claims for the
 * partial edges. Distinct counting is set-based, so combining the two tiers is
 * exact — an actor present in both is counted once. Cuts long-range distinct
 * reads from actors x days to roughly actors-per-month x months.
 */
export async function internalCollectActorClaimsForRange(
	ctx: Pick<QueryCtx, "db">,
	args: {
		metric: string;
		scope: typesAnalyticsScope | typesAnalyticsMetricScope;
		dimensionKey: string;
		from: number;
		to: number;
		settings: typesAnalyticsSettings;
		budget?: typesReadBudget;
	},
) {
	const budget = args.budget ?? internalCreateReadBudget(args.settings);
	const { dayRanges, months } = decomposeUtcRangeForRollups(args.from, args.to);

	const rows: Array<{
		actorKey: string;
		dimensionKey: string;
		dimensionValue: string;
		bucketStart: number;
	}> = [];

	for (const range of dayRanges) {
		rows.push(
			...(await internalCollectDailyActorClaims(ctx, {
				metric: args.metric,
				scope: args.scope,
				dimensionKey: args.dimensionKey,
				from: range.from,
				to: range.to,
				settings: args.settings,
				budget,
			})),
		);
	}

	if (months) {
		rows.push(
			...(await internalCollectMonthActorClaims(ctx, {
				metric: args.metric,
				scope: args.scope,
				dimensionKey: args.dimensionKey,
				monthsFrom: months.from,
				monthsTo: months.to,
				settings: args.settings,
				budget,
			})),
		);
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
		budget?: typesReadBudget;
	},
) {
	const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
	const dimensionKey = args.dimensionKey ?? TOTAL_DIMENSION;

	if (
		metricConfig.aggregation === "distinctActors" &&
		!internalIsSingleUtcDayRange(args.from, args.to)
	) {
		const claims = await internalCollectActorClaimsForRange(ctx, {
			metric: args.metric,
			scope: args.scope,
			dimensionKey,
			from: args.from,
			to: args.to,
			settings: config.settings,
			budget: args.budget,
		});

		return internalCountDistinctActorsFromClaims(claims);
	}

	const rows = await internalCollectMetricTotalRows(ctx, {
		metric: args.metric,
		metricConfig,
		scope: args.scope,
		dimensionKey,
		from: args.from,
		to: args.to,
		settings: config.settings,
		budget: args.budget,
	});

	// Decomposed rows exactly cover the range - no bucket filtering needed.
	return internalReduceMetricRollupRows(metricConfig.aggregation, rows);
}

export async function internalGetMetricTotalsForRanges(
	ctx: Pick<QueryCtx, "db">,
	config: typesAnalyticsConfigState,
	args: {
		metric: string;
		scope: typesAnalyticsScope;
		ranges: Array<{ key: string; from: number; to: number }>;
		dimensionKey?: string;
		budget?: typesReadBudget;
	},
) {
	if (args.ranges.length === 0) {
		return new Map<string, number>();
	}

	const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
	const budget = args.budget ?? internalCreateReadBudget(config.settings);
	const totals = new Map<string, number>();

	// Sequential: each range's reads are bounded by what the shared budget
	// still allows, keeping the whole query under Convex transaction limits.
	for (const range of args.ranges) {
		if (
			metricConfig.aggregation === "distinctActors" &&
			!internalIsSingleUtcDayRange(range.from, range.to)
		) {
			const claims = await internalCollectActorClaimsForRange(ctx, {
				metric: args.metric,
				scope: args.scope,
				dimensionKey: args.dimensionKey ?? TOTAL_DIMENSION,
				from: range.from,
				to: range.to,
				settings: config.settings,
				budget,
			});
			totals.set(range.key, internalCountDistinctActorsFromClaims(claims));
			continue;
		}

		const rows = await internalCollectMetricTotalRows(ctx, {
			metric: args.metric,
			metricConfig,
			scope: args.scope,
			dimensionKey: args.dimensionKey ?? TOTAL_DIMENSION,
			from: range.from,
			to: range.to,
			settings: config.settings,
			budget,
		});

		totals.set(
			range.key,
			internalReduceMetricRollupRows(metricConfig.aggregation, rows),
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
		budget?: typesReadBudget;
	},
): Promise<Map<string, number>> {
	const days = args.days ?? DEFAULT_TOTAL_DAYS;
	if (!Number.isInteger(days) || days <= 0) {
		throw new ConvexError({
			code: "BAD_REQUEST",
			message: "`days` must be a positive integer.",
		});
	}
	if (days > ANALYTICS_LIMITS.maxQueryRangeDays) {
		throw new ConvexError({
			code: "BAD_REQUEST",
			message: `\`days\` must be at most ${ANALYTICS_LIMITS.maxQueryRangeDays}.`,
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

		const claims = await internalCollectActorClaimsForRange(ctx, {
			metric: args.metric,
			scope: {
				scopeType: args.scopeType,
				scopeId: args.scopeId,
			},
			dimensionKey: args.dimensionKey,
			from,
			to: todayStart,
			settings: args.settings,
			budget: args.budget,
		});

		return internalCountDistinctActorsByDimensionFromClaims(claims);
	}

	const granularity = args.granularity ?? "day";

	// Day metrics read the decomposed cover (month rows for full months, day
	// rows for the edges), so a 366-day breakdown stays a handful of rows.
	if (granularity === "day" && args.settings) {
		const scope = {
			type: args.scopeType,
			id: args.scopeId,
		} as typesAnalyticsScope;
		const budget = args.budget ?? internalCreateReadBudget(args.settings);
		const { dayRanges, months } = decomposeUtcRangeForRollups(from, todayStart);

		const decomposedRows: Awaited<
			ReturnType<typeof internalCollectDailyMetricRows>
		> = [];
		for (const range of dayRanges) {
			decomposedRows.push(
				...(await internalCollectDailyMetricRows(ctx, {
					metric: args.metric,
					scope,
					dimensionKey: args.dimensionKey,
					from: range.from,
					to: range.to,
					settings: args.settings,
					granularity: "day",
					budget,
				})),
			);
		}
		if (months) {
			decomposedRows.push(
				...(await internalCollectDailyMetricRows(ctx, {
					metric: args.metric,
					scope,
					dimensionKey: args.dimensionKey,
					from: months.from,
					to: months.to,
					settings: args.settings,
					granularity: "month",
					budget,
				})),
			);
		}

		if (decomposedRows.length > maxRows) {
			throw new ConvexError({
				code: "QUERY_TOO_LARGE",
				message:
					`Analytics total query matched more than ${maxRows} rollup rows. ` +
					"Reduce the requested days, scope, or dimension cardinality.",
			});
		}

		return internalReduceMetricRollupTotalsByKey(
			args.aggregation ?? "sum",
			decomposedRows,
		);
	}

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
		.take(Math.min(maxRows, ANALYTICS_READ_BUDGET_CEILING) + 1);

	if (rows.length > Math.min(maxRows, ANALYTICS_READ_BUDGET_CEILING)) {
		throw new ConvexError({
			code: "QUERY_TOO_LARGE",
			message:
				`Analytics total query matched more than ${Math.min(maxRows, ANALYTICS_READ_BUDGET_CEILING)} rollup rows. ` +
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
		budget?: typesReadBudget;
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
