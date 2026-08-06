// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalChartConfig } from "../analyticsConfig";
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// CONSTANTS
import { TOTAL_DIMENSION } from "../../shared/constants.js";
import { ANALYTICS_UTC_TIMEZONE } from "../../shared/utils/analyticsTimezoneUtils.js";

// HELPERS
import {
	internalCollectDailyActorClaims,
	internalCollectDailyMetricRows,
	internalCollectMetricTotalRows,
} from "../helpers/rollupReads";
import { internalCreateReadBudget } from "../helpers/readBudget";
import {
	internalGetMetricBucketStart,
	internalGetMetricConfigOrThrow,
	internalGetMetricRollupGranularity,
} from "../utils/shared/metricUtils";

// UTILS
import {
	getQueryBucketStart,
	listRollupBuckets,
} from "../../shared/utils/analyticsDateRangeUtils.js";
import {
	internalBuildBucketedTimeSeriesPoints,
	internalBuildDistinctActorTimeSeriesPoints,
} from "../../shared/utils/analyticsQueryBucketUtils.js";
import { internalGetTopSeriesKeys } from "../utils/getTopSeriesKeys";
import { internalResolveScope } from "../utils/shared/scopeUtils";
import { internalReduceMetricRollupRows } from "../../shared/utils/metricAggregationUtils.js";
import {
	internalResolveQueryBucketUnit,
	internalResolveQueryTimezone,
	internalUsesDistinctActorClaimTimeSeries,
	internalUsesRollupRebucketTimeSeries,
} from "../utils/queryOptionsUtils";
import {
	internalAssertDateRange,
	internalAssertAllowedDimension,
} from "../validations/validations";

// SCHEMAS
import {
	bucketUnitValidator,
	configReferenceFields,
	chartConfigValidator,
	rangeValidator,
	resolvedScopeValidator,
	scopeInputValidator,
	timezoneValidator,
	unitValidator,
} from "../schemas/schemas";

/**
 * Bucketed chart data with optional dimension grouping.
 *
 * Returns one data point per query bucket (day, week, or month). When
 * `groupBy` is set, each point contains a value per dimension key. Fills
 * gaps with zeros by default. Hits indexed rollup rows, not raw events.
 */
