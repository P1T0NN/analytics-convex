// CONSTANTS
import { TOTAL_DIMENSION } from "../constants";

// HELPERS
import { collectDailyMetricRows } from "./collectDailyMetricRows";

// TYPES
import type {
	typesAnalyticsConfigState,
	typesAnalyticsScope,
} from "../types/types";

export async function getMetricTotalForRange(
	ctx: any,
	config: typesAnalyticsConfigState,
	args: {
		metric: string;
		scope: typesAnalyticsScope;
		from: number;
		to: number;
		dimensionKey?: string;
	},
) {
	const rows = await collectDailyMetricRows(ctx, {
		metric: args.metric,
		scope: args.scope,
		dimensionKey: args.dimensionKey ?? TOTAL_DIMENSION,
		from: args.from,
		to: args.to,
		settings: config.settings,
	});

	return rows.reduce((total: number, row: any) => total + row.value, 0);
}
