// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { getConfig } from "../analyticsConfig";

// CONSTANTS
import { TOTAL_DIMENSION } from "../constants";

// HELPERS
import { collectDailyMetricRows } from "../helpers/collectDailyMetricRows";

// UTILS
import { resolveScope } from "../utils/shared/scopeUtils";
import { startOfUtcDay } from "../utils/common/dateUtils";
import { badRequest } from "../errors/errors";
import { assertDateRange } from "../validations/validations";

// SCHEMAS
import {
		rangeValidator,
		resolvedScopeValidator,
		scopeInputValidator,
		unitValidator,
} from "../schemas/schemas";

/**
 * Compare a metric between two equal-length periods.
 *
 * The previous period is auto-calculated by shifting the current range
 * backward by its duration. Runs two parallel rollup queries. Returns
 * current, previous, delta, and deltaPercent (undefined if previous is 0).
 *
 * @example
 * const result = await ctx.runQuery(components.analytics.lib.fetchMetricComparison, {
 *   metric: "pageViews",
 *   from: Date.UTC(2026, 5, 1),
 *   to: Date.UTC(2026, 5, 7),
 * });
 */
export const fetchMetricComparison = query({
		args: {
				metric: v.string(),
				from: v.number(),
				to: v.number(),
				scope: v.optional(scopeInputValidator),
		},
		returns: v.object({
				metric: v.string(),
				label: v.string(),
				unit: unitValidator,
				scope: resolvedScopeValidator,
				current: v.number(),
				previous: v.number(),
				delta: v.number(),
				deltaPercent: v.optional(v.number()),
				range: v.object({
						current: rangeValidator,
						previous: rangeValidator,
				}),
		}),
		handler: async (ctx, args) => {
				const rangeMs = args.to - args.from;
				const previousFrom = args.from - rangeMs;
				const previousTo = args.from;
		
				const config = await getConfig(ctx);
				assertDateRange({ from: args.from, to: args.to }, config.settings);
				assertDateRange({ from: previousFrom, to: previousTo }, config.settings);
		
				const metricConfig = config.metricByName.get(args.metric);
				if (!metricConfig) badRequest(`Unknown analytics metric "${args.metric}".`);
		
				const scope = resolveScope(args.scope);
		
				const [currentRows, previousRows] = await Promise.all([
						collectDailyMetricRows(ctx, {
								metric: args.metric,
								scope,
								dimensionKey: TOTAL_DIMENSION,
								from: args.from,
								to: args.to,
								settings: config.settings,
						}),
						collectDailyMetricRows(ctx, {
								metric: args.metric,
								scope,
								dimensionKey: TOTAL_DIMENSION,
								from: previousFrom,
								to: previousTo,
								settings: config.settings,
						}),
				]);
		
				const current = currentRows.reduce((total, row) => total + row.value, 0);
				const previous = previousRows.reduce((total, row) => total + row.value, 0);
				const delta = current - previous;
				const deltaPercent = previous !== 0 ? (delta / previous) * 100 : undefined;
		
				return {
						metric: args.metric,
						label: metricConfig.label,
						unit: metricConfig.unit,
						scope,
						current,
						previous,
						delta,
						deltaPercent,
						range: {
								current: {
										from: startOfUtcDay(args.from),
										to: startOfUtcDay(args.to),
								},
								previous: {
										from: startOfUtcDay(previousFrom),
										to: startOfUtcDay(previousTo),
								},
						},
				};
		},
});
