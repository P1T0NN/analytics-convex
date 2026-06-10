// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// HELPERS
import { internalBuildMetricEvaluationResult } from "../helpers/evaluateMetricForRange";

// UTILS
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { internalResolveScope } from "../utils/shared/scopeUtils";
import {
	startOfUtcDay,
} from "../../shared/utils/analyticsDateRangeUtils.js";
import { internalAssertDateRange } from "../validations/validations";

// SCHEMAS
import {
	configReferenceFields,
	metricEvaluationResponseValidator,
	scopeInputValidator,
} from "../schemas/schemas";

/**
 * Evaluate a metric's dashboard health label for a date range.
 *
 * Uses the metric's `.evaluation()` config when present. Labels are computed
 * at query time from rollup totals — never stored in rollup tables.
 */
export const fetchMetricEvaluation = query({
	args: {
		...configReferenceFields,
		metric: v.string(),
		from: v.number(),
		to: v.number(),
		scope: v.optional(scopeInputValidator),
	},
	returns: metricEvaluationResponseValidator,
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		
		});
		internalAssertDateRange({ from: args.from, to: args.to }, config.settings);

		const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
		const scope = internalResolveScope(args.scope);

		const result = await internalBuildMetricEvaluationResult(ctx, config, {
			metric: args.metric,
			metricConfig,
			evaluation: metricConfig.evaluation,
			scope,
			from: args.from,
			to: args.to,
		});

		return {
			metric: args.metric,
			label: metricConfig.label,
			unit: metricConfig.unit,
			scope,
			value: result.value,
			range: {
				from: startOfUtcDay(args.from),
				to: startOfUtcDay(args.to),
			},
			evaluation: result.evaluation,
			...(result.comparison ? { comparison: result.comparison } : {}),
			...(result.conversion ? { conversion: result.conversion } : {}),
			...(result.goal ? { goal: result.goal } : {}),
		};
	},
});
