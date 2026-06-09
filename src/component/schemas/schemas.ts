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

export const aggregationValidator = v.union(
	v.literal("count"),
	v.literal("sum"),
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
	dashboardMetricItemValidator,
	dashboardMetricsResponseValidator,
} from "../../shared/schemas/dashboardSchemas.js";

export {
	metricComparisonEvaluationConfigValidator,
	metricConversionEvaluationConfigValidator,
	metricConversionResponseValidator,
	metricEvaluationConfigValidator,
	metricEvaluationReasonValidator,
	metricEvaluationResponseValidator,
	metricEvaluationResultValidator,
	metricInverseRateEvaluationConfigValidator,
	metricLabelValidator,
} from "../../shared/schemas/evaluationSchemas.js";

import { metricEvaluationConfigValidator } from "../../shared/schemas/evaluationSchemas.js";
import { funnelsConfigValidator } from "../../shared/schemas/funnelSchemas.js";

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

export const analyticsRuntimeConfigValidator = v.object({
	events: v.array(eventConfigValidator),
	metrics: v.array(metricConfigValidator),
	funnels: v.optional(funnelsConfigValidator),
	settings: settingsValidator,
	configHash: v.optional(v.string()),
});

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
