/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    crons: {
      compactAnalyticsRollups: {
        compactAnalyticsRollups: FunctionReference<
          "mutation",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            remainingBatches?: number;
          },
          { compacted: number; deleted: number; scheduledNextBatch: boolean },
          Name
        >;
      };
      processPendingHighVolumeAnalyticsEvents: {
        processPendingHighVolumeAnalyticsEvents: FunctionReference<
          "mutation",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            remainingCatchupBatches?: number;
          },
          { processed: number; scheduledNextBatch: boolean },
          Name
        >;
      };
      purgeStaleAnalyticsEvents: {
        purgeStaleAnalyticsEvents: FunctionReference<
          "mutation",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            remainingBatches?: number;
          },
          {
            cutoff?: number;
            deleted: number;
            scheduledNextBatch: boolean;
            skipped: boolean;
          },
          Name
        >;
      };
      purgeStaleAnalyticsRollups: {
        purgeStaleAnalyticsRollups: FunctionReference<
          "mutation",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            remainingBatches?: number;
          },
          {
            cutoff?: number;
            deleted: number;
            scheduledNextBatch: boolean;
            skipped: boolean;
          },
          Name
        >;
      };
    };
    lib: {
      backfillMonthActorClaims: FunctionReference<
        "mutation",
        "internal",
        { cursor?: string | null },
        { ensured: number; isDone: boolean; processed: number },
        Name
      >;
      compactAnalyticsRollups: FunctionReference<
        "mutation",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          remainingBatches?: number;
        },
        { compacted: number; deleted: number; scheduledNextBatch: boolean },
        Name
      >;
      fetchBreakdown: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          from: number;
          groupBy: string;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          to: number;
        },
        {
          config: Record<string, { label: string }>;
          data: Array<{ key: string; value: number }>;
          meta: {
            groupBy: string;
            label: string;
            metric: string;
            omittedSeriesCount: number;
            range: { from: number; to: number };
            scope:
              | { id: string; type: "global" }
              | { id: string; type: "organization" }
              | {
                  id: string;
                  resourceId: string;
                  resourceType: string;
                  type: "resource";
                };
            unit: "count" | "currency" | "bytes";
          };
        },
        Name
      >;
      fetchConfiguration: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
        },
        {
          configHash?: string;
          events: Array<{
            label: string;
            name: string;
            properties?: Record<string, "string" | "number" | "boolean">;
            requiredProperties?: Array<string>;
          }>;
          funnels?: Record<string, { label: string; steps: Array<string> }>;
          journeys?: Record<
            string,
            { breakdownProperty?: string; label: string; steps: Array<string> }
          >;
          metrics: Array<{
            actorProperty?: string;
            adminOnly?: boolean;
            aggregation:
              | "count"
              | "sum"
              | "avg"
              | "min"
              | "max"
              | "distinctActors";
            description?: string;
            dimensions?: Array<string>;
            evaluation?:
              | {
                  badGrowthPercent: number;
                  excellentGrowthPercent: number;
                  goodGrowthPercent: number;
                  kind: "comparison";
                  minVolumeForComparison?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  excellentRatePercent: number;
                  goodRatePercent: number;
                  kind: "conversion";
                  minDenominator?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  goodRatePercent: number;
                  kind: "inverseRate";
                  minDenominator?: number;
                }
              | {
                  badPercentOfGoal: number;
                  excellentPercentOfGoal: number;
                  goodPercentOfGoal: number;
                  kind: "goal";
                  minValueForEvaluation?: number;
                  targetValue: number;
                };
            eventNames: Array<string>;
            label: string;
            name: string;
            rollupGranularity?: "day" | "hour";
            trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
            unit: "count" | "currency" | "bytes";
            valueProperty?: string;
          }>;
          settings: {
            defaultTimezone?: string;
            highVolumeBatchIntervalMinutes: number;
            highVolumeBatchSize: number;
            highVolumeMaxCatchupBatches: number;
            highVolumeShardCount: number;
            maxBreakdownItems: number;
            maxQueryRangeDays: number;
            maxRawEventDeletesPerRun: number;
            maxRollupDeletesPerRun: number;
            maxRollupRowsPerQuery: number;
            mediumVolumeShardCount: number;
            rawEventRetentionDays: number;
            rollupRetentionDays: number;
            trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
          };
        },
        Name
      >;
      fetchDashboardMetrics: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          from: number;
          includeComparison?: boolean;
          includeEvaluation?: boolean;
          metrics: Array<string>;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          to: number;
        },
        {
          metrics: Record<
            string,
            {
              comparison?: {
                current: number;
                delta: number;
                deltaPercent?: number;
                previous: number;
              };
              conversion?: {
                denominator: number;
                denominatorMetric: string;
                numerator: number;
                ratePercent?: number;
              };
              evaluation?: {
                label:
                  | "neutral"
                  | "activity"
                  | "good"
                  | "excellent"
                  | "bad"
                  | "clear";
                reason:
                  | "no_evaluation_config"
                  | "below_min_volume"
                  | "below_min_denominator"
                  | "zero_previous"
                  | "zero_previous_and_current"
                  | "zero_denominator_with_numerator"
                  | "zero_denominator_and_numerator"
                  | "zero_inverse_rate"
                  | "comparison_growth"
                  | "conversion_rate"
                  | "inverse_rate"
                  | "goal_progress"
                  | "zero_target";
                sentiment: "positive" | "negative" | "neutral";
              };
              goal?: {
                percentOfGoal?: number;
                targetValue: number;
                value: number;
              };
              label: string;
              unit: "count" | "currency" | "bytes";
              value: number;
            }
          >;
          range: { from: number; to: number };
          scope: any;
        },
        Name
      >;
      fetchDataAudit: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
        },
        {
          configurations: { count: number; prunableCount: number };
          orphanedJourneys: Array<string>;
          orphanedMetrics: Array<string>;
        },
        Name
      >;
      fetchFunnelConversion: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          from: number;
          funnel: string;
          groupBy?: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          to: number;
        },
        {
          breakdown?: Array<{
            denominator: number;
            dimensionValue: string;
            numerator: number;
            ratePercent?: number;
          }>;
          denominator: number;
          denominatorMetric: string;
          funnel: string;
          groupBy?: string;
          label: string;
          numerator: number;
          numeratorMetric: string;
          range: { from: number; to: number };
          ratePercent?: number;
          scope: any;
          steps: Array<string>;
        },
        Name
      >;
      fetchIngestionHealth: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
        },
        {
          backlogExceedsCycle: boolean;
          drainPerCycle: number;
          oldestPendingAgeMs: number | null;
          pendingAtLeast: number;
        },
        Name
      >;
      fetchJourneyConversion: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          from: number;
          groupBy?: string;
          journey: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          to: number;
        },
        {
          breakdown?: Array<{
            dimensionValue: string;
            ratePercents: Array<number | null>;
            stepCounts: Array<number>;
          }>;
          breakdownProperty?: string;
          journey: string;
          label: string;
          range: { from: number; to: number };
          ratePercents: Array<number | null>;
          scope: any;
          stepCounts: Array<number>;
          steps: Array<string>;
        },
        Name
      >;
      fetchMetricComparison: FunctionReference<
        "query",
        "internal",
        {
          bucketUnit?: "day" | "week" | "month";
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          from: number;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          timezone?: string;
          to: number;
        },
        {
          bucketUnit: "day" | "week" | "month";
          current: number;
          delta: number;
          deltaPercent?: number;
          label: string;
          metric: string;
          previous: number;
          range: {
            current: { from: number; to: number };
            previous: { from: number; to: number };
          };
          scope:
            | { id: string; type: "global" }
            | { id: string; type: "organization" }
            | {
                id: string;
                resourceId: string;
                resourceType: string;
                type: "resource";
              };
          timezone: string;
          unit: "count" | "currency" | "bytes";
        },
        Name
      >;
      fetchMetricConversion: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          denominatorMetric: string;
          from: number;
          numeratorMetric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          to: number;
        },
        {
          denominator: number;
          denominatorMetric: string;
          numerator: number;
          numeratorMetric: string;
          range: { from: number; to: number };
          ratePercent?: number;
          scope: any;
        },
        Name
      >;
      fetchMetricEvaluation: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          from: number;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          to: number;
        },
        {
          comparison?: {
            current: number;
            delta: number;
            deltaPercent?: number;
            previous: number;
          };
          conversion?: {
            denominator: number;
            denominatorMetric?: string;
            numerator: number;
            ratePercent?: number;
          };
          evaluation: {
            label:
              | "neutral"
              | "activity"
              | "good"
              | "excellent"
              | "bad"
              | "clear";
            reason:
              | "no_evaluation_config"
              | "below_min_volume"
              | "below_min_denominator"
              | "zero_previous"
              | "zero_previous_and_current"
              | "zero_denominator_with_numerator"
              | "zero_denominator_and_numerator"
              | "zero_inverse_rate"
              | "comparison_growth"
              | "conversion_rate"
              | "inverse_rate"
              | "goal_progress"
              | "zero_target";
            sentiment: "positive" | "negative" | "neutral";
          };
          goal?: { percentOfGoal?: number; targetValue: number; value: number };
          label: string;
          metric: string;
          range: { from: number; to: number };
          scope: any;
          unit: "count" | "currency" | "bytes";
          value: number;
        },
        Name
      >;
      fetchMetricEvaluationConfig: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
        },
        {
          configEvaluation?:
            | {
                badGrowthPercent: number;
                excellentGrowthPercent: number;
                goodGrowthPercent: number;
                kind: "comparison";
                minVolumeForComparison?: number;
              }
            | {
                badRatePercent: number;
                denominatorMetric: string;
                excellentRatePercent: number;
                goodRatePercent: number;
                kind: "conversion";
                minDenominator?: number;
              }
            | {
                badRatePercent: number;
                denominatorMetric: string;
                goodRatePercent: number;
                kind: "inverseRate";
                minDenominator?: number;
              }
            | {
                badPercentOfGoal: number;
                excellentPercentOfGoal: number;
                goodPercentOfGoal: number;
                kind: "goal";
                minValueForEvaluation?: number;
                targetValue: number;
              };
          evaluation:
            | {
                badGrowthPercent: number;
                excellentGrowthPercent: number;
                goodGrowthPercent: number;
                kind: "comparison";
                minVolumeForComparison?: number;
              }
            | {
                badRatePercent: number;
                denominatorMetric: string;
                excellentRatePercent: number;
                goodRatePercent: number;
                kind: "conversion";
                minDenominator?: number;
              }
            | {
                badRatePercent: number;
                denominatorMetric: string;
                goodRatePercent: number;
                kind: "inverseRate";
                minDenominator?: number;
              }
            | {
                badPercentOfGoal: number;
                excellentPercentOfGoal: number;
                goodPercentOfGoal: number;
                kind: "goal";
                minValueForEvaluation?: number;
                targetValue: number;
              }
            | null;
          metric: string;
          scope: any;
          source: "override" | "config" | "none";
        },
        Name
      >;
      fetchMetricTotalsByDimension: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          days?: number;
          dimensionKey: string;
          maxRows?: number;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
        },
        Array<{ key: string; value: number }>,
        Name
      >;
      fetchSummary: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          from: number;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          to: number;
        },
        {
          label: string;
          metric: string;
          range: { from: number; to: number };
          scope:
            | { id: string; type: "global" }
            | { id: string; type: "organization" }
            | {
                id: string;
                resourceId: string;
                resourceType: string;
                type: "resource";
              };
          unit: "count" | "currency" | "bytes";
          value: number;
        },
        Name
      >;
      fetchTimeSeries: FunctionReference<
        "query",
        "internal",
        {
          bucketUnit?: "day" | "week" | "month";
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          fill?: boolean;
          from: number;
          groupBy?: string;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          timezone?: string;
          to: number;
        },
        {
          config: Record<string, { label: string }>;
          data: Array<Record<string, number>>;
          meta: {
            bucketUnit: "day" | "week" | "month";
            groupBy?: string;
            label: string;
            metric: string;
            omittedSeriesCount: number;
            range: { from: number; to: number };
            scope:
              | { id: string; type: "global" }
              | { id: string; type: "organization" }
              | {
                  id: string;
                  resourceId: string;
                  resourceType: string;
                  type: "resource";
                };
            seriesKeys: Array<string>;
            timezone: string;
            unit: "count" | "currency" | "bytes";
            xValueType: "timestamp";
          };
          x: "date";
        },
        Name
      >;
      fetchTopDimensionValue: FunctionReference<
        "query",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          days?: number;
          dimensionKey: string;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
        },
        string | null,
        Name
      >;
      processPendingHighVolumeAnalyticsEvents: FunctionReference<
        "mutation",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          remainingCatchupBatches?: number;
        },
        { processed: number; scheduledNextBatch: boolean },
        Name
      >;
      pruneAnalyticsData: FunctionReference<
        "mutation",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          journeys?: Array<string>;
          metrics?: Array<string>;
          remainingBatches?: number;
        },
        { deleted: number; scheduledNextBatch: boolean },
        Name
      >;
      purgeStaleAnalyticsEvents: FunctionReference<
        "mutation",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          remainingBatches?: number;
        },
        {
          cutoff?: number;
          deleted: number;
          scheduledNextBatch: boolean;
          skipped: boolean;
        },
        Name
      >;
      purgeStaleAnalyticsRollups: FunctionReference<
        "mutation",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          remainingBatches?: number;
        },
        {
          cutoff?: number;
          deleted: number;
          scheduledNextBatch: boolean;
          skipped: boolean;
        },
        Name
      >;
      writeConfiguration: FunctionReference<
        "mutation",
        "internal",
        {
          events: Array<{
            label: string;
            name: string;
            properties?: Record<string, "string" | "number" | "boolean">;
            requiredProperties?: Array<string>;
          }>;
          funnels?: Record<string, { label: string; steps: Array<string> }>;
          journeys?: Record<
            string,
            { breakdownProperty?: string; label: string; steps: Array<string> }
          >;
          metrics: Array<{
            actorProperty?: string;
            adminOnly?: boolean;
            aggregation:
              | "count"
              | "sum"
              | "avg"
              | "min"
              | "max"
              | "distinctActors";
            description?: string;
            dimensions?: Array<string>;
            evaluation?:
              | {
                  badGrowthPercent: number;
                  excellentGrowthPercent: number;
                  goodGrowthPercent: number;
                  kind: "comparison";
                  minVolumeForComparison?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  excellentRatePercent: number;
                  goodRatePercent: number;
                  kind: "conversion";
                  minDenominator?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  goodRatePercent: number;
                  kind: "inverseRate";
                  minDenominator?: number;
                }
              | {
                  badPercentOfGoal: number;
                  excellentPercentOfGoal: number;
                  goodPercentOfGoal: number;
                  kind: "goal";
                  minValueForEvaluation?: number;
                  targetValue: number;
                };
            eventNames: Array<string>;
            label: string;
            name: string;
            rollupGranularity?: "day" | "hour";
            trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
            unit: "count" | "currency" | "bytes";
            valueProperty?: string;
          }>;
          settings?: {
            defaultTimezone?: string;
            highVolumeBatchIntervalMinutes?: number;
            highVolumeBatchSize?: number;
            highVolumeMaxCatchupBatches?: number;
            highVolumeShardCount?: number;
            maxBreakdownItems?: number;
            maxQueryRangeDays?: number;
            maxRawEventDeletesPerRun?: number;
            maxRollupDeletesPerRun?: number;
            maxRollupRowsPerQuery?: number;
            mediumVolumeShardCount?: number;
            rawEventRetentionDays?: number;
            rollupRetentionDays?: number;
            trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
          };
        },
        { configHash: string },
        Name
      >;
      writeMetricEvaluationOverride: FunctionReference<
        "mutation",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          evaluation:
            | {
                badGrowthPercent: number;
                excellentGrowthPercent: number;
                goodGrowthPercent: number;
                kind: "comparison";
                minVolumeForComparison?: number;
              }
            | {
                badRatePercent: number;
                denominatorMetric: string;
                excellentRatePercent: number;
                goodRatePercent: number;
                kind: "conversion";
                minDenominator?: number;
              }
            | {
                badRatePercent: number;
                denominatorMetric: string;
                goodRatePercent: number;
                kind: "inverseRate";
                minDenominator?: number;
              }
            | {
                badPercentOfGoal: number;
                excellentPercentOfGoal: number;
                goodPercentOfGoal: number;
                kind: "goal";
                minValueForEvaluation?: number;
                targetValue: number;
              }
            | null;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
        },
        null,
        Name
      >;
      writeTrack: FunctionReference<
        "mutation",
        "internal",
        {
          config?: {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          };
          configHash: string;
          events: Array<{
            actorId?: string;
            name: string;
            occurredAt?: number;
            organizationId?: string;
            properties?: Record<string, string | number | boolean | null>;
            scopes?: Array<{
              scopeId: string;
              scopeType: "global" | "organization" | "resource";
            }>;
            source?: {
              name?: string;
              type: "server" | "client" | "webhook" | "system";
            };
            subject?: { id: string; type: string };
            unique?: { key: string; scope?: "forever" };
          }>;
        },
        {
          deduped?: boolean;
          dedupedCount?: number;
          scheduled: boolean;
          scheduledCount: number;
        },
        Name
      >;
    };
    mutations: {
      backfillMonthActorClaims: {
        backfillMonthActorClaims: FunctionReference<
          "mutation",
          "internal",
          { cursor?: string | null },
          { ensured: number; isDone: boolean; processed: number },
          Name
        >;
      };
      pruneAnalyticsData: {
        pruneAnalyticsData: FunctionReference<
          "mutation",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            journeys?: Array<string>;
            metrics?: Array<string>;
            remainingBatches?: number;
          },
          { deleted: number; scheduledNextBatch: boolean },
          Name
        >;
      };
      writeConfiguration: {
        writeConfiguration: FunctionReference<
          "mutation",
          "internal",
          {
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings?: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes?: number;
              highVolumeBatchSize?: number;
              highVolumeMaxCatchupBatches?: number;
              highVolumeShardCount?: number;
              maxBreakdownItems?: number;
              maxQueryRangeDays?: number;
              maxRawEventDeletesPerRun?: number;
              maxRollupDeletesPerRun?: number;
              maxRollupRowsPerQuery?: number;
              mediumVolumeShardCount?: number;
              rawEventRetentionDays?: number;
              rollupRetentionDays?: number;
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
            };
          },
          { configHash: string },
          Name
        >;
      };
      writeMetricEvaluationOverride: {
        writeMetricEvaluationOverride: FunctionReference<
          "mutation",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            evaluation:
              | {
                  badGrowthPercent: number;
                  excellentGrowthPercent: number;
                  goodGrowthPercent: number;
                  kind: "comparison";
                  minVolumeForComparison?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  excellentRatePercent: number;
                  goodRatePercent: number;
                  kind: "conversion";
                  minDenominator?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  goodRatePercent: number;
                  kind: "inverseRate";
                  minDenominator?: number;
                }
              | {
                  badPercentOfGoal: number;
                  excellentPercentOfGoal: number;
                  goodPercentOfGoal: number;
                  kind: "goal";
                  minValueForEvaluation?: number;
                  targetValue: number;
                }
              | null;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
          },
          null,
          Name
        >;
      };
      writeTrack: {
        writeTrack: FunctionReference<
          "mutation",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            events: Array<{
              actorId?: string;
              name: string;
              occurredAt?: number;
              organizationId?: string;
              properties?: Record<string, string | number | boolean | null>;
              scopes?: Array<{
                scopeId: string;
                scopeType: "global" | "organization" | "resource";
              }>;
              source?: {
                name?: string;
                type: "server" | "client" | "webhook" | "system";
              };
              subject?: { id: string; type: string };
              unique?: { key: string; scope?: "forever" };
            }>;
          },
          {
            deduped?: boolean;
            dedupedCount?: number;
            scheduled: boolean;
            scheduledCount: number;
          },
          Name
        >;
      };
    };
    queries: {
      fetchBreakdown: {
        fetchBreakdown: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            from: number;
            groupBy: string;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            to: number;
          },
          {
            config: Record<string, { label: string }>;
            data: Array<{ key: string; value: number }>;
            meta: {
              groupBy: string;
              label: string;
              metric: string;
              omittedSeriesCount: number;
              range: { from: number; to: number };
              scope:
                | { id: string; type: "global" }
                | { id: string; type: "organization" }
                | {
                    id: string;
                    resourceId: string;
                    resourceType: string;
                    type: "resource";
                  };
              unit: "count" | "currency" | "bytes";
            };
          },
          Name
        >;
      };
      fetchConfiguration: {
        fetchConfiguration: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
          },
          {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            funnels?: Record<string, { label: string; steps: Array<string> }>;
            journeys?: Record<
              string,
              {
                breakdownProperty?: string;
                label: string;
                steps: Array<string>;
              }
            >;
            metrics: Array<{
              actorProperty?: string;
              adminOnly?: boolean;
              aggregation:
                | "count"
                | "sum"
                | "avg"
                | "min"
                | "max"
                | "distinctActors";
              description?: string;
              dimensions?: Array<string>;
              evaluation?:
                | {
                    badGrowthPercent: number;
                    excellentGrowthPercent: number;
                    goodGrowthPercent: number;
                    kind: "comparison";
                    minVolumeForComparison?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    excellentRatePercent: number;
                    goodRatePercent: number;
                    kind: "conversion";
                    minDenominator?: number;
                  }
                | {
                    badRatePercent: number;
                    denominatorMetric: string;
                    goodRatePercent: number;
                    kind: "inverseRate";
                    minDenominator?: number;
                  }
                | {
                    badPercentOfGoal: number;
                    excellentPercentOfGoal: number;
                    goodPercentOfGoal: number;
                    kind: "goal";
                    minValueForEvaluation?: number;
                    targetValue: number;
                  };
              eventNames: Array<string>;
              label: string;
              name: string;
              rollupGranularity?: "day" | "hour";
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              defaultTimezone?: string;
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              rollupRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
          },
          Name
        >;
      };
      fetchDashboardMetrics: {
        fetchDashboardMetrics: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            from: number;
            includeComparison?: boolean;
            includeEvaluation?: boolean;
            metrics: Array<string>;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            to: number;
          },
          {
            metrics: Record<
              string,
              {
                comparison?: {
                  current: number;
                  delta: number;
                  deltaPercent?: number;
                  previous: number;
                };
                conversion?: {
                  denominator: number;
                  denominatorMetric: string;
                  numerator: number;
                  ratePercent?: number;
                };
                evaluation?: {
                  label:
                    | "neutral"
                    | "activity"
                    | "good"
                    | "excellent"
                    | "bad"
                    | "clear";
                  reason:
                    | "no_evaluation_config"
                    | "below_min_volume"
                    | "below_min_denominator"
                    | "zero_previous"
                    | "zero_previous_and_current"
                    | "zero_denominator_with_numerator"
                    | "zero_denominator_and_numerator"
                    | "zero_inverse_rate"
                    | "comparison_growth"
                    | "conversion_rate"
                    | "inverse_rate"
                    | "goal_progress"
                    | "zero_target";
                  sentiment: "positive" | "negative" | "neutral";
                };
                goal?: {
                  percentOfGoal?: number;
                  targetValue: number;
                  value: number;
                };
                label: string;
                unit: "count" | "currency" | "bytes";
                value: number;
              }
            >;
            range: { from: number; to: number };
            scope: any;
          },
          Name
        >;
      };
      fetchDataAudit: {
        fetchDataAudit: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
          },
          {
            configurations: { count: number; prunableCount: number };
            orphanedJourneys: Array<string>;
            orphanedMetrics: Array<string>;
          },
          Name
        >;
      };
      fetchFunnelConversion: {
        fetchFunnelConversion: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            from: number;
            funnel: string;
            groupBy?: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            to: number;
          },
          {
            breakdown?: Array<{
              denominator: number;
              dimensionValue: string;
              numerator: number;
              ratePercent?: number;
            }>;
            denominator: number;
            denominatorMetric: string;
            funnel: string;
            groupBy?: string;
            label: string;
            numerator: number;
            numeratorMetric: string;
            range: { from: number; to: number };
            ratePercent?: number;
            scope: any;
            steps: Array<string>;
          },
          Name
        >;
      };
      fetchIngestionHealth: {
        fetchIngestionHealth: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
          },
          {
            backlogExceedsCycle: boolean;
            drainPerCycle: number;
            oldestPendingAgeMs: number | null;
            pendingAtLeast: number;
          },
          Name
        >;
      };
      fetchJourneyConversion: {
        fetchJourneyConversion: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            from: number;
            groupBy?: string;
            journey: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            to: number;
          },
          {
            breakdown?: Array<{
              dimensionValue: string;
              ratePercents: Array<number | null>;
              stepCounts: Array<number>;
            }>;
            breakdownProperty?: string;
            journey: string;
            label: string;
            range: { from: number; to: number };
            ratePercents: Array<number | null>;
            scope: any;
            stepCounts: Array<number>;
            steps: Array<string>;
          },
          Name
        >;
      };
      fetchMetricComparison: {
        fetchMetricComparison: FunctionReference<
          "query",
          "internal",
          {
            bucketUnit?: "day" | "week" | "month";
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            from: number;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            timezone?: string;
            to: number;
          },
          {
            bucketUnit: "day" | "week" | "month";
            current: number;
            delta: number;
            deltaPercent?: number;
            label: string;
            metric: string;
            previous: number;
            range: {
              current: { from: number; to: number };
              previous: { from: number; to: number };
            };
            scope:
              | { id: string; type: "global" }
              | { id: string; type: "organization" }
              | {
                  id: string;
                  resourceId: string;
                  resourceType: string;
                  type: "resource";
                };
            timezone: string;
            unit: "count" | "currency" | "bytes";
          },
          Name
        >;
      };
      fetchMetricConversion: {
        fetchMetricConversion: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            denominatorMetric: string;
            from: number;
            numeratorMetric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            to: number;
          },
          {
            denominator: number;
            denominatorMetric: string;
            numerator: number;
            numeratorMetric: string;
            range: { from: number; to: number };
            ratePercent?: number;
            scope: any;
          },
          Name
        >;
      };
      fetchMetricEvaluation: {
        fetchMetricEvaluation: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            from: number;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            to: number;
          },
          {
            comparison?: {
              current: number;
              delta: number;
              deltaPercent?: number;
              previous: number;
            };
            conversion?: {
              denominator: number;
              denominatorMetric?: string;
              numerator: number;
              ratePercent?: number;
            };
            evaluation: {
              label:
                | "neutral"
                | "activity"
                | "good"
                | "excellent"
                | "bad"
                | "clear";
              reason:
                | "no_evaluation_config"
                | "below_min_volume"
                | "below_min_denominator"
                | "zero_previous"
                | "zero_previous_and_current"
                | "zero_denominator_with_numerator"
                | "zero_denominator_and_numerator"
                | "zero_inverse_rate"
                | "comparison_growth"
                | "conversion_rate"
                | "inverse_rate"
                | "goal_progress"
                | "zero_target";
              sentiment: "positive" | "negative" | "neutral";
            };
            goal?: {
              percentOfGoal?: number;
              targetValue: number;
              value: number;
            };
            label: string;
            metric: string;
            range: { from: number; to: number };
            scope: any;
            unit: "count" | "currency" | "bytes";
            value: number;
          },
          Name
        >;
      };
      fetchMetricEvaluationConfig: {
        fetchMetricEvaluationConfig: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
          },
          {
            configEvaluation?:
              | {
                  badGrowthPercent: number;
                  excellentGrowthPercent: number;
                  goodGrowthPercent: number;
                  kind: "comparison";
                  minVolumeForComparison?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  excellentRatePercent: number;
                  goodRatePercent: number;
                  kind: "conversion";
                  minDenominator?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  goodRatePercent: number;
                  kind: "inverseRate";
                  minDenominator?: number;
                }
              | {
                  badPercentOfGoal: number;
                  excellentPercentOfGoal: number;
                  goodPercentOfGoal: number;
                  kind: "goal";
                  minValueForEvaluation?: number;
                  targetValue: number;
                };
            evaluation:
              | {
                  badGrowthPercent: number;
                  excellentGrowthPercent: number;
                  goodGrowthPercent: number;
                  kind: "comparison";
                  minVolumeForComparison?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  excellentRatePercent: number;
                  goodRatePercent: number;
                  kind: "conversion";
                  minDenominator?: number;
                }
              | {
                  badRatePercent: number;
                  denominatorMetric: string;
                  goodRatePercent: number;
                  kind: "inverseRate";
                  minDenominator?: number;
                }
              | {
                  badPercentOfGoal: number;
                  excellentPercentOfGoal: number;
                  goodPercentOfGoal: number;
                  kind: "goal";
                  minValueForEvaluation?: number;
                  targetValue: number;
                }
              | null;
            metric: string;
            scope: any;
            source: "override" | "config" | "none";
          },
          Name
        >;
      };
      fetchMetricTotalsByDimension: {
        fetchMetricTotalsByDimension: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            days?: number;
            dimensionKey: string;
            maxRows?: number;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
          },
          Array<{ key: string; value: number }>,
          Name
        >;
      };
      fetchSummary: {
        fetchSummary: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            from: number;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            to: number;
          },
          {
            label: string;
            metric: string;
            range: { from: number; to: number };
            scope:
              | { id: string; type: "global" }
              | { id: string; type: "organization" }
              | {
                  id: string;
                  resourceId: string;
                  resourceType: string;
                  type: "resource";
                };
            unit: "count" | "currency" | "bytes";
            value: number;
          },
          Name
        >;
      };
      fetchTimeSeries: {
        fetchTimeSeries: FunctionReference<
          "query",
          "internal",
          {
            bucketUnit?: "day" | "week" | "month";
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            fill?: boolean;
            from: number;
            groupBy?: string;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            timezone?: string;
            to: number;
          },
          {
            config: Record<string, { label: string }>;
            data: Array<Record<string, number>>;
            meta: {
              bucketUnit: "day" | "week" | "month";
              groupBy?: string;
              label: string;
              metric: string;
              omittedSeriesCount: number;
              range: { from: number; to: number };
              scope:
                | { id: string; type: "global" }
                | { id: string; type: "organization" }
                | {
                    id: string;
                    resourceId: string;
                    resourceType: string;
                    type: "resource";
                  };
              seriesKeys: Array<string>;
              timezone: string;
              unit: "count" | "currency" | "bytes";
              xValueType: "timestamp";
            };
            x: "date";
          },
          Name
        >;
      };
      fetchTopDimensionValue: {
        fetchTopDimensionValue: FunctionReference<
          "query",
          "internal",
          {
            config?: {
              configHash?: string;
              events: Array<{
                label: string;
                name: string;
                properties?: Record<string, "string" | "number" | "boolean">;
                requiredProperties?: Array<string>;
              }>;
              funnels?: Record<string, { label: string; steps: Array<string> }>;
              journeys?: Record<
                string,
                {
                  breakdownProperty?: string;
                  label: string;
                  steps: Array<string>;
                }
              >;
              metrics: Array<{
                actorProperty?: string;
                adminOnly?: boolean;
                aggregation:
                  | "count"
                  | "sum"
                  | "avg"
                  | "min"
                  | "max"
                  | "distinctActors";
                description?: string;
                dimensions?: Array<string>;
                evaluation?:
                  | {
                      badGrowthPercent: number;
                      excellentGrowthPercent: number;
                      goodGrowthPercent: number;
                      kind: "comparison";
                      minVolumeForComparison?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      excellentRatePercent: number;
                      goodRatePercent: number;
                      kind: "conversion";
                      minDenominator?: number;
                    }
                  | {
                      badRatePercent: number;
                      denominatorMetric: string;
                      goodRatePercent: number;
                      kind: "inverseRate";
                      minDenominator?: number;
                    }
                  | {
                      badPercentOfGoal: number;
                      excellentPercentOfGoal: number;
                      goodPercentOfGoal: number;
                      kind: "goal";
                      minValueForEvaluation?: number;
                      targetValue: number;
                    };
                eventNames: Array<string>;
                label: string;
                name: string;
                rollupGranularity?: "day" | "hour";
                trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
                unit: "count" | "currency" | "bytes";
                valueProperty?: string;
              }>;
              settings: {
                defaultTimezone?: string;
                highVolumeBatchIntervalMinutes: number;
                highVolumeBatchSize: number;
                highVolumeMaxCatchupBatches: number;
                highVolumeShardCount: number;
                maxBreakdownItems: number;
                maxQueryRangeDays: number;
                maxRawEventDeletesPerRun: number;
                maxRollupDeletesPerRun: number;
                maxRollupRowsPerQuery: number;
                mediumVolumeShardCount: number;
                rawEventRetentionDays: number;
                rollupRetentionDays: number;
                trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
              };
            };
            configHash: string;
            days?: number;
            dimensionKey: string;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
          },
          string | null,
          Name
        >;
      };
    };
  };
