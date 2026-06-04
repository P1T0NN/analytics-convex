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
 * Single aggregated total for a metric over a date range.
 *
 * Sums all rollup rows for the metric across the range. Returns the
 * total value, metric metadata, and resolved scope.
 *
 * @example
 * const result = await ctx.runQuery(components.analytics.lib.fetchSummary, {
 *   metric: "featureUses",
 *   from: Date.UTC(2026, 0, 1),
 *   to: Date.UTC(2026, 0, 31),
 * });
 */
export const fetchSummary = query({
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
				value: v.number(),
				range: rangeValidator,
		}),
		handler: async (ctx, args) => {
				const config = await getConfig(ctx);
				assertDateRange(args, config.settings);
		
				const metricConfig = config.metricByName.get(args.metric);
				if (!metricConfig) badRequest(`Unknown analytics metric "${args.metric}".`);
		
				const scope = resolveScope(args.scope);
				const rows = await collectDailyMetricRows(ctx, {
						metric: args.metric,
						scope,
						dimensionKey: TOTAL_DIMENSION,
						from: args.from,
						to: args.to,
						settings: config.settings,
				});
		
				return {
						metric: args.metric,
						label: metricConfig.label,
						unit: metricConfig.unit,
						scope,
						value: rows.reduce((total, row) => total + row.value, 0),
						range: {
								from: startOfUtcDay(args.from),
								to: startOfUtcDay(args.to),
						},
				};
		},
});
