export const ANALYTICS_METRIC_LABELS = {
	neutral: "Neutral",
	activity: "Activity",
	good: "Good",
	excellent: "Excellent",
	bad: "Bad",
	clear: "Clear",
} as const;

export type typesAnalyticsMetricLabel =
	keyof typeof ANALYTICS_METRIC_LABELS;

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

export type typesMetricEvaluationInput = {
	kind: "comparison";
	comparison: typesMetricComparisonInput;
	config: typesMetricComparisonEvaluationConfig;
} | {
	kind: "conversion";
	conversion: typesMetricConversionInput;
	config: typesMetricConversionEvaluationConfig;
} | {
	kind: "inverseRate";
	conversion: typesMetricConversionInput;
	config: typesMetricInverseRateEvaluationConfig;
};

export type typesMetricEvaluationResult = {
	label: typesAnalyticsMetricLabel;
	reason: typesMetricEvaluationReason;
};

function evaluateComparisonLabel(
	comparison: typesMetricComparisonInput,
	config: typesMetricComparisonEvaluationConfig,
): typesMetricEvaluationResult {
	const minVolume = config.minVolumeForComparison ?? 0;
	const totalVolume = comparison.current + comparison.previous;

	if (totalVolume < minVolume) {
		return { label: "neutral", reason: "below_min_volume" };
	}

	if (comparison.previous === 0 && comparison.current === 0) {
		return { label: "neutral", reason: "zero_previous_and_current" };
	}

	if (comparison.previous === 0 && comparison.current > 0) {
		return { label: "activity", reason: "zero_previous" };
	}

	const deltaPercent =
		comparison.deltaPercent ??
		(comparison.previous !== 0
			? (comparison.delta / comparison.previous) * 100
			: undefined);

	if (deltaPercent === undefined) {
		return { label: "neutral", reason: "zero_previous" };
	}

	if (deltaPercent >= config.excellentGrowthPercent) {
		return { label: "excellent", reason: "comparison_growth" };
	}

	if (deltaPercent >= config.goodGrowthPercent) {
		return { label: "good", reason: "comparison_growth" };
	}

	if (deltaPercent <= config.badGrowthPercent) {
		return { label: "bad", reason: "comparison_growth" };
	}

	return { label: "neutral", reason: "comparison_growth" };
}

function evaluateConversionLabel(
	conversion: typesMetricConversionInput,
	config: typesMetricConversionEvaluationConfig,
): typesMetricEvaluationResult {
	const minDenominator = config.minDenominator ?? 0;

	if (conversion.denominator < minDenominator) {
		return { label: "neutral", reason: "below_min_denominator" };
	}

	if (conversion.denominator === 0 && conversion.numerator === 0) {
		return { label: "neutral", reason: "zero_denominator_and_numerator" };
	}

	if (conversion.denominator === 0 && conversion.numerator > 0) {
		return { label: "activity", reason: "zero_denominator_with_numerator" };
	}

	const ratePercent =
		conversion.ratePercent ??
		(conversion.denominator !== 0
			? (conversion.numerator / conversion.denominator) * 100
			: undefined);

	if (ratePercent === undefined) {
		return { label: "neutral", reason: "zero_denominator_and_numerator" };
	}

	if (ratePercent >= config.excellentRatePercent) {
		return { label: "excellent", reason: "conversion_rate" };
	}

	if (ratePercent >= config.goodRatePercent) {
		return { label: "good", reason: "conversion_rate" };
	}

	if (ratePercent <= config.badRatePercent) {
		return { label: "bad", reason: "conversion_rate" };
	}

	return { label: "neutral", reason: "conversion_rate" };
}

function evaluateInverseRateLabel(
	conversion: typesMetricConversionInput,
	config: typesMetricInverseRateEvaluationConfig,
): typesMetricEvaluationResult {
	const minDenominator = config.minDenominator ?? 0;

	if (conversion.denominator < minDenominator) {
		return { label: "neutral", reason: "below_min_denominator" };
	}

	if (conversion.denominator === 0 && conversion.numerator === 0) {
		return { label: "neutral", reason: "zero_denominator_and_numerator" };
	}

	const ratePercent =
		conversion.ratePercent ??
		(conversion.denominator !== 0
			? (conversion.numerator / conversion.denominator) * 100
			: undefined);

	if (ratePercent === 0) {
		return { label: "clear", reason: "zero_inverse_rate" };
	}

	if (ratePercent === undefined) {
		return { label: "neutral", reason: "zero_denominator_and_numerator" };
	}

	if (ratePercent <= config.goodRatePercent) {
		return { label: "good", reason: "inverse_rate" };
	}

	if (ratePercent >= config.badRatePercent) {
		return { label: "bad", reason: "inverse_rate" };
	}

	return { label: "neutral", reason: "inverse_rate" };
}

/**
 * Evaluate a dashboard metric label from comparison or conversion inputs.
 *
 * Pure function — safe to use in UI, tests, and server queries.
 */
export function evaluateMetricLabel(
	input: typesMetricEvaluationInput,
): typesMetricEvaluationResult {
	switch (input.kind) {
		case "comparison":
			return evaluateComparisonLabel(input.comparison, input.config);
		case "conversion":
			return evaluateConversionLabel(input.conversion, input.config);
		case "inverseRate":
			return evaluateInverseRateLabel(input.conversion, input.config);
	}
}

export function computeConversionRatePercent(args: {
	numerator: number;
	denominator: number;
}) {
	if (args.denominator === 0) {
		return undefined;
	}

	return (args.numerator / args.denominator) * 100;
}
