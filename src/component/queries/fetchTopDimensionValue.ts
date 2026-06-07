// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { normalizeConfig } from "../analyticsConfig";

// HELPERS
import { getAnalyticsTopDimensionValue } from "../helpers/rollupReads";

// UTILS
import { getMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { resolveScope, toMetricScope } from "../utils/shared/scopeUtils";
import { assertAllowedDimension } from "../validations/validations";

// SCHEMAS
import {
	analyticsRuntimeConfigValidator,
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
		config: analyticsRuntimeConfigValidator,
		metric: v.string(),
		scope: v.optional(scopeInputValidator),
		dimensionKey: v.string(),
		days: v.optional(v.number()),
	},
	returns: v.union(v.string(), v.null()),
	handler: async (ctx, args) => {
		const config = normalizeConfig(args.config);
		const metricConfig = getMetricConfigOrThrow(config, args.metric);
		assertAllowedDimension(metricConfig, args.dimensionKey);

		const scope = toMetricScope(resolveScope(args.scope));

		return await getAnalyticsTopDimensionValue(ctx, {
			metric: args.metric,
			scopeType: scope.scopeType,
			scopeId: scope.scopeId,
			dimensionKey: args.dimensionKey,
			...(args.days !== undefined ? { days: args.days } : {}),
		});
	},
});
