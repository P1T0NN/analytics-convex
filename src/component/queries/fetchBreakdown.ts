// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalChartConfig } from "../analyticsConfig";
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// HELPERS
import { internalCollectDailyMetricRows } from "../helpers/rollupReads";
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";

// UTILS
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
 * Top dimension values ranked by total.
 *
 * Groups rollup rows by dimension value, ranks by descending total,
 * and returns the top N entries (capped by maxBreakdownItems in settings).
 * Includes omittedSeriesCount in meta for values that didn't make the cut.
 *
 * @example
 * const result = await ctx.runQuery(components.analytics.lib.fetchBreakdown, {
 *   metric: "featureUses",
 *   from: Date.UTC(2026, 0, 1),
 *   to: Date.UTC(2026, 0, 31),
 *   groupBy: "feature",
 * });
 */
export const fetchBreakdown = query({
	args: {
		...configReferenceFields,
		metric: v.string(),
		from: v.number(),
		to: v.number(),
		groupBy: v.string(),
		scope: v.optional(scopeInputValidator),
	},
	returns: v.object({
		data: v.array(
			v.object({
				key: v.string(),
				value: v.number(),
			}),
		),
		config: chartConfigValidator,
		meta: v.object({
			metric: v.string(),
			label: v.string(),
			unit: unitValidator,
			scope: resolvedScopeValidator,
			groupBy: v.string(),
			omittedSeriesCount: v.number(),
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
		internalAssertAllowedDimension(metricConfig, args.groupBy);

		const scope = internalResolveScope(args.scope);
		const rows = await internalCollectDailyMetricRows(ctx, {
			metric: args.metric,
			scope,
			dimensionKey: args.groupBy,
			from: args.from,
			to: args.to,
			settings: config.settings,
		});
		const totals = new Map<string, number>();

		for (const row of rows) {
			totals.set(
				row.dimensionValue,
				(totals.get(row.dimensionValue) ?? 0) + row.value,
			);
		}

		const data = [...totals.entries()]
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.slice(0, config.settings.maxBreakdownItems)
			.map(([key, value]) => ({ key, value }));

		return {
			data,
			config: internalChartConfig(data.map((item) => item.key)),
			meta: {
				metric: args.metric,
				label: metricConfig.label,
				unit: metricConfig.unit,
				scope,
				groupBy: args.groupBy,
				omittedSeriesCount: Math.max(0, totals.size - data.length),
				range: {
					from: internalStartOfUtcDay(args.from),
					to: internalStartOfUtcDay(args.to),
				},
			},
		};
	},
});
