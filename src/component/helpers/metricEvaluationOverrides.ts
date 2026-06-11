// UTILS
import { internalToMetricScope } from "../utils/shared/scopeUtils";

// TYPES
import type { QueryCtx } from "../_generated/server";
import type {
	typesAnalyticsConfigState,
} from "../../shared/types/componentInternal.js";
import type {
	typesAnalyticsScope,
} from "../../shared/types/scopes.js";
import type {
	typesMetricEvaluationConfig,
} from "../../shared/types/evaluation.js";

type typesOverrideReadCtx = Pick<QueryCtx, "db">;

/** Read the stored per-scope evaluation override row for one metric, if any. */
export async function internalFetchMetricEvaluationOverride(
	ctx: typesOverrideReadCtx,
	args: {
		metric: string;
		scope: typesAnalyticsScope;
	},
) {
	const { scopeType, scopeId } = internalToMetricScope(args.scope);

	return await ctx.db
		.query("analyticsMetricEvaluationOverrides")
		.withIndex("by_metric_scope", (q) =>
			q
				.eq("metric", args.metric)
				.eq("scopeType", scopeType)
				.eq("scopeId", scopeId),
		)
		.unique();
}

/**
 * Effective evaluation config per metric for one scope:
 * scope override first, then the static `.evaluation()` config.
 */
export async function internalResolveMetricEvaluations(
	ctx: typesOverrideReadCtx,
	config: typesAnalyticsConfigState,
	args: {
		metrics: string[];
		scope: typesAnalyticsScope;
	},
): Promise<Map<string, typesMetricEvaluationConfig | undefined>> {
	const evaluations = new Map<string, typesMetricEvaluationConfig | undefined>();

	await Promise.all(
		args.metrics.map(async (metric) => {
			const metricConfig = config.metricByName.get(metric);
			if (!metricConfig) return;

			const override = await internalFetchMetricEvaluationOverride(ctx, {
				metric,
				scope: args.scope,
			});

			evaluations.set(metric, override?.evaluation ?? metricConfig.evaluation);
		}),
	);

	return evaluations;
}
