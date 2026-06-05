// LIBRARIES
import { ConvexError } from "convex/values";

// CONSTANTS
import { DAY_MS } from "../constants";

// UTILS
import { startOfUtcDay } from "../utils/common/dateUtils";

// TYPES
import type { typesAnalyticsScopeType } from "../types/types";

const DEFAULT_TOTAL_DAYS = 30;
const DEFAULT_MAX_TOTAL_ROWS = 20_000;

/**
 * Get aggregated totals by dimension value.
 *
 * Queries rollup rows for the last N days (default 30) and returns a Map
 * of dimension values to their total. Useful for counters, leaderboards,
 * and ranked lists.
 *
 * @example
 * const totals = await getAnalyticsMetricTotalsByDimension(ctx, {
 *   metric: "featureUses",
 *   scopeType: "global",
 *   scopeId: "__global",
 *   dimensionKey: "feature",
 * });
 */
export async function getAnalyticsMetricTotalsByDimension(
    ctx: any,
    args: {
        metric: string;
        scopeType: typesAnalyticsScopeType;
        scopeId: string;
        dimensionKey: string;
        days?: number;
        maxRows?: number;
    },
): Promise<Map<string, number>> {
    const days = args.days ?? DEFAULT_TOTAL_DAYS;
    if (!Number.isInteger(days) || days <= 0) {
        throw new ConvexError({
            code: "BAD_REQUEST",
            message: "`days` must be a positive integer.",
        });
    }
    
    const maxRows = args.maxRows ?? DEFAULT_MAX_TOTAL_ROWS;
    if (!Number.isInteger(maxRows) || maxRows <= 0) {
        throw new ConvexError({
            code: "BAD_REQUEST",
            message: "`maxRows` must be a positive integer.",
        });
    }
    
    const todayStart = startOfUtcDay(Date.now());
    const from = todayStart - DAY_MS * (days - 1);
    
    const rows = await ctx.db
        .query("analyticsDailyMetrics")
        .withIndex("by_metric_scope_dimension_bucket", (q: any) =>
        q
            .eq("metric", args.metric)
            .eq("scopeType", args.scopeType)
            .eq("scopeId", args.scopeId)
            .eq("granularity", "day")
            .eq("dimensionKey", args.dimensionKey)
            .gte("bucketStart", from)
            .lte("bucketStart", todayStart),
        )
        .take(maxRows + 1);
    
    if (rows.length > maxRows) {
        throw new ConvexError({
            code: "QUERY_TOO_LARGE",
            message:
                `Analytics total query matched more than ${maxRows} rollup rows. ` +
                "Reduce the requested days, scope, or dimension cardinality.",
        });
    }
    
    const totals = new Map<string, number>();
    
    for (const row of rows) {
        totals.set(row.dimensionValue, (totals.get(row.dimensionValue) ?? 0) + row.value);
    }
    
    return totals;
}
