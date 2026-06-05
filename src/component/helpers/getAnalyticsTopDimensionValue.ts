// HELPERS
import { getAnalyticsMetricTotalsByDimension } from "./getAnalyticsMetricTotalsByDimension";

// UTILS
import { getAnalyticsRanking } from "../utils/getAnalyticsRanking";

// TYPES
import type { typesAnalyticsScopeType } from "../types/types";

/**
 * Get the single highest-value dimension entry.
 *
 * Wraps getAnalyticsMetricTotalsByDimension and returns the top-ranked
 * dimension value, or null if no data exists.
 *
 * @example
 * const topFeature = await getAnalyticsTopDimensionValue(ctx, {
 *   metric: "featureUses",
 *   scopeType: "organization",
 *   scopeId: "org_abc",
 *   dimensionKey: "feature",
 * });
 */
export async function getAnalyticsTopDimensionValue(
    ctx: any,
    args: {
        metric: string;
        scopeType: typesAnalyticsScopeType;
        scopeId: string;
        dimensionKey: string;
        days?: number;
    },
): Promise<string | null> {
    const totals = await getAnalyticsMetricTotalsByDimension(ctx, args);

	const [top] = getAnalyticsRanking({
		items: [...totals.entries()],
        getScore: ([, value]) => value,
        limit: 1,
    });

    return top?.[0] ?? null;
}
