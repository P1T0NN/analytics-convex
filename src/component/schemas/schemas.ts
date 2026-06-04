// LIBRARIES
import { v } from "convex/values";

export const trafficModeValidator = v.union(
    v.literal("lowVolume"),
    v.literal("mediumVolume"),
    v.literal("highVolume"),
);

export const unitValidator = v.union(
    v.literal("count"),
    v.literal("currency"),
    v.literal("bytes"),
);

export const aggregationValidator = v.union(v.literal("count"), v.literal("sum"));

export const propertyTypeValidator = v.union(
    v.literal("string"),
    v.literal("number"),
    v.literal("boolean"),
);

export const propertyValueValidator = v.union(
    v.string(),
    v.number(),
    v.boolean(),
    v.null(),
);

export const sourceValidator = v.object({
    type: v.union(
        v.literal("server"),
        v.literal("client"),
        v.literal("webhook"),
        v.literal("system"),
    ),
    name: v.optional(v.string()),
});

export const scopeValidator = v.object({
    scopeType: v.union(
        v.literal("global"),
        v.literal("organization"),
        v.literal("resource"),
    ),
    scopeId: v.string(),
});

export const subjectValidator = v.object({
    type: v.string(),
    id: v.string(),
});

export const eventConfigValidator = v.object({
    name: v.string(),
    label: v.string(),
    properties: v.optional(v.record(v.string(), propertyTypeValidator)),
    requiredProperties: v.optional(v.array(v.string())),
});

export const metricConfigValidator = v.object({
    name: v.string(),
    label: v.string(),
    description: v.optional(v.string()),
    unit: unitValidator,
    eventNames: v.array(v.string()),
    aggregation: aggregationValidator,
    valueProperty: v.optional(v.string()),
    dimensions: v.optional(v.array(v.string())),
    trafficMode: v.optional(trafficModeValidator),
    adminOnly: v.optional(v.boolean()),
});

export const settingsValidator = v.object({
    trafficMode: trafficModeValidator,
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
});

export const settingsPatchValidator = v.object({
    trafficMode: v.optional(trafficModeValidator),
    mediumVolumeShardCount: v.optional(v.number()),
    highVolumeShardCount: v.optional(v.number()),
    highVolumeBatchSize: v.optional(v.number()),
    highVolumeBatchIntervalMinutes: v.optional(v.number()),
    highVolumeMaxCatchupBatches: v.optional(v.number()),
    maxQueryRangeDays: v.optional(v.number()),
    maxRollupRowsPerQuery: v.optional(v.number()),
    maxBreakdownItems: v.optional(v.number()),
    rawEventRetentionDays: v.optional(v.number()),
    maxRawEventDeletesPerRun: v.optional(v.number()),
});

export const scopeInputValidator = v.union(
    v.object({
        type: v.literal("global"),
        id: v.optional(v.string()),
    }),
    v.object({
        type: v.literal("organization"),
        id: v.string(),
    }),
    v.object({
        type: v.literal("resource"),
        resourceType: v.string(),
        id: v.string(),
    }),
);

export const resolvedScopeValidator = v.union(
    v.object({
        type: v.literal("global"),
        id: v.string(),
    }),
    v.object({
        type: v.literal("organization"),
        id: v.string(),
    }),
    v.object({
        type: v.literal("resource"),
        resourceType: v.string(),
        resourceId: v.string(),
        id: v.string(),
    }),
);

export const chartConfigValidator = v.record(
    v.string(),
    v.object({ label: v.string() }),
);

export const rangeValidator = v.object({
    from: v.number(),
    to: v.number(),
});

export const trackEventInputValidator = v.object({
    name: v.string(),
    occurredAt: v.optional(v.number()),
    actorId: v.optional(v.string()),
    organizationId: v.optional(v.string()),
    subject: v.optional(subjectValidator),
    scopes: v.optional(v.array(scopeValidator)),
    properties: v.optional(v.record(v.string(), propertyValueValidator)),
    source: v.optional(sourceValidator),
});

export const preparedTrackEventInputValidator = v.object({
    name: v.string(),
    occurredAt: v.number(),
    actorId: v.optional(v.string()),
    organizationId: v.optional(v.string()),
    subject: v.optional(subjectValidator),
    scopes: v.optional(v.array(scopeValidator)),
    properties: v.record(v.string(), propertyValueValidator),
    source: sourceValidator,
    idempotencyKey: v.string(),
});
