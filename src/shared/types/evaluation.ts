// CONSTANTS
import { ANALYTICS_METRIC_LABELS } from "../constants.js";

export type typesAnalyticsMetricLabel = keyof typeof ANALYTICS_METRIC_LABELS;

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
	| "inverse_rate";

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

export type typesMetricEvaluationConfig =
	| typesMetricComparisonEvaluationConfig
	| typesMetricConversionEvaluationConfig
	| typesMetricInverseRateEvaluationConfig;

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

export type typesMetricEvaluationResult = {
	label: typesAnalyticsMetricLabel;
	reason: typesMetricEvaluationReason;
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
	  };
