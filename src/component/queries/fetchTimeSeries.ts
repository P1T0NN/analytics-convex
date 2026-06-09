// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalChartConfig } from "../analyticsConfig";
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// CONSTANTS
import { TOTAL_DIMENSION } from "../../shared/constants.js";

// HELPERS
import { internalCollectDailyMetricRows } from "../helpers/rollupReads";
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";

// UTILS
import { internalListDailyBuckets } from "../utils/listDailyBuckets";
import { internalGetTopSeriesKeys } from "../utils/getTopSeriesKeys";
import { internalResolveScope } from "../utils/shared/scopeUtils";
import { internalStartOfUtcDay } from "../utils/common/dateUtils";
import {
	internalAssertDateRange,
	internalAssertAllowedDimension,
} from "../validations/validations";

// SCHEMAS
import {
	configReferenceFields,
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
		...configReferenceFields,
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
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		
		});
		internalAssertDateRange(args, config.settings);

		const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);

		const scope = internalResolveScope(args.scope);
		const dimensionKey = args.groupBy ?? TOTAL_DIMENSION;

		if (args.groupBy) {
			internalAssertAllowedDimension(metricConfig, args.groupBy);
		}

		const rows = (await internalCollectDailyMetricRows(ctx, {
			metric: args.metric,
			scope,
			dimensionKey,
			from: args.from,
			to: args.to,
			settings: config.settings,
		})) as Array<{
			bucketStart: number;
			dimensionValue: string;
			value: number;
		}>;

		const shouldFill = args.fill ?? true;

		const buckets = shouldFill
			? internalListDailyBuckets(args.from, args.to)
			: [...new Set(rows.map((row: any) => row.bucketStart))].sort(
					(a, b) => a - b,
				);

		const allSeriesKeys = args.groupBy
			? [...new Set(rows.map((row: any) => row.dimensionValue))]
			: [args.metric];

		const seriesKeys = args.groupBy
			? internalGetTopSeriesKeys(rows as any, config.settings)
			: allSeriesKeys;

		const seriesKeySet = new Set(seriesKeys);

		const data = buckets.map((bucketStart) => {
			const point: Record<string, number> = { date: bucketStart };

			for (const key of seriesKeys) {
				point[key as string] = 0;
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
					? internalChartConfig(seriesKeys as string[], {
							[args.metric]: metricConfig.label,
						})
					: internalChartConfig(seriesKeys as string[]),
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
					from: internalStartOfUtcDay(args.from),
					to: internalStartOfUtcDay(args.to),
				},
			},
		};
	},
});
