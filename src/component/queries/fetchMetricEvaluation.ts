// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { normalizeConfig } from "../analyticsConfig";

// HELPERS
import { buildMetricEvaluationResult } from "../helpers/evaluateMetricForRange";

// UTILS
import { getMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { resolveScope } from "../utils/shared/scopeUtils";
import { startOfUtcDay } from "../utils/common/dateUtils";
import { assertDateRange } from "../validations/validations";

// SCHEMAS
import {
	analyticsRuntimeConfigValidator,
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
		config: analyticsRuntimeConfigValidator,
		metric: v.string(),
		from: v.number(),
		to: v.number(),
		scope: v.optional(scopeInputValidator),
	},
	returns: metricEvaluationResponseValidator,
	handler: async (ctx, args) => {
		const config = normalizeConfig(args.config);
		assertDateRange({ from: args.from, to: args.to }, config.settings);

		const metricConfig = getMetricConfigOrThrow(config, args.metric);
		const scope = resolveScope(args.scope);

		const result = await buildMetricEvaluationResult(ctx, config, {
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
		};
	},
});
