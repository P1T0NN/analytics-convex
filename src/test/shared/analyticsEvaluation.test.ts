import { describe, expect, it } from "vitest";
import {
	computePercentOfGoal,
	evaluateMetricLabel,
	isGoalEvaluationConfig,
	metricLabelSentiment,
} from "../../shared/utils/analyticsEvaluationUtils";
import type {
	typesMetricEvaluationConfig,
} from "../../shared/types/evaluation";

const goalConfig = {
	kind: "goal" as const,
	targetValue: 500,
	excellentPercentOfGoal: 100,
	goodPercentOfGoal: 75,
	badPercentOfGoal: 50,
	minValueForEvaluation: 0,
};

describe("computePercentOfGoal", () => {
	it("returns percent of target when target is positive", () => {
		expect(
			computePercentOfGoal({ value: 250, targetValue: 500 }),
		).toBe(50);
	});

	it("returns undefined when target is zero", () => {
		expect(computePercentOfGoal({ value: 10, targetValue: 0 })).toBeUndefined();
	});
});

describe("evaluateMetricLabel", () => {
	it("evaluates comparison growth thresholds", () => {
		const config = {
			kind: "comparison" as const,
			excellentGrowthPercent: 25,
			goodGrowthPercent: 5,
			badGrowthPercent: -5,
			minVolumeForComparison: 10,
		};

		expect(
			evaluateMetricLabel({
				kind: "comparison",
				config,
				comparison: { current: 150, previous: 100, delta: 50, deltaPercent: 50 },
			}),
		).toEqual({ label: "excellent", reason: "comparison_growth", sentiment: "positive" });

		expect(
			evaluateMetricLabel({
				kind: "comparison",
				config,
				comparison: { current: 110, previous: 100, delta: 10, deltaPercent: 10 },
			}),
		).toEqual({ label: "good", reason: "comparison_growth", sentiment: "positive" });

		expect(
			evaluateMetricLabel({
				kind: "comparison",
				config,
				comparison: { current: 90, previous: 100, delta: -10, deltaPercent: -10 },
			}),
		).toEqual({ label: "bad", reason: "comparison_growth", sentiment: "negative" });
	});

	it("guards low-volume comparison noise", () => {
		const result = evaluateMetricLabel({
			kind: "comparison",
			config: {
				kind: "comparison",
				excellentGrowthPercent: 25,
				goodGrowthPercent: 5,
				badGrowthPercent: -5,
				minVolumeForComparison: 10,
			},
			comparison: { current: 3, previous: 1, delta: 2, deltaPercent: 200 },
		});

		expect(result).toEqual({
			label: "neutral",
			reason: "below_min_volume",
			sentiment: "neutral",
		});
	});

	it("handles zero previous comparison cases", () => {
		const config = {
			kind: "comparison" as const,
			excellentGrowthPercent: 25,
			goodGrowthPercent: 5,
			badGrowthPercent: -5,
		};

		expect(
			evaluateMetricLabel({
				kind: "comparison",
				config,
				comparison: { current: 0, previous: 0, delta: 0 },
			}),
		).toEqual({
			label: "neutral",
			reason: "zero_previous_and_current",
			sentiment: "neutral",
		});

		expect(
			evaluateMetricLabel({
				kind: "comparison",
				config,
				comparison: { current: 5, previous: 0, delta: 5 },
			}),
		).toEqual({ label: "activity", reason: "zero_previous", sentiment: "neutral" });
	});

	it("evaluates conversion rate thresholds", () => {
		const config = {
			kind: "conversion" as const,
			denominatorMetric: "qrScans",
			excellentRatePercent: 50,
			goodRatePercent: 20,
			badRatePercent: 10,
			minDenominator: 5,
		};

		expect(
			evaluateMetricLabel({
				kind: "conversion",
				config,
				conversion: { numerator: 60, denominator: 100, ratePercent: 60 },
			}),
		).toEqual({ label: "excellent", reason: "conversion_rate", sentiment: "positive" });

		expect(
			evaluateMetricLabel({
				kind: "conversion",
				config,
				conversion: { numerator: 2, denominator: 3, ratePercent: 66.666 },
			}),
		).toEqual({
			label: "neutral",
			reason: "below_min_denominator",
			sentiment: "neutral",
		});
	});

	it("evaluates inverse rate thresholds", () => {
		const config = {
			kind: "inverseRate" as const,
			denominatorMetric: "newReservations",
			goodRatePercent: 10,
			badRatePercent: 25,
		};

		expect(
			evaluateMetricLabel({
				kind: "inverseRate",
				config,
				conversion: { numerator: 0, denominator: 100, ratePercent: 0 },
			}),
		).toEqual({ label: "clear", reason: "zero_inverse_rate", sentiment: "positive" });

		expect(
			evaluateMetricLabel({
				kind: "inverseRate",
				config,
				conversion: { numerator: 5, denominator: 100, ratePercent: 5 },
			}),
		).toEqual({ label: "good", reason: "inverse_rate", sentiment: "positive" });

		expect(
			evaluateMetricLabel({
				kind: "inverseRate",
				config,
				conversion: { numerator: 30, denominator: 100, ratePercent: 30 },
			}),
		).toEqual({ label: "bad", reason: "inverse_rate", sentiment: "negative" });
	});

	it("evaluates goal progress thresholds", () => {
		expect(
			evaluateMetricLabel({
				kind: "goal",
				config: goalConfig,
				goal: { value: 500, targetValue: 500, percentOfGoal: 100 },
			}),
		).toEqual({ label: "excellent", reason: "goal_progress", sentiment: "positive" });

		expect(
			evaluateMetricLabel({
				kind: "goal",
				config: goalConfig,
				goal: { value: 375, targetValue: 500, percentOfGoal: 75 },
			}),
		).toEqual({ label: "good", reason: "goal_progress", sentiment: "positive" });

		expect(
			evaluateMetricLabel({
				kind: "goal",
				config: goalConfig,
				goal: { value: 250, targetValue: 500, percentOfGoal: 50 },
			}),
		).toEqual({ label: "bad", reason: "goal_progress", sentiment: "negative" });

		expect(
			evaluateMetricLabel({
				kind: "goal",
				config: goalConfig,
				goal: { value: 300, targetValue: 500, percentOfGoal: 60 },
			}),
		).toEqual({ label: "neutral", reason: "goal_progress", sentiment: "neutral" });
	});

	it("handles goal edge cases", () => {
		expect(
			evaluateMetricLabel({
				kind: "goal",
				config: goalConfig,
				goal: { value: 0, targetValue: 0 },
			}),
		).toEqual({ label: "neutral", reason: "zero_target", sentiment: "neutral" });

		expect(
			evaluateMetricLabel({
				kind: "goal",
				config: goalConfig,
				goal: { value: 0, targetValue: 500, percentOfGoal: 0 },
			}),
		).toEqual({ label: "bad", reason: "goal_progress", sentiment: "negative" });

		expect(
			evaluateMetricLabel({
				kind: "goal",
				config: { ...goalConfig, minValueForEvaluation: 10 },
				goal: { value: 5, targetValue: 500, percentOfGoal: 1 },
			}),
		).toEqual({
			label: "neutral",
			reason: "below_min_volume",
			sentiment: "neutral",
		});
	});
});

