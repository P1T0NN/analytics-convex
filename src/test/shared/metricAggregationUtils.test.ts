import { describe, expect, it } from "vitest";

import {
	internalMergeMetricRollupIncrements,
	internalReduceMetricRollupRows,
	internalReduceMetricRollupTotalsByKey,
} from "../../shared/utils/metricAggregationUtils";

describe("metricAggregationUtils", () => {
	it("merges batch increments for avg, min, and max", () => {
		const avgTarget = {
			aggregation: "avg" as const,
			delta: 10,
			sampleCountDelta: 1,
		};
		internalMergeMetricRollupIncrements(avgTarget, {
			aggregation: "avg",
			delta: 30,
			sampleCountDelta: 1,
		});
		expect(avgTarget).toEqual({
			aggregation: "avg",
			delta: 40,
			sampleCountDelta: 2,
		});

		const minTarget = { aggregation: "min" as const, delta: 10 };
		internalMergeMetricRollupIncrements(minTarget, {
			aggregation: "min",
			delta: 3,
		});
		expect(minTarget.delta).toBe(3);

		const maxTarget = { aggregation: "max" as const, delta: 10 };
		internalMergeMetricRollupIncrements(maxTarget, {
			aggregation: "max",
			delta: 25,
		});
		expect(maxTarget.delta).toBe(25);
	});

	it("reduces rollup rows across a date range", () => {
		const rows = [
			{ bucketStart: 0, value: 10, sampleCount: 1 },
			{ bucketStart: 86_400_000, value: 20, sampleCount: 1 },
			{ bucketStart: 86_400_000, value: 40, sampleCount: 1 },
		];

		expect(internalReduceMetricRollupRows("sum", rows, 0, 86_400_000)).toBe(70);
		expect(internalReduceMetricRollupRows("avg", rows, 0, 86_400_000)).toBe(70 / 3);
		expect(internalReduceMetricRollupRows("min", rows, 0, 86_400_000)).toBe(10);
		expect(internalReduceMetricRollupRows("max", rows, 0, 86_400_000)).toBe(40);
	});

	it("reduces totals by dimension value", () => {
		const rows = [
			{ bucketStart: 0, dimensionValue: "a", value: 10, sampleCount: 1 },
			{ bucketStart: 0, dimensionValue: "a", value: 30, sampleCount: 1 },
			{ bucketStart: 0, dimensionValue: "b", value: 5, sampleCount: 1 },
		];

		expect(
			[...internalReduceMetricRollupTotalsByKey("avg", rows).entries()],
		).toEqual([
			["a", 20],
			["b", 5],
		]);
	});
});
