// LIBRARIES
import { v } from "convex/values";

export const journeyConfigValidator = v.object({
	label: v.string(),
	steps: v.array(v.string()),
	breakdownProperty: v.optional(v.string()),
});

export const journeysConfigValidator = v.record(v.string(), journeyConfigValidator);

export const journeyConversionResponseValidator = v.object({
	journey: v.string(),
	label: v.string(),
	steps: v.array(v.string()),
	stepCounts: v.array(v.number()),
	ratePercents: v.array(v.union(v.number(), v.null())),
	breakdownProperty: v.optional(v.string()),
	breakdown: v.optional(
		v.array(
			v.object({
				dimensionValue: v.string(),
				stepCounts: v.array(v.number()),
				ratePercents: v.array(v.union(v.number(), v.null())),
			}),
		),
	),
	scope: v.any(),
	range: v.object({
		from: v.number(),
		to: v.number(),
	}),
});
