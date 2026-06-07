// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { normalizeConfig } from "../analyticsConfig";

// HELPERS
import { getAnalyticsMetricTotalsByDimension } from "../helpers/rollupReads";

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
 * Aggregated totals by dimension value.
 *
 * Component query wrapper around the component-owned rollup table. App-side
 * helpers should call this through `ctx.runQuery(component.lib...)` instead of
 * reading `ctx.db` from the consuming app.
 */
export const fetchMetricTotalsByDimension = query({
	args: {
		config: analyticsRuntimeConfigValidator,
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
		const config = normalizeConfig(args.config);
		const metricConfig = getMetricConfigOrThrow(config, args.metric);
		assertAllowedDimension(metricConfig, args.dimensionKey);

		const scope = toMetricScope(resolveScope(args.scope));
		const totals = await getAnalyticsMetricTotalsByDimension(ctx, {
			metric: args.metric,
			scopeType: scope.scopeType,
			scopeId: scope.scopeId,
			dimensionKey: args.dimensionKey,
			...(args.days !== undefined ? { days: args.days } : {}),
			...(args.maxRows !== undefined ? { maxRows: args.maxRows } : {}),
		});

		return [...totals.entries()]
			.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
			.map(([key, value]) => ({ key, value }));
	},
});
