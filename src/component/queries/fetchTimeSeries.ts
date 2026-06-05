// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { getConfig, chartConfig } from "../analyticsConfig";

// CONSTANTS
import { TOTAL_DIMENSION } from "../constants";

// HELPERS
import { collectDailyMetricRows } from "../helpers/collectDailyMetricRows";
import { getMetricConfigOrThrow } from "../utils/shared/metricUtils";

// UTILS
import { listDailyBuckets } from "../utils/listDailyBuckets";
import { getTopSeriesKeys } from "../utils/getTopSeriesKeys";
import { resolveScope } from "../utils/shared/scopeUtils";
import { startOfUtcDay } from "../utils/common/dateUtils";
import {
	assertDateRange,
	assertAllowedDimension,
} from "../validations/validations";

// SCHEMAS
import {
	chartConfigValidator,
	rangeValidator,
	resolvedScopeValidator,
	scopeInputValidator,
	unitValidator,
} from "../schemas/schemas";

/**
 * Daily bucketed chart data with optional dimension grouping.
 *
 * Returns one data point per day. When `groupBy` is set, each point
 * contains a value per dimension key. Fills gaps with zeros by default.
 * Hits indexed rollup rows, not raw events.
 *
 * @example
 * const result = await ctx.runQuery(components.analytics.lib.fetchTimeSeries, {
 *   metric: "pageViews",
 *   from: Date.UTC(2026, 0, 1),
 *   to: Date.UTC(2026, 0, 31),
 *   groupBy: "path",
 * });
 */
export const fetchTimeSeries = query({
	args: {
		metric: v.string(),
		from: v.number(),
		to: v.number(),
		groupBy: v.optional(v.string()),
		scope: v.optional(scopeInputValidator),
		fill: v.optional(v.boolean()),
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
			seriesKeys: v.array(v.string()),
			omittedSeriesCount: v.number(),
			xValueType: v.literal("timestamp"),
			range: rangeValidator,
		}),
	}),
	handler: async (ctx, args) => {
		const config = await getConfig(ctx);
		assertDateRange(args, config.settings);

		const metricConfig = getMetricConfigOrThrow(config, args.metric);

		const scope = resolveScope(args.scope);
		const dimensionKey = args.groupBy ?? TOTAL_DIMENSION;

		if (args.groupBy) {
			assertAllowedDimension(metricConfig, args.groupBy);
		}

		const rows = await collectDailyMetricRows(ctx, {
			metric: args.metric,
			scope,
			dimensionKey,
			from: args.from,
			to: args.to,
			settings: config.settings,
		});

		const shouldFill = args.fill ?? true;

		const buckets = shouldFill
			? listDailyBuckets(args.from, args.to)
			: [...new Set(rows.map((row) => row.bucketStart))].sort((a, b) => a - b);

		const allSeriesKeys = args.groupBy
			? [...new Set(rows.map((row) => row.dimensionValue))]
			: [args.metric];

		const seriesKeys = args.groupBy
			? getTopSeriesKeys(rows, config.settings)
			: allSeriesKeys;

		const seriesKeySet = new Set(seriesKeys);

		const data = buckets.map((bucketStart) => {
			const point: Record<string, number> = { date: bucketStart };

			for (const key of seriesKeys) {
				point[key] = 0;
			}

			return point;
		});

		const pointByBucket = new Map(data.map((point) => [point.date, point]));

		for (const row of rows) {
			const point = pointByBucket.get(row.bucketStart);
			if (!point) continue;

			const seriesKey = args.groupBy ? row.dimensionValue : args.metric;
			if (!seriesKeySet.has(seriesKey)) continue;

			point[seriesKey] = (point[seriesKey] ?? 0) + row.value;
		}

		return {
			data,
			x: "date" as const,
			config:
				seriesKeys.length === 1 && seriesKeys[0] === args.metric
					? chartConfig(seriesKeys, { [args.metric]: metricConfig.label })
					: chartConfig(seriesKeys),
			meta: {
				metric: args.metric,
				label: metricConfig.label,
				unit: metricConfig.unit,
				scope,
				...(args.groupBy ? { groupBy: args.groupBy } : {}),
				seriesKeys,
				omittedSeriesCount: Math.max(
					0,
					allSeriesKeys.length - seriesKeys.length,
				),
				xValueType: "timestamp" as const,
				range: {
					from: startOfUtcDay(args.from),
					to: startOfUtcDay(args.to),
				},
			},
		};
	},
});
