// LIBRARIES
import type { GenericDataModel, GenericQueryCtx } from "convex/server";
import type { ComponentApi } from "../../component/_generated/component.js";

// TYPES
import type {
  typesAnalyticsMetricConfig,
  typesAnalyticsScopeInput,
} from "../types/types";

type typesQueryCtx = Pick<GenericQueryCtx<GenericDataModel>, "runQuery">;

type typesMetricName<Metrics extends readonly typesAnalyticsMetricConfig[]> =
  Metrics[number]["name"];

type typesMetricConfigForName<
  Metrics extends readonly typesAnalyticsMetricConfig[],
  Name extends typesMetricName<Metrics>,
> = Extract<Metrics[number], { name: Name }>;

type typesDimensionNameForMetric<
  Metrics extends readonly typesAnalyticsMetricConfig[],
  Name extends typesMetricName<Metrics>,
> =
  typesMetricConfigForName<Metrics, Name> extends {
    dimensions?: readonly (infer Dimension)[];
  }
    ? Extract<Dimension, string>
    : never;

type typesMetricRangeArgs<
  Metrics extends readonly typesAnalyticsMetricConfig[],
  Name extends typesMetricName<Metrics>,
> = {
  metric: Name;
  from: number;
  to: number;
  scope?: typesAnalyticsScopeInput;
};

type typesTimeSeriesArgs<
  Metrics extends readonly typesAnalyticsMetricConfig[],
  Name extends typesMetricName<Metrics>,
> = typesMetricRangeArgs<Metrics, Name> & {
  groupBy?: typesDimensionNameForMetric<Metrics, Name>;
  fill?: boolean;
};

type typesBreakdownArgs<
  Metrics extends readonly typesAnalyticsMetricConfig[],
  Name extends typesMetricName<Metrics>,
> = typesMetricRangeArgs<Metrics, Name> & {
  groupBy: typesDimensionNameForMetric<Metrics, Name>;
};

type typesMetricTotalsByDimensionArgs<
  Metrics extends readonly typesAnalyticsMetricConfig[],
  Name extends typesMetricName<Metrics>,
> = {
  metric: Name;
  scope?: typesAnalyticsScopeInput;
  dimensionKey: typesDimensionNameForMetric<Metrics, Name>;
  days?: number;
  maxRows?: number;
};

type typesTopDimensionValueArgs<
  Metrics extends readonly typesAnalyticsMetricConfig[],
  Name extends typesMetricName<Metrics>,
> = Omit<typesMetricTotalsByDimensionArgs<Metrics, Name>, "maxRows">;

/**
 * Create typed server-side read helpers from your metric config.
 *
 * Use from app queries that already implement their own authorization.
 */
export function createAnalyticsReader<
  const Metrics extends readonly typesAnalyticsMetricConfig[],
>(component: ComponentApi, _metrics: Metrics) {
  return {
    fetchConfiguration: async (ctx: typesQueryCtx) => {
      return await ctx.runQuery(component.lib.fetchConfiguration, {});
    },
    fetchSummary: async <Name extends typesMetricName<Metrics>>(
      ctx: typesQueryCtx,
      args: typesMetricRangeArgs<Metrics, Name>,
    ) => {
      return await ctx.runQuery(component.lib.fetchSummary, args);
    },
    fetchMetricComparison: async <Name extends typesMetricName<Metrics>>(
      ctx: typesQueryCtx,
      args: typesMetricRangeArgs<Metrics, Name>,
    ) => {
      return await ctx.runQuery(component.lib.fetchMetricComparison, args);
    },
    fetchTimeSeries: async <Name extends typesMetricName<Metrics>>(
      ctx: typesQueryCtx,
      args: typesTimeSeriesArgs<Metrics, Name>,
    ) => {
      return await ctx.runQuery(component.lib.fetchTimeSeries, args);
    },
    fetchBreakdown: async <Name extends typesMetricName<Metrics>>(
      ctx: typesQueryCtx,
      args: typesBreakdownArgs<Metrics, Name>,
    ) => {
      return await ctx.runQuery(component.lib.fetchBreakdown, args);
    },
    fetchMetricTotalsByDimension: async <Name extends typesMetricName<Metrics>>(
      ctx: typesQueryCtx,
      args: typesMetricTotalsByDimensionArgs<Metrics, Name>,
    ): Promise<Map<string, number>> => {
      const rows = await ctx.runQuery(
        component.lib.fetchMetricTotalsByDimension,
        args,
      );

      return new Map(rows.map((row) => [row.key, row.value]));
    },
    fetchTopDimensionValue: async <Name extends typesMetricName<Metrics>>(
      ctx: typesQueryCtx,
      args: typesTopDimensionValueArgs<Metrics, Name>,
    ): Promise<string | null> => {
      return await ctx.runQuery(component.lib.fetchTopDimensionValue, args);
    },
  };
}
