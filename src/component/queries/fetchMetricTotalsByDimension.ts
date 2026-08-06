// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// HELPERS
import { internalGetAnalyticsMetricTotalsByDimension } from "../helpers/rollupReads";

// UTILS
import {
	internalGetMetricConfigOrThrow,
	internalGetMetricRollupGranularity,
} from "../utils/shared/metricUtils";
import { internalResolveScope, internalToMetricScope } from "../utils/shared/scopeUtils";
import { internalCreateReadBudget } from "../helpers/readBudget";
import { internalAssertAllowedDimension } from "../validations/validations";

// SCHEMAS
import {
	configReferenceFields,
	scopeInputValidator,
} from "../schemas/schemas";

/**
 * Aggregated totals by dimension value.
 *
 * Component query wrapper around the component-owned rollup table. App-side
 * helpers should call this through `ctx.runQuery(component.lib...)` instead of
 * reading `ctx.db` from the consuming app.
 */
export const fetchMetricTotalsByDimension = query({
	args: {
		...configReferenceFields,
		metric: v.string(),
		scope: v.optional(scopeInputValidator),
		dimensionKey: v.string(),
		days: v.optional(v.number()),
		maxRows: v.optional(v.number()),
	},
	returns: v.array(
		v.object({
			key: v.string(),
			value: v.number(),
		}),
	),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		
		});
		const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
		internalAssertAllowedDimension(metricConfig, args.dimensionKey);

		const scope = internalToMetricScope(internalResolveScope(args.scope));
		const totals = await internalGetAnalyticsMetricTotalsByDimension(ctx, {
			metric: args.metric,
			scopeType: scope.scopeType,
			scopeId: scope.scopeId,
			dimensionKey: args.dimensionKey,
			aggregation: metricConfig.aggregation,
			settings: config.settings,
			granularity: internalGetMetricRollupGranularity(metricConfig),
			budget: internalCreateReadBudget(config.settings),
			...(args.days !== undefined ? { days: args.days } : {}),
			...(args.maxRows !== undefined ? { maxRows: args.maxRows } : {}),
		});

		return [...totals.entries()]
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.map(([key, value]) => ({ key, value }));
	},
});
