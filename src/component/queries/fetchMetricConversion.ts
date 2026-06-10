// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// HELPERS
import { internalGetMetricTotalForRange } from "../helpers/rollupReads";

// UTILS
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { internalResolveScope } from "../utils/shared/scopeUtils";
import {
	startOfUtcDay,
} from "../../shared/utils/analyticsDateRangeUtils.js";
import { internalAssertDateRange } from "../validations/validations";
import { computeConversionRatePercent } from "../../shared/utils/analyticsEvaluationUtils";

// SCHEMAS
import {
	configReferenceFields,
	scopeInputValidator,
} from "../schemas/schemas";
import { metricConversionResponseValidator } from "../../shared/schemas/evaluationSchemas.js";

/**
 * Rollup-based conversion between two metrics over the same date range.
 */
export const fetchMetricConversion = query({
	args: {
		...configReferenceFields,
		numeratorMetric: v.string(),
		denominatorMetric: v.string(),
		from: v.number(),
		to: v.number(),
		scope: v.optional(scopeInputValidator),
	},
	returns: metricConversionResponseValidator,
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		
		});
		internalAssertDateRange({ from: args.from, to: args.to }, config.settings);

		internalGetMetricConfigOrThrow(config, args.numeratorMetric);
		internalGetMetricConfigOrThrow(config, args.denominatorMetric);

		const scope = internalResolveScope(args.scope);

		const [numerator, denominator] = await Promise.all([
			internalGetMetricTotalForRange(ctx, config, {
				metric: args.numeratorMetric,
				scope,
				from: args.from,
				to: args.to,
			}),
			internalGetMetricTotalForRange(ctx, config, {
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
