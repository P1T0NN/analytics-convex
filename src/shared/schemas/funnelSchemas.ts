// LIBRARIES
import { v } from "convex/values";

export const funnelConfigValidator = v.object({
	label: v.string(),
	steps: v.array(v.string()),
});

export const funnelsConfigValidator = v.record(v.string(), funnelConfigValidator);

export const funnelConversionResponseValidator = v.object({
	funnel: v.string(),
	label: v.string(),
	steps: v.array(v.string()),
	numeratorMetric: v.string(),
	denominatorMetric: v.string(),
	numerator: v.number(),
	denominator: v.number(),
	ratePercent: v.optional(v.number()),
	scope: v.any(),
	range: v.object({
		from: v.number(),
		to: v.number(),
	}),
});
