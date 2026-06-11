// CONSTANTS
import { ANALYTICS_METRIC_LABEL_SENTIMENTS } from "../constants.js";

// TYPES
import type {
	typesAnalyticsMetricLabel,
	typesAnalyticsMetricSentiment,
	typesMetricComparisonEvaluationConfig,
	typesMetricComparisonInput,
	typesMetricConversionEvaluationConfig,
	typesMetricConversionInput,
	typesMetricEvaluationConfig,
	typesMetricEvaluationInput,
	typesMetricEvaluationResult,
	typesMetricGoalEvaluationConfig,
	typesMetricGoalInput,
	typesMetricInverseRateEvaluationConfig,
} from "../types/evaluation.js";

type typesMetricLabelOutcome = Omit<typesMetricEvaluationResult, "sentiment">;

/** Tone for a label — lets UIs map straight to success/danger/muted tokens. */
export function metricLabelSentiment(
	label: typesAnalyticsMetricLabel,
): typesAnalyticsMetricSentiment {
	return ANALYTICS_METRIC_LABEL_SENTIMENTS[label];
}

/** Narrow an effective evaluation config to the goal shape. */
export function isGoalEvaluationConfig(
	evaluation: typesMetricEvaluationConfig | null | undefined,
): evaluation is typesMetricGoalEvaluationConfig {
	return evaluation?.kind === "goal";
}

function evaluateComparisonLabel(
	comparison: typesMetricComparisonInput,
	config: typesMetricComparisonEvaluationConfig,
): typesMetricLabelOutcome {
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
): typesMetricLabelOutcome {
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
): typesMetricLabelOutcome {
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

function evaluateGoalLabel(
	goal: typesMetricGoalInput,
	config: typesMetricGoalEvaluationConfig,
): typesMetricLabelOutcome {
	const minValue = config.minValueForEvaluation ?? 0;

	if (goal.value < minValue) {
		return { label: "neutral", reason: "below_min_volume" };
	}

	if (goal.targetValue === 0) {
		return { label: "neutral", reason: "zero_target" };
	}

	const percentOfGoal =
		goal.percentOfGoal ??
		computePercentOfGoal({
			value: goal.value,
			targetValue: goal.targetValue,
		});

	if (percentOfGoal === undefined) {
		return { label: "neutral", reason: "zero_target" };
	}

	if (percentOfGoal >= config.excellentPercentOfGoal) {
		return { label: "excellent", reason: "goal_progress" };
	}

	if (percentOfGoal >= config.goodPercentOfGoal) {
		return { label: "good", reason: "goal_progress" };
	}

	if (percentOfGoal <= config.badPercentOfGoal) {
		return { label: "bad", reason: "goal_progress" };
	}

	return { label: "neutral", reason: "goal_progress" };
}

/**
 * Evaluate a dashboard metric label from comparison or conversion inputs.
 *
 * Pure function — safe to use in UI, tests, and server queries.
 */
export function evaluateMetricLabel(
	input: typesMetricEvaluationInput,
): typesMetricEvaluationResult {
	const outcome = ((): typesMetricLabelOutcome => {
		switch (input.kind) {
			case "comparison":
				return evaluateComparisonLabel(input.comparison, input.config);
			case "conversion":
				return evaluateConversionLabel(input.conversion, input.config);
			case "inverseRate":
				return evaluateInverseRateLabel(input.conversion, input.config);
			case "goal":
				return evaluateGoalLabel(input.goal, input.config);
		}
	})();

	return {
		...outcome,
		sentiment: metricLabelSentiment(outcome.label),
	};
}

export function computePercentOfGoal(args: {
	value: number;
	targetValue: number;
}) {
	if (args.targetValue === 0) {
		return undefined;
	}

	return (args.value / args.targetValue) * 100;
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
