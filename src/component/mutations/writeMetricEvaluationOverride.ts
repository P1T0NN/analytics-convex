// LIBRARIES
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// CONFIG
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// HELPERS
import { internalFetchMetricEvaluationOverride } from "../helpers/metricEvaluationOverrides";

// UTILS
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";
import {
	internalResolveScope,
	internalToMetricScope,
} from "../utils/shared/scopeUtils";
import { internalValidateMetricEvaluationConfig } from "../validations/validations";

// SCHEMAS
import {
	configReferenceFields,
	metricEvaluationConfigValidator,
	scopeInputValidator,
} from "../schemas/schemas";

/**
 * Set or clear a per-scope evaluation override for one metric.
 *
 * Passing `evaluation: null` removes the override so the metric falls back to
 * the static `.evaluation()` config from `defineAnalytics`. Overrides apply
 * only to the exact scope they are written for.
 */
export const writeMetricEvaluationOverride = mutation({
	args: {
		...configReferenceFields,
		metric: v.string(),
		scope: v.optional(scopeInputValidator),
		evaluation: v.union(metricEvaluationConfigValidator, v.null()),
	},
	returns: v.null(),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});
		internalGetMetricConfigOrThrow(config, args.metric);

		const scope = internalResolveScope(args.scope);
		const existing = await internalFetchMetricEvaluationOverride(ctx, {
			metric: args.metric,
			scope,
		});

		if (args.evaluation === null) {
			if (existing) {
				await ctx.db.delete("analyticsMetricEvaluationOverrides", existing._id);
			}
			return null;
		}

		internalValidateMetricEvaluationConfig({
			metric: args.metric,
			evaluation: args.evaluation,
			metricNames: new Set(config.metricByName.keys()),
		});

		const { scopeType, scopeId } = internalToMetricScope(scope);
		const row = {
			metric: args.metric,
			scopeType,
			scopeId,
			evaluation: args.evaluation,
			updatedAt: Date.now(),
		};

		if (existing) {
			await ctx.db.replace(
				"analyticsMetricEvaluationOverrides",
				existing._id,
				row,
			);
		} else {
			await ctx.db.insert("analyticsMetricEvaluationOverrides", row);
		}

		return null;
	},
});
