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
      processPendingHighVolumeAnalyticsEvents: {
        processPendingHighVolumeAnalyticsEvents: FunctionReference<
          "mutation",
          "internal",
          { remainingCatchupBatches?: number },
          { processed: number; scheduledNextBatch: boolean },
          Name
        >;
      };
      purgeStaleAnalyticsEvents: {
        purgeStaleAnalyticsEvents: FunctionReference<
          "mutation",
          "internal",
          {},
          { cutoff?: number; deleted: number; skipped: boolean },
          Name
        >;
      };
    };
    lib: {
      fetchBreakdown: FunctionReference<
        "query",
        "internal",
        {
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
        {},
        null | {
          configHash?: string;
          events: Array<{
            label: string;
            name: string;
            properties?: Record<string, "string" | "number" | "boolean">;
            requiredProperties?: Array<string>;
          }>;
          metrics: Array<{
            adminOnly?: boolean;
            aggregation: "count" | "sum";
            description?: string;
            dimensions?: Array<string>;
            eventNames: Array<string>;
            label: string;
            name: string;
            trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
            unit: "count" | "currency" | "bytes";
            valueProperty?: string;
          }>;
          settings: {
            highVolumeBatchIntervalMinutes: number;
            highVolumeBatchSize: number;
            highVolumeMaxCatchupBatches: number;
            highVolumeShardCount: number;
            maxBreakdownItems: number;
            maxQueryRangeDays: number;
            maxRawEventDeletesPerRun: number;
            maxRollupRowsPerQuery: number;
            mediumVolumeShardCount: number;
            rawEventRetentionDays: number;
            trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
          };
          updatedAt: number;
        },
        Name
      >;
      fetchMetricComparison: FunctionReference<
        "query",
        "internal",
        {
          from: number;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          to: number;
        },
        {
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
          unit: "count" | "currency" | "bytes";
        },
        Name
      >;
      fetchMetricTotalsByDimension: FunctionReference<
        "query",
        "internal",
        {
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
          fill?: boolean;
          from: number;
          groupBy?: string;
          metric: string;
          scope?:
            | { id?: string; type: "global" }
            | { id: string; type: "organization" }
            | { id: string; resourceType: string; type: "resource" };
          to: number;
        },
        {
          config: Record<string, { label: string }>;
          data: Array<Record<string, number>>;
          meta: {
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
        { remainingCatchupBatches?: number },
        { processed: number; scheduledNextBatch: boolean },
        Name
      >;
      purgeStaleAnalyticsEvents: FunctionReference<
        "mutation",
        "internal",
        {},
        { cutoff?: number; deleted: number; skipped: boolean },
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
          metrics: Array<{
            adminOnly?: boolean;
            aggregation: "count" | "sum";
            description?: string;
            dimensions?: Array<string>;
            eventNames: Array<string>;
            label: string;
            name: string;
            trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
            unit: "count" | "currency" | "bytes";
            valueProperty?: string;
          }>;
          settings?: {
            highVolumeBatchIntervalMinutes?: number;
            highVolumeBatchSize?: number;
            highVolumeMaxCatchupBatches?: number;
            highVolumeShardCount?: number;
            maxBreakdownItems?: number;
            maxQueryRangeDays?: number;
            maxRawEventDeletesPerRun?: number;
            maxRollupRowsPerQuery?: number;
            mediumVolumeShardCount?: number;
            rawEventRetentionDays?: number;
            trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
          };
        },
        null,
        Name
      >;
      writeTrack: FunctionReference<
        "mutation",
        "internal",
        {
          actorId?: string;
          events?: Array<{
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
          }>;
          name?: string;
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
        },
        { scheduled: boolean; scheduledCount: number },
        Name
      >;
    };
    mutations: {
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
            metrics: Array<{
              adminOnly?: boolean;
              aggregation: "count" | "sum";
              description?: string;
              dimensions?: Array<string>;
              eventNames: Array<string>;
              label: string;
              name: string;
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings?: {
              highVolumeBatchIntervalMinutes?: number;
              highVolumeBatchSize?: number;
              highVolumeMaxCatchupBatches?: number;
              highVolumeShardCount?: number;
              maxBreakdownItems?: number;
              maxQueryRangeDays?: number;
              maxRawEventDeletesPerRun?: number;
              maxRollupRowsPerQuery?: number;
              mediumVolumeShardCount?: number;
              rawEventRetentionDays?: number;
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
            };
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
            actorId?: string;
            events?: Array<{
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
            }>;
            name?: string;
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
          },
          { scheduled: boolean; scheduledCount: number },
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
          {},
          null | {
            configHash?: string;
            events: Array<{
              label: string;
              name: string;
              properties?: Record<string, "string" | "number" | "boolean">;
              requiredProperties?: Array<string>;
            }>;
            metrics: Array<{
              adminOnly?: boolean;
              aggregation: "count" | "sum";
              description?: string;
              dimensions?: Array<string>;
              eventNames: Array<string>;
              label: string;
              name: string;
              trafficMode?: "lowVolume" | "mediumVolume" | "highVolume";
              unit: "count" | "currency" | "bytes";
              valueProperty?: string;
            }>;
            settings: {
              highVolumeBatchIntervalMinutes: number;
              highVolumeBatchSize: number;
              highVolumeMaxCatchupBatches: number;
              highVolumeShardCount: number;
              maxBreakdownItems: number;
              maxQueryRangeDays: number;
              maxRawEventDeletesPerRun: number;
              maxRollupRowsPerQuery: number;
              mediumVolumeShardCount: number;
              rawEventRetentionDays: number;
              trafficMode: "lowVolume" | "mediumVolume" | "highVolume";
            };
            updatedAt: number;
          },
          Name
        >;
      };
      fetchMetricComparison: {
        fetchMetricComparison: FunctionReference<
          "query",
          "internal",
          {
            from: number;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            to: number;
          },
          {
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
            unit: "count" | "currency" | "bytes";
          },
          Name
        >;
      };
      fetchMetricTotalsByDimension: {
        fetchMetricTotalsByDimension: FunctionReference<
          "query",
          "internal",
          {
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
            fill?: boolean;
            from: number;
            groupBy?: string;
            metric: string;
            scope?:
              | { id?: string; type: "global" }
              | { id: string; type: "organization" }
              | { id: string; resourceType: string; type: "resource" };
            to: number;
          },
          {
            config: Record<string, { label: string }>;
            data: Array<Record<string, number>>;
            meta: {
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
