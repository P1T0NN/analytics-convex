// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// HELPERS
import { internalGetAnalyticsTopDimensionValue } from "../helpers/rollupReads";

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
 * Highest-value dimension entry, or null.
 *
 * Component query wrapper around the component-owned rollup table. App-side
 * helpers should call this through `ctx.runQuery(component.lib...)` instead of
 * reading `ctx.db` from the consuming app.
 */
export const fetchTopDimensionValue = query({
	args: {
		...configReferenceFields,
		metric: v.string(),
		scope: v.optional(scopeInputValidator),
		dimensionKey: v.string(),
		days: v.optional(v.number()),
	},
	returns: v.union(v.string(), v.null()),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		
		});
		const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
		internalAssertAllowedDimension(metricConfig, args.dimensionKey);

		const scope = internalToMetricScope(internalResolveScope(args.scope));

		return await internalGetAnalyticsTopDimensionValue(ctx, {
			metric: args.metric,
			scopeType: scope.scopeType,
			scopeId: scope.scopeId,
			dimensionKey: args.dimensionKey,
			aggregation: metricConfig.aggregation,
			settings: config.settings,
			granularity: internalGetMetricRollupGranularity(metricConfig),
			budget: internalCreateReadBudget(config.settings),
			...(args.days !== undefined ? { days: args.days } : {}),
		});
	},
});
