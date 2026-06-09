// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { normalizeConfig } from "../analyticsConfig";

// HELPERS
import { getMetricTotalForRange } from "../helpers/rollupReads";

// UTILS
import { getMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { resolveScope } from "../utils/shared/scopeUtils";
import { startOfUtcDay } from "../utils/common/dateUtils";
import { assertDateRange } from "../validations/validations";
import { computeConversionRatePercent } from "../../shared/analyticsEvaluation";

// SCHEMAS
import {
	analyticsRuntimeConfigValidator,
	scopeInputValidator,
} from "../schemas/schemas";
import { metricConversionResponseValidator } from "../../shared/analyticsEvaluationSchemas";

/**
 * Rollup-based conversion between two metrics over the same date range.
 */
export const fetchMetricConversion = query({
	args: {
		config: analyticsRuntimeConfigValidator,
		numeratorMetric: v.string(),
		denominatorMetric: v.string(),
		from: v.number(),
		to: v.number(),
		scope: v.optional(scopeInputValidator),
	},
	returns: metricConversionResponseValidator,
	handler: async (ctx, args) => {
		const config = normalizeConfig(args.config);
		assertDateRange({ from: args.from, to: args.to }, config.settings);

		getMetricConfigOrThrow(config, args.numeratorMetric);
		getMetricConfigOrThrow(config, args.denominatorMetric);

		const scope = resolveScope(args.scope);

		const [numerator, denominator] = await Promise.all([
			getMetricTotalForRange(ctx, config, {
				metric: args.numeratorMetric,
				scope,
				from: args.from,
				to: args.to,
			}),
			getMetricTotalForRange(ctx, config, {
				metric: args.denominatorMetric,
				scope,
				from: args.from,
				to: args.to,
			}),
		]);

		return {
			numeratorMetric: args.numeratorMetric,
			denominatorMetric: args.denominatorMetric,
			numerator,
			denominator,
			ratePercent: computeConversionRatePercent({ numerator, denominator }),
			scope,
			range: {
				from: startOfUtcDay(args.from),
				to: startOfUtcDay(args.to),
			},
		};
	},
});
