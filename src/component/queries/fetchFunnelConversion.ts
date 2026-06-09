// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { normalizeConfig } from "../analyticsConfig";

// HELPERS
import { getMetricTotalForRange } from "../helpers/rollupReads";

// UTILS
import { getMetricConfigOrThrow } from "../utils/shared/metricUtils";
import { getFunnelConfigOrThrow } from "../utils/shared/funnelUtils";
import { resolveScope } from "../utils/shared/scopeUtils";
import { startOfUtcDay } from "../utils/common/dateUtils";
import { assertDateRange } from "../validations/validations";
import { badRequest } from "../errors/errors";
import { computeConversionRatePercent } from "../../shared/analyticsEvaluation";

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
		const config = normalizeConfig(args.config);
		assertDateRange({ from: args.from, to: args.to }, config.settings);

		const funnelConfig = getFunnelConfigOrThrow(config, args.funnel);
		if (funnelConfig.steps.length < 2) {
			badRequest(
				`Funnel "${args.funnel}" must include at least two metric steps.`,
			);
		}

		const denominatorMetric = funnelConfig.steps[0];
		const numeratorMetric = funnelConfig.steps[funnelConfig.steps.length - 1];

		getMetricConfigOrThrow(config, denominatorMetric);
		getMetricConfigOrThrow(config, numeratorMetric);

		const scope = resolveScope(args.scope);

		const [numerator, denominator] = await Promise.all([
			getMetricTotalForRange(ctx, config, {
				metric: numeratorMetric,
				scope,
				from: args.from,
				to: args.to,
			}),
			getMetricTotalForRange(ctx, config, {
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
				from: startOfUtcDay(args.from),
				to: startOfUtcDay(args.to),
			},
		};
	},
});