describe("metricLabelSentiment", () => {
	it("maps every label to its sentiment", () => {
		expect(metricLabelSentiment("excellent")).toBe("positive");
		expect(metricLabelSentiment("good")).toBe("positive");
		expect(metricLabelSentiment("clear")).toBe("positive");
		expect(metricLabelSentiment("bad")).toBe("negative");
		expect(metricLabelSentiment("neutral")).toBe("neutral");
		expect(metricLabelSentiment("activity")).toBe("neutral");
	});
});

describe("isGoalEvaluationConfig", () => {
	it("narrows nullable evaluation configs to goal configs", () => {
		const evaluation: typesMetricEvaluationConfig | null = goalConfig;

		if (!isGoalEvaluationConfig(evaluation)) {
			throw new Error("Expected a goal evaluation config");
		}

		const targetValue: number = evaluation.targetValue;
		expect(targetValue).toBe(500);
		expect(isGoalEvaluationConfig(null)).toBe(false);
		expect(isGoalEvaluationConfig(undefined)).toBe(false);
		expect(
			isGoalEvaluationConfig({
				kind: "conversion",
				denominatorMetric: "qrScans",
				excellentRatePercent: 50,
				goodRatePercent: 20,
				badRatePercent: 10,
			}),
		).toBe(false);
	});
});
