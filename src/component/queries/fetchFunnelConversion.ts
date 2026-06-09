// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalNormalizeConfig } from "../analyticsConfig";

// HELPERS
import { internalGetMetricTotalForRange } from "../helpers/rollupReads";

// UTILS
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { internalGetFunnelConfigOrThrow } from "../utils/shared/funnelUtils";
import { internalResolveScope } from "../utils/shared/scopeUtils";
import { internalStartOfUtcDay } from "../utils/common/dateUtils";
import { internalAssertDateRange } from "../validations/validations";
import { internalBadRequest } from "../errors/errors";
import { computeConversionRatePercent } from "../../shared/utils/analyticsEvaluationUtils";

// SCHEMAS
import {
	analyticsRuntimeConfigValidator,
	funnelConversionResponseValidator,
	scopeInputValidator,
} from "../schemas/schemas";

/**
 * Rollup-based conversion for a named funnel (first step → last step).
 */
export const fetchFunnelConversion = query({
	args: {
		config: analyticsRuntimeConfigValidator,
		funnel: v.string(),
		from: v.number(),
		to: v.number(),
		scope: v.optional(scopeInputValidator),
	},
	returns: funnelConversionResponseValidator,
	handler: async (ctx, args) => {
		const config = internalNormalizeConfig(args.config);
		internalAssertDateRange({ from: args.from, to: args.to }, config.settings);

		const funnelConfig = internalGetFunnelConfigOrThrow(config, args.funnel);
		if (funnelConfig.steps.length < 2) {
			internalBadRequest(
				`Funnel "${args.funnel}" must include at least two metric steps.`,
			);
		}

		const denominatorMetric = funnelConfig.steps[0];
		const numeratorMetric = funnelConfig.steps[funnelConfig.steps.length - 1];

		internalGetMetricConfigOrThrow(config, denominatorMetric);
		internalGetMetricConfigOrThrow(config, numeratorMetric);

		const scope = internalResolveScope(args.scope);

		const [numerator, denominator] = await Promise.all([
			internalGetMetricTotalForRange(ctx, config, {
				metric: numeratorMetric,
				scope,
				from: args.from,
				to: args.to,
			}),
			internalGetMetricTotalForRange(ctx, config, {
				metric: denominatorMetric,
				scope,
				from: args.from,
				to: args.to,
			}),
		]);

		return {
			funnel: args.funnel,
			label: funnelConfig.label,
			steps: funnelConfig.steps,
			numeratorMetric,
			denominatorMetric,
			numerator,
			denominator,
			ratePercent: computeConversionRatePercent({ numerator, denominator }),
			scope,
			range: {
				from: internalStartOfUtcDay(args.from),
				to: internalStartOfUtcDay(args.to),
			},
		};
	},
});