export const fetchTimeSeries = query({
	args: {
		...configReferenceFields,
		metric: v.string(),
		from: v.number(),
		to: v.number(),
		groupBy: v.optional(v.string()),
		scope: v.optional(scopeInputValidator),
		fill: v.optional(v.boolean()),
		bucketUnit: v.optional(bucketUnitValidator),
		timezone: v.optional(timezoneValidator),
	},
	returns: v.object({
		data: v.array(v.record(v.string(), v.number())),
		x: v.literal("date"),
		config: chartConfigValidator,
		meta: v.object({
			metric: v.string(),
			label: v.string(),
			unit: unitValidator,
			scope: resolvedScopeValidator,
			groupBy: v.optional(v.string()),
			bucketUnit: bucketUnitValidator,
			timezone: v.string(),
			seriesKeys: v.array(v.string()),
			omittedSeriesCount: v.number(),
			xValueType: v.literal("timestamp"),
			range: rangeValidator,
		}),
	}),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});
		internalAssertDateRange(args, config.settings);

		const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
		const granularity = internalGetMetricRollupGranularity(metricConfig);
		const bucketUnit = internalResolveQueryBucketUnit(args.bucketUnit);
		const timeZone = internalResolveQueryTimezone(args.timezone, config.settings);
		const scope = internalResolveScope(args.scope);
		const dimensionKey = args.groupBy ?? TOTAL_DIMENSION;
		const shouldFill = args.fill ?? true;
		const budget = internalCreateReadBudget(config.settings);

		if (args.groupBy) {
			internalAssertAllowedDimension(metricConfig, args.groupBy);
		}

		const rangeMeta = {
			from: getQueryBucketStart(args.from, bucketUnit, timeZone),
			to: getQueryBucketStart(args.to, bucketUnit, timeZone),
		};

		if (
			internalUsesDistinctActorClaimTimeSeries({
				aggregation: metricConfig.aggregation,
				bucketUnit,
				timeZone,
			})
		) {
			const claims = await internalCollectDailyActorClaims(ctx, {
				metric: args.metric,
				scope,
				dimensionKey,
				from: args.from,
				to: args.to,
				settings: config.settings,
				budget,
			});

			const allSeriesKeys = args.groupBy
				? [...new Set(claims.map((claim) => claim.dimensionValue))]
				: [args.metric];
			const seriesKeys = args.groupBy
				? getAnalyticsRankingSeriesKeys(claims, config.settings.maxBreakdownItems)
				: allSeriesKeys;

			const { data } = internalBuildDistinctActorTimeSeriesPoints({
				from: args.from,
				to: args.to,
				bucketUnit,
				timeZone,
				claims,
				seriesKeys,
				metricName: args.metric,
				...(args.groupBy ? { groupBy: args.groupBy } : {}),
				fill: shouldFill,
			});

			return buildTimeSeriesResponse({
				data,
				metric: args.metric,
				metricConfig,
				scope,
				groupBy: args.groupBy,
				bucketUnit,
				timeZone,
				seriesKeys,
				allSeriesKeys,
				range: rangeMeta,
			});
		}

		// Month charts in UTC re-bucket from the decomposed cover (month rows
		// for full months, day rows for partial edge months) — same result as
		// re-bucketing day rows, at a fraction of the rows read. Non-UTC month
		// charts keep day rows: UTC month rows do not align with local months.
		const useMonthTierRows =
			bucketUnit === "month" &&
			timeZone === ANALYTICS_UTC_TIMEZONE &&
			granularity === "day" &&
			metricConfig.aggregation !== "distinctActors";

		const rows = useMonthTierRows
			? await internalCollectMetricTotalRows(ctx, {
					metric: args.metric,
					metricConfig,
					scope,
					dimensionKey,
					from: args.from,
					to: args.to,
					settings: config.settings,
					budget,
				})
			: await internalCollectDailyMetricRows(ctx, {
					metric: args.metric,
					scope,
					dimensionKey,
					from: args.from,
					to: args.to,
					settings: config.settings,
					granularity,
					budget,
				});

		const allSeriesKeys = args.groupBy
			? [...new Set(rows.map((row) => row.dimensionValue))]
			: [args.metric];
		const seriesKeys = args.groupBy
			? internalGetTopSeriesKeys(rows, config.settings, metricConfig.aggregation)
			: allSeriesKeys;

		if (
			internalUsesRollupRebucketTimeSeries({
				bucketUnit,
				timeZone,
			})
		) {
			const { data } = internalBuildBucketedTimeSeriesPoints({
				from: args.from,
				to: args.to,
				bucketUnit,
				timeZone,
				aggregation: metricConfig.aggregation,
				rows,
				seriesKeys,
				metricName: args.metric,
				...(args.groupBy ? { groupBy: args.groupBy } : {}),
				fill: shouldFill,
			});

			return buildTimeSeriesResponse({
				data,
				metric: args.metric,
				metricConfig,
				scope,
				groupBy: args.groupBy,
				bucketUnit,
				timeZone,
				seriesKeys,
				allSeriesKeys,
				range: rangeMeta,
			});
		}

		const buckets = shouldFill
			? listRollupBuckets(args.from, args.to, granularity)
			: [...new Set(rows.map((row) => row.bucketStart))].sort((a, b) => a - b);
		const seriesKeySet = new Set(seriesKeys);
		const data = buckets.map((bucketStart) => {
			const point: Record<string, number> = { date: bucketStart };
			for (const key of seriesKeys) {
				point[key] = 0;
			}
			return point;
		});
		const pointByBucket = new Map(data.map((point) => [point.date, point]));
		const rowsByBucketAndSeries = new Map<
			string,
			Array<{ bucketStart: number; value: number; sampleCount?: number }>
		>();

		for (const row of rows) {
			const point = pointByBucket.get(row.bucketStart);
			if (!point) continue;

			const seriesKey = args.groupBy ? row.dimensionValue : args.metric;
			if (!seriesKeySet.has(seriesKey)) continue;

			const key = `${row.bucketStart}:${seriesKey}`;
			const bucketRows = rowsByBucketAndSeries.get(key) ?? [];
			bucketRows.push(row);
			rowsByBucketAndSeries.set(key, bucketRows);
		}

		for (const [key, bucketRows] of rowsByBucketAndSeries) {
			const separatorIndex = key.indexOf(":");
			const bucketStart = Number(key.slice(0, separatorIndex));
			const seriesKey = key.slice(separatorIndex + 1);
			const point = pointByBucket.get(bucketStart);
			if (!point) continue;

			point[seriesKey] = internalReduceMetricRollupRows(
				metricConfig.aggregation,
				bucketRows,
			);
		}

		return buildTimeSeriesResponse({
			data,
			metric: args.metric,
			metricConfig,
			scope,
			groupBy: args.groupBy,
			bucketUnit,
			timeZone,
			seriesKeys,
			allSeriesKeys,
			range: {
				from: internalGetMetricBucketStart(metricConfig, args.from),
				to: internalGetMetricBucketStart(metricConfig, args.to),
			},
		});
	},
});

function getAnalyticsRankingSeriesKeys(
	claims: Array<{ dimensionValue: string }>,
	limit: number,
) {
	const totals = new Map<string, number>();
	for (const claim of claims) {
		totals.set(claim.dimensionValue, (totals.get(claim.dimensionValue) ?? 0) + 1);
	}

	return [...totals.entries()]
		.sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
		.slice(0, limit)
		.map(([key]) => key);
}

function buildTimeSeriesResponse(args: {
	data: Array<Record<string, number>>;
	metric: string;
	metricConfig: ReturnType<typeof internalGetMetricConfigOrThrow>;
	scope: ReturnType<typeof internalResolveScope>;
	groupBy?: string;
	bucketUnit: ReturnType<typeof internalResolveQueryBucketUnit>;
	timeZone: string;
	seriesKeys: string[];
	allSeriesKeys: string[];
	range: { from: number; to: number };
}) {
	return {
		data: args.data,
		x: "date" as const,
		config:
			args.seriesKeys.length === 1 && args.seriesKeys[0] === args.metric
				? internalChartConfig(args.seriesKeys as string[], {
						[args.metric]: args.metricConfig.label,
					})
				: internalChartConfig(args.seriesKeys as string[]),
		meta: {
			metric: args.metric,
			label: args.metricConfig.label,
			unit: args.metricConfig.unit,
			scope: args.scope,
			...(args.groupBy ? { groupBy: args.groupBy } : {}),
			bucketUnit: args.bucketUnit,
			timezone:
				args.timeZone === ANALYTICS_UTC_TIMEZONE ? "UTC" : args.timeZone,
			seriesKeys: args.seriesKeys,
			omittedSeriesCount: Math.max(
				0,
				args.allSeriesKeys.length - args.seriesKeys.length,
			),
			xValueType: "timestamp" as const,
			range: args.range,
		},
	};
}
