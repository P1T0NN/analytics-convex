// TYPES
import type {
	typesAnalyticsAggregation,
} from "../types/primitives.js";

export type typesMetricRollupRow = {
	bucketStart: number;
	value: number;
	sampleCount?: number;
};

export function internalMergeMetricRollupIncrements(
	target: {
		aggregation: typesAnalyticsAggregation;
		delta: number;
		sampleCountDelta?: number;
	},
	source: {
		aggregation: typesAnalyticsAggregation;
		delta: number;
		sampleCountDelta?: number;
	},
) {
	switch (target.aggregation) {
		case "count":
		case "sum":
			target.delta += source.delta;
			return;
		case "avg":
			target.delta += source.delta;
			target.sampleCountDelta =
				(target.sampleCountDelta ?? 0) + (source.sampleCountDelta ?? 1);
			return;
		case "min":
			target.delta = Math.min(target.delta, source.delta);
			return;
		case "max":
			target.delta = Math.max(target.delta, source.delta);
			return;
		case "distinctActors":
			target.delta += source.delta;
			return;
	}
}

export function internalReduceMetricRollupRows(
	aggregation: typesAnalyticsAggregation,
	rows: typesMetricRollupRow[],
	from?: number,
	to?: number,
) {
	let totalValue = 0;
	let totalSampleCount = 0;
	let min = Number.POSITIVE_INFINITY;
	let max = Number.NEGATIVE_INFINITY;
	let matched = 0;

	for (const row of rows) {
		if (from !== undefined && row.bucketStart < from) continue;
		if (to !== undefined && row.bucketStart > to) continue;

		matched += 1;

		switch (aggregation) {
			case "count":
			case "sum":
			case "distinctActors":
				totalValue += row.value;
				break;
			case "avg":
				totalValue += row.value;
				totalSampleCount += row.sampleCount ?? 0;
				break;
			case "min":
				min = Math.min(min, row.value);
				break;
			case "max":
				max = Math.max(max, row.value);
				break;
		}
	}

	switch (aggregation) {
		case "count":
		case "sum":
		case "distinctActors":
			return totalValue;
		case "avg":
			return totalSampleCount > 0 ? totalValue / totalSampleCount : 0;
		case "min":
			return matched > 0 ? min : 0;
		case "max":
			return matched > 0 ? max : 0;
	}
}

export function internalReduceMetricRollupTotalsByKey<
	Row extends typesMetricRollupRow & { dimensionValue: string },
>(
	aggregation: typesAnalyticsAggregation,
	rows: Row[],
) {
	const totals = new Map<string, { value: number; sampleCount: number }>();

	for (const row of rows) {
		const existing = totals.get(row.dimensionValue) ?? {
			value: 0,
			sampleCount: 0,
		};

		switch (aggregation) {
			case "count":
			case "sum":
			case "distinctActors":
				existing.value += row.value;
				break;
			case "avg":
				existing.value += row.value;
				existing.sampleCount += row.sampleCount ?? 0;
				break;
			case "min":
				existing.value =
					totals.has(row.dimensionValue)
						? Math.min(existing.value, row.value)
						: row.value;
				break;
			case "max":
				existing.value =
					totals.has(row.dimensionValue)
						? Math.max(existing.value, row.value)
						: row.value;
				break;
		}

		totals.set(row.dimensionValue, existing);
	}

	const result = new Map<string, number>();
	for (const [key, total] of totals.entries()) {
		if (aggregation === "avg") {
			result.set(
				key,
				total.sampleCount > 0 ? total.value / total.sampleCount : 0,
			);
			continue;
		}

		result.set(key, total.value);
	}

	return result;
}
