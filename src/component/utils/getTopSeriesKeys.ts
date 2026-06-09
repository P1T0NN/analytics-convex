// TYPES
import type { Doc } from "../_generated/dataModel";
import type { typesAnalyticsSettings } from "../../shared/types/index.js";

export function internalGetTopSeriesKeys(
	rows: Doc<"analyticsDailyMetrics">[],
	settings: typesAnalyticsSettings,
) {
	const totals = new Map<string, number>();

	for (const row of rows) {
		totals.set(
			row.dimensionValue,
			(totals.get(row.dimensionValue) ?? 0) + row.value,
		);
	}

	return [...totals.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
		.slice(0, settings.maxBreakdownItems)
		.map(([key]) => key);
}
