// LIBRARIES
import { v } from "convex/values";

// SHARED SCHEMAS
export {
	propertyValueValidator,
	scopeInputValidator,
	scopeValidator,
	sourceValidator,
	subjectValidator,
	trackEventInputFields,
	trackEventInputValidator,
	uniqueEventValidator,
	uniqueScopeValidator,
} from "../../shared/schemas/analyticsSchemas.js";

import {
	propertyValueValidator,
	sourceValidator,
	trackEventInputFields,
} from "../../shared/schemas/analyticsSchemas.js";

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

export const rollupGranularityValidator = v.union(
	v.literal("day"),
	v.literal("hour"),
);

export const bucketUnitValidator = v.union(
	v.literal("day"),
	v.literal("week"),
	v.literal("month"),
);

export const timezoneValidator = v.string();

export const aggregationValidator = v.union(
	v.literal("count"),
	v.literal("sum"),
	v.literal("avg"),
	v.literal("min"),
	v.literal("max"),
	v.literal("distinctActors"),
);

export const propertyTypeValidator = v.union(
	v.literal("string"),
	v.literal("number"),
	v.literal("boolean"),
);

export const eventConfigValidator = v.object({
	name: v.string(),
	label: v.string(),
	properties: v.optional(v.record(v.string(), propertyTypeValidator)),
	requiredProperties: v.optional(v.array(v.string())),
});

export {
	funnelConfigValidator,
	funnelsConfigValidator,
	funnelConversionResponseValidator,
} from "../../shared/schemas/funnelSchemas.js";

export {
	journeyConfigValidator,
	journeysConfigValidator,
	journeyConversionResponseValidator,
} from "../../shared/schemas/journeySchemas.js";

export {
	dashboardMetricItemValidator,
	dashboardMetricsResponseValidator,
} from "../../shared/schemas/dashboardSchemas.js";

export {
	metricComparisonEvaluationConfigValidator,
	metricConversionEvaluationConfigValidator,
	metricConversionResponseValidator,
	metricEvaluationConfigResponseValidator,
	metricEvaluationConfigSourceValidator,
	metricEvaluationConfigValidator,
	metricEvaluationReasonValidator,
	metricEvaluationResponseValidator,
	metricEvaluationResultValidator,
	metricInverseRateEvaluationConfigValidator,
	metricLabelValidator,
	metricSentimentValidator,
} from "../../shared/schemas/evaluationSchemas.js";

import { metricEvaluationConfigValidator } from "../../shared/schemas/evaluationSchemas.js";
import { funnelsConfigValidator } from "../../shared/schemas/funnelSchemas.js";
import { journeysConfigValidator } from "../../shared/schemas/journeySchemas.js";

export const metricConfigValidator = v.object({
	name: v.string(),
	label: v.string(),
	description: v.optional(v.string()),
	unit: unitValidator,
	eventNames: v.array(v.string()),
	aggregation: aggregationValidator,
	valueProperty: v.optional(v.string()),
	actorProperty: v.optional(v.string()),
	dimensions: v.optional(v.array(v.string())),
	trafficMode: v.optional(trafficModeValidator),
	rollupGranularity: v.optional(rollupGranularityValidator),
	adminOnly: v.optional(v.boolean()),
	evaluation: v.optional(metricEvaluationConfigValidator),
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
	rollupRetentionDays: v.number(),
	maxRollupDeletesPerRun: v.number(),
	defaultTimezone: v.optional(v.string()),
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
	rollupRetentionDays: v.optional(v.number()),
	maxRollupDeletesPerRun: v.optional(v.number()),
	defaultTimezone: v.optional(v.string()),
});

export const analyticsRuntimeConfigValidator = v.object({
	events: v.array(eventConfigValidator),
	metrics: v.array(metricConfigValidator),
	funnels: v.optional(funnelsConfigValidator),
	journeys: v.optional(journeysConfigValidator),
	settings: settingsValidator,
	configHash: v.optional(v.string()),
});

/** Persisted configuration blob — no configHash field. */
export const storedAnalyticsConfigValidator = v.object({
	events: v.array(eventConfigValidator),
	metrics: v.array(metricConfigValidator),
	funnels: v.optional(funnelsConfigValidator),
	journeys: v.optional(journeysConfigValidator),
	settings: settingsValidator,
});

export const configReferenceFields = {
	configHash: v.string(),
	config: v.optional(analyticsRuntimeConfigValidator),
};

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

export const preparedTrackEventInputFields = {
	name: v.string(),
	...trackEventInputFields,
	occurredAt: v.number(),
	properties: v.record(v.string(), propertyValueValidator),
	source: sourceValidator,
	idempotencyKey: v.string(),
};

export const preparedTrackEventInputValidator = v.object(
	preparedTrackEventInputFields,
);
