// UTILS
import {
	internalReduceMetricRollupTotalsByKey,
} from "../../shared/utils/metricAggregationUtils.js";

// TYPES
import type { Doc } from "../_generated/dataModel";
import type {
	typesAnalyticsAggregation,
} from "../../shared/types/primitives.js";
import type {
	typesAnalyticsSettings,
} from "../../shared/types/settings.js";

export function internalGetTopSeriesKeys(
	rows: Doc<"analyticsDailyMetrics">[],
	settings: typesAnalyticsSettings,
	aggregation: typesAnalyticsAggregation = "sum",
) {
	const totals = internalReduceMetricRollupTotalsByKey(aggregation, rows);

	return [...totals.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, settings.maxBreakdownItems)
		.map(([key]) => key);
}
