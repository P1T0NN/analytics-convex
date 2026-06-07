// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { normalizeConfig } from "../analyticsConfig";

// HELPERS
import { getMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { getMetricTotalForRange } from "../helpers/rollupReads";

// UTILS
import { resolveScope } from "../utils/shared/scopeUtils";
import { startOfUtcDay } from "../utils/common/dateUtils";
import { assertDateRange } from "../validations/validations";

// SCHEMAS
import {
	analyticsRuntimeConfigValidator,
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
		config: analyticsRuntimeConfigValidator,
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

		const config = normalizeConfig(args.config);
		assertDateRange({ from: args.from, to: args.to }, config.settings);
		assertDateRange({ from: previousFrom, to: previousTo }, config.settings);

		const metricConfig = getMetricConfigOrThrow(config, args.metric);
		const scope = resolveScope(args.scope);

		const [current, previous] = await Promise.all([
			getMetricTotalForRange(ctx, config, {
				metric: args.metric,
				scope,
				from: args.from,
				to: args.to,
			}),
			getMetricTotalForRange(ctx, config, {
				metric: args.metric,
				scope,
				from: previousFrom,
				to: previousTo,
			}),
		]);

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
