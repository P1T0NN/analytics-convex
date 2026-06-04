// LIBRARIES
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    analyticsConfigs: defineTable({
        key: v.string(),
        events: v.array(
            v.object({
                name: v.string(),
                label: v.string(),
        properties: v.optional(
          v.record(
            v.string(),
            v.union(v.literal("string"), v.literal("number"), v.literal("boolean")),
          ),
        ),
                requiredProperties: v.optional(v.array(v.string())),
            }),
    ),
    metrics: v.array(
        v.object({
            name: v.string(),
            label: v.string(),
            description: v.optional(v.string()),
            unit: v.union(
                v.literal("count"),
                v.literal("currency"),
                v.literal("bytes"),
            ),
            eventNames: v.array(v.string()),
            aggregation: v.union(v.literal("count"), v.literal("sum")),
            valueProperty: v.optional(v.string()),
            dimensions: v.optional(v.array(v.string())),
            trafficMode: v.optional(
                v.union(
                    v.literal("lowVolume"),
                    v.literal("mediumVolume"),
                    v.literal("highVolume"),
                ),
            ),
            adminOnly: v.optional(v.boolean()),
        }),
    ),
    settings: v.object({
        trafficMode: v.union(
            v.literal("lowVolume"),
            v.literal("mediumVolume"),
            v.literal("highVolume"),
        ),
        mediumVolumeShardCount: v.number(),
        highVolumeShardCount: v.number(),
        highVolumeBatchSize: v.number(),
        highVolumeBatchIntervalMinutes: v.number(),
        highVolumeMaxCatchupBatches: v.number(),
        maxQueryRangeDays: v.number(),
        maxRollupRowsPerQuery: v.number(),
        maxBreakdownItems: v.number(),
        rawEventRetentionDays: v.number(),
        maxRawEventDeletesPerRun: v.number(),
    }),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  analyticsEvents: defineTable({
        name: v.string(),
        occurredAt: v.number(),
        actorId: v.optional(v.string()),
        organizationId: v.optional(v.string()),
        subject: v.optional(
            v.object({
                type: v.string(),
                id: v.string(),
            }),
        ),
        scopes: v.optional(
            v.array(
                v.object({
                    scopeType: v.union(
                        v.literal("global"),
                        v.literal("organization"),
                        v.literal("resource"),
                    ),
                    scopeId: v.string(),
                }),
            ),
        ),
        properties: v.optional(v.any()),
        source: v.optional(
            v.object({
                type: v.union(
                    v.literal("server"),
                    v.literal("client"),
                    v.literal("webhook"),
                    v.literal("system"),
                ),
                name: v.optional(v.string()),
            }),
        ),
        idempotencyKey: v.optional(v.string()),
        highVolumeStatus: v.optional(
            v.union(v.literal("none"), v.literal("pending"), v.literal("processed")),
        ),
        highVolumeAggregatedAt: v.optional(v.number()),
  })
    .index("by_high_volume_status_occurred_at", [
      "highVolumeStatus",
      "occurredAt",
    ])
    .index("by_idempotency_key", ["idempotencyKey"]),

  analyticsDailyMetrics: defineTable({
        metric: v.string(),
        granularity: v.literal("day"),
        bucketStart: v.number(),
        scopeType: v.union(
            v.literal("global"),
            v.literal("organization"),
            v.literal("resource"),
        ),
        scopeId: v.string(),
        dimensionKey: v.string(),
        dimensionValue: v.string(),
        shard: v.optional(v.number()),
        value: v.number(),
        updatedAt: v.number(),
  })
    .index("by_metric_scope_dimension_bucket", [
      "metric",
      "scopeType",
      "scopeId",
      "granularity",
      "dimensionKey",
      "bucketStart",
    ])
    .index("by_metric_scope_dimension_value_bucket_shard", [
      "metric",
      "scopeType",
      "scopeId",
      "granularity",
      "dimensionKey",
      "dimensionValue",
      "bucketStart",
      "shard",
    ]),
});
