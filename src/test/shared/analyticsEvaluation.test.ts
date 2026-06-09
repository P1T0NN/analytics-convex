import { describe, expect, it } from "vitest";
import { evaluateMetricLabel } from "../../shared/analyticsEvaluation";

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
		).toEqual({ label: "excellent", reason: "comparison_growth" });

		expect(
			evaluateMetricLabel({
				kind: "comparison",
				config,
				comparison: { current: 110, previous: 100, delta: 10, deltaPercent: 10 },
			}),
		).toEqual({ label: "good", reason: "comparison_growth" });

		expect(
			evaluateMetricLabel({
				kind: "comparison",
				config,
				comparison: { current: 90, previous: 100, delta: -10, deltaPercent: -10 },
			}),
		).toEqual({ label: "bad", reason: "comparison_growth" });
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

		expect(result).toEqual({ label: "neutral", reason: "below_min_volume" });
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
		});

		expect(
			evaluateMetricLabel({
				kind: "comparison",
				config,
				comparison: { current: 5, previous: 0, delta: 5 },
			}),
		).toEqual({ label: "activity", reason: "zero_previous" });
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
		).toEqual({ label: "excellent", reason: "conversion_rate" });

		expect(
			evaluateMetricLabel({
				kind: "conversion",
				config,
				conversion: { numerator: 2, denominator: 3, ratePercent: 66.666 },
			}),
		).toEqual({ label: "neutral", reason: "below_min_denominator" });
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
		).toEqual({ label: "clear", reason: "zero_inverse_rate" });

		expect(
			evaluateMetricLabel({
				kind: "inverseRate",
				config,
				conversion: { numerator: 5, denominator: 100, ratePercent: 5 },
			}),
		).toEqual({ label: "good", reason: "inverse_rate" });

		expect(
			evaluateMetricLabel({
				kind: "inverseRate",
				config,
				conversion: { numerator: 30, denominator: 100, ratePercent: 30 },
			}),
		).toEqual({ label: "bad", reason: "inverse_rate" });
	});
});
