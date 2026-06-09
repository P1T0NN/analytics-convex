// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// HELPERS
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { internalGetMetricTotalForRange } from "../helpers/rollupReads";

// UTILS
import { internalResolveScope } from "../utils/shared/scopeUtils";
import { internalStartOfUtcDay } from "../utils/common/dateUtils";
import { internalAssertDateRange } from "../validations/validations";

// SCHEMAS
import {
	configReferenceFields,
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
		...configReferenceFields,
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
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		
		});
		internalAssertDateRange(args, config.settings);

		const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
		const scope = internalResolveScope(args.scope);
		const value = await internalGetMetricTotalForRange(ctx, config, {
			metric: args.metric,
			scope,
			from: args.from,
			to: args.to,
		});

		return {
			metric: args.metric,
			label: metricConfig.label,
			unit: metricConfig.unit,
			scope,
			value,
			range: {
				from: internalStartOfUtcDay(args.from),
				to: internalStartOfUtcDay(args.to),
			},
		};
	},
});
