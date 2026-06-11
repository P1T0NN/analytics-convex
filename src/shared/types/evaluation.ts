// CONSTANTS
import {
	ANALYTICS_METRIC_LABEL_KEYS,
	ANALYTICS_METRIC_LABEL_SENTIMENTS,
} from "../constants.js";

export type typesAnalyticsMetricLabel =
	(typeof ANALYTICS_METRIC_LABEL_KEYS)[number];

export type typesAnalyticsMetricSentiment =
	(typeof ANALYTICS_METRIC_LABEL_SENTIMENTS)[typesAnalyticsMetricLabel];

export type typesMetricEvaluationReason =
	| "no_evaluation_config"
	| "below_min_volume"
	| "below_min_denominator"
	| "zero_previous"
	| "zero_previous_and_current"
	| "zero_denominator_with_numerator"
	| "zero_denominator_and_numerator"
	| "zero_inverse_rate"
	| "comparison_growth"
	| "conversion_rate"
	| "inverse_rate"
	| "goal_progress"
	| "zero_target";

export type typesMetricComparisonEvaluationConfig = {
	kind: "comparison";
	excellentGrowthPercent: number;
	goodGrowthPercent: number;
	badGrowthPercent: number;
	minVolumeForComparison?: number;
};

export type typesMetricConversionEvaluationConfig = {
	kind: "conversion";
	denominatorMetric: string;
	excellentRatePercent: number;
	goodRatePercent: number;
	badRatePercent: number;
	minDenominator?: number;
};

export type typesMetricInverseRateEvaluationConfig = {
	kind: "inverseRate";
	denominatorMetric: string;
	goodRatePercent: number;
	badRatePercent: number;
	minDenominator?: number;
};

export type typesMetricGoalEvaluationConfig = {
	kind: "goal";
	targetValue: number;
	excellentPercentOfGoal: number;
	goodPercentOfGoal: number;
	badPercentOfGoal: number;
	minValueForEvaluation?: number;
};

export type typesMetricEvaluationConfig =
	| typesMetricComparisonEvaluationConfig
	| typesMetricConversionEvaluationConfig
	| typesMetricInverseRateEvaluationConfig
	| typesMetricGoalEvaluationConfig;

export type typesMetricComparisonInput = {
	current: number;
	previous: number;
	delta: number;
	deltaPercent?: number;
};

export type typesMetricConversionInput = {
	numerator: number;
	denominator: number;
	ratePercent?: number;
};

export type typesMetricGoalInput = {
	value: number;
	targetValue: number;
	percentOfGoal?: number;
};

export type typesMetricEvaluationResult = {
	label: typesAnalyticsMetricLabel;
	reason: typesMetricEvaluationReason;
	sentiment: typesAnalyticsMetricSentiment;
};

export type typesMetricEvaluationInput =
	| {
			kind: "comparison";
			comparison: typesMetricComparisonInput;
			config: typesMetricComparisonEvaluationConfig;
	  }
	| {
			kind: "conversion";
			conversion: typesMetricConversionInput;
			config: typesMetricConversionEvaluationConfig;
	  }
	| {
			kind: "inverseRate";
			conversion: typesMetricConversionInput;
			config: typesMetricInverseRateEvaluationConfig;
	  }
	| {
			kind: "goal";
			goal: typesMetricGoalInput;
			config: typesMetricGoalEvaluationConfig;
	  };
