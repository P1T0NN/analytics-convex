// LIBRARIES
import { v } from "convex/values";

export const metricLabelValidator = v.union(
	v.literal("neutral"),
	v.literal("activity"),
	v.literal("good"),
	v.literal("excellent"),
	v.literal("bad"),
	v.literal("clear"),
);

export const metricEvaluationReasonValidator = v.union(
	v.literal("no_evaluation_config"),
	v.literal("below_min_volume"),
	v.literal("below_min_denominator"),
	v.literal("zero_previous"),
	v.literal("zero_previous_and_current"),
	v.literal("zero_denominator_with_numerator"),
	v.literal("zero_denominator_and_numerator"),
	v.literal("zero_inverse_rate"),
	v.literal("comparison_growth"),
	v.literal("conversion_rate"),
	v.literal("inverse_rate"),
	v.literal("goal_progress"),
	v.literal("zero_target"),
);

export const metricComparisonEvaluationConfigValidator = v.object({
	kind: v.literal("comparison"),
	excellentGrowthPercent: v.number(),
	goodGrowthPercent: v.number(),
	badGrowthPercent: v.number(),
	minVolumeForComparison: v.optional(v.number()),
});

export const metricConversionEvaluationConfigValidator = v.object({
	kind: v.literal("conversion"),
	denominatorMetric: v.string(),
	excellentRatePercent: v.number(),
	goodRatePercent: v.number(),
	badRatePercent: v.number(),
	minDenominator: v.optional(v.number()),
});

export const metricInverseRateEvaluationConfigValidator = v.object({
	kind: v.literal("inverseRate"),
	denominatorMetric: v.string(),
	goodRatePercent: v.number(),
	badRatePercent: v.number(),
	minDenominator: v.optional(v.number()),
});

export const metricGoalEvaluationConfigValidator = v.object({
	kind: v.literal("goal"),
	targetValue: v.number(),
	excellentPercentOfGoal: v.number(),
	goodPercentOfGoal: v.number(),
	badPercentOfGoal: v.number(),
	minValueForEvaluation: v.optional(v.number()),
});

export const metricEvaluationConfigValidator = v.union(
	metricComparisonEvaluationConfigValidator,
	metricConversionEvaluationConfigValidator,
	metricInverseRateEvaluationConfigValidator,
	metricGoalEvaluationConfigValidator,
);

export const metricComparisonInputValidator = v.object({
	current: v.number(),
	previous: v.number(),
	delta: v.number(),
	deltaPercent: v.optional(v.number()),
});

export const metricConversionInputValidator = v.object({
	numerator: v.number(),
	denominator: v.number(),
	ratePercent: v.optional(v.number()),
});

export const metricGoalInputValidator = v.object({
	targetValue: v.number(),
	value: v.number(),
	percentOfGoal: v.optional(v.number()),
});

export const metricEvaluationResultValidator = v.object({
	label: metricLabelValidator,
	reason: metricEvaluationReasonValidator,
});

export const metricEvaluationResponseValidator = v.object({
	metric: v.string(),
	label: v.string(),
	unit: v.union(v.literal("count"), v.literal("currency"), v.literal("bytes")),
	scope: v.any(),
	value: v.number(),
	range: v.object({
		from: v.number(),
		to: v.number(),
	}),
	evaluation: metricEvaluationResultValidator,
	comparison: v.optional(metricComparisonInputValidator),
	conversion: v.optional(
		v.object({
			numerator: v.number(),
			denominator: v.number(),
			ratePercent: v.optional(v.number()),
			denominatorMetric: v.optional(v.string()),
		}),
	),
	goal: v.optional(metricGoalInputValidator),
});

export const metricConversionResponseValidator = v.object({
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
