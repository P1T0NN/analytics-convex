// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// HELPERS
import { internalFetchMetricEvaluationOverride } from "../helpers/metricEvaluationOverrides";

// UTILS
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { internalResolveScope } from "../utils/shared/scopeUtils";

// SCHEMAS
import {
	configReferenceFields,
	metricEvaluationConfigResponseValidator,
	scopeInputValidator,
} from "../schemas/schemas";

/**
 * Read the effective evaluation config for a metric in a scope.
 *
 * Returns the per-scope override when one exists, otherwise the static
 * `.evaluation()` config. `configEvaluation` always carries the static
 * default so settings UIs can show "reset to default" affordances.
 */
export const fetchMetricEvaluationConfig = query({
	args: {
		...configReferenceFields,
		metric: v.string(),
		scope: v.optional(scopeInputValidator),
	},
	returns: metricEvaluationConfigResponseValidator,
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});
		const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);

		const scope = internalResolveScope(args.scope);
		const override = await internalFetchMetricEvaluationOverride(ctx, {
			metric: args.metric,
			scope,
		});

		return {
			metric: args.metric,
			scope,
			evaluation: override?.evaluation ?? metricConfig.evaluation ?? null,
			source: override
				? ("override" as const)
				: metricConfig.evaluation
					? ("config" as const)
					: ("none" as const),
			...(metricConfig.evaluation
				? { configEvaluation: metricConfig.evaluation }
				: {}),
		};
	},
});
