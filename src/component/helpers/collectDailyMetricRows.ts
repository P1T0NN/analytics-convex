// LIBRARIES
import { ConvexError } from "convex/values";

// UTILS
import { startOfUtcDay } from "../utils/common/dateUtils";

// TYPES
import type { QueryCtx } from "../_generated/server";
import type { typesAnalyticsScope, typesAnalyticsSettings } from "../types/types";

export async function collectDailyMetricRows(
    ctx: QueryCtx,
    args: {
        metric: string;
        scope: typesAnalyticsScope;
        dimensionKey: string;
        from: number;
        to: number;
        settings: typesAnalyticsSettings;
    },
) {
    const rows = await ctx.db
        .query("analyticsDailyMetrics")
        .withIndex("by_metric_scope_dimension_bucket", (q) =>
        q
            .eq("metric", args.metric)
            .eq("scopeType", args.scope.type)
            .eq("scopeId", args.scope.id)
            .eq("granularity", "day")
            .eq("dimensionKey", args.dimensionKey)
            .gte("bucketStart", startOfUtcDay(args.from))
            .lte("bucketStart", startOfUtcDay(args.to)),
        )
        .take(args.settings.maxRollupRowsPerQuery + 1);
    
    if (rows.length > args.settings.maxRollupRowsPerQuery) {
        throw new ConvexError({
        code: "QUERY_TOO_LARGE",
        message:
            `Analytics query matched more than ${args.settings.maxRollupRowsPerQuery} rollup rows. ` +
            "Narrow the date range, scope, or configured dimensions.",
        });
    }
    
    return rows;
}