// CONSTANTS
import { ANALYTICS_LIMITS } from "../../shared/constants.js";
import { DAY_MS } from "../../shared/constants.js";

// UTILS
import {
	startOfUtcDay,
} from "../../shared/utils/analyticsDateRangeUtils.js";
import { internalBadRequest } from "../errors/errors.js";
import { internalAssertValidTimeZone } from "../../shared/utils/analyticsTimezoneUtils.js";

// VALIDATIONS
import { internalValidateConfigurationLimits } from "./configurationLimits.js";
import { internalAssertNumberAtMost } from "./limitUtils.js";

// TYPES
import type {
	typesAnalyticsConfigState,
} from "../../shared/types/componentInternal.js";
import type {
	typesAnalyticsEventConfigRuntime,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsJourneysConfig,
	typesAnalyticsMetricConfigRuntime,
} from "../../shared/types/config.js";
import type {
	typesMetricEvaluationConfig,
} from "../../shared/types/evaluation.js";
import type {
	typesAnalyticsProperties,
	typesAnalyticsPropertyValue,
} from "../../shared/types/primitives.js";
import type {
	typesAnalyticsSettings,
} from "../../shared/types/settings.js";

export function internalAssertNonEmptyString(value: string, field: string) {
	if (value.trim().length === 0) {
		internalBadRequest(`${field} must not be empty.`);
	}
}

export function internalAssertPositiveInteger(
	value: number,
	field: keyof typesAnalyticsSettings,
) {
	if (!Number.isInteger(value) || value <= 0) {
		internalBadRequest(`settings.${field} must be a positive integer.`);
	}
}

export function internalAssertNonNegativeInteger(
	value: number,
	field: keyof typesAnalyticsSettings,
) {
	if (!Number.isInteger(value) || value < 0) {
		internalBadRequest(`settings.${field} must be a non-negative integer.`);
	}
}

export function internalValidateSettings(settings: typesAnalyticsSettings) {
	internalAssertPositiveInteger(
		settings.mediumVolumeShardCount,
		"mediumVolumeShardCount",
	);
	internalAssertPositiveInteger(settings.highVolumeShardCount, "highVolumeShardCount");
	internalAssertPositiveInteger(settings.highVolumeBatchSize, "highVolumeBatchSize");
	internalAssertPositiveInteger(
		settings.highVolumeBatchIntervalMinutes,
		"highVolumeBatchIntervalMinutes",
	);
	internalAssertNonNegativeInteger(
		settings.highVolumeMaxCatchupBatches,
		"highVolumeMaxCatchupBatches",
	);
	internalAssertPositiveInteger(settings.maxQueryRangeDays, "maxQueryRangeDays");
	internalAssertPositiveInteger(
		settings.maxRollupRowsPerQuery,
		"maxRollupRowsPerQuery",
	);
	internalAssertPositiveInteger(settings.maxBreakdownItems, "maxBreakdownItems");
	internalAssertNonNegativeInteger(
		settings.rawEventRetentionDays,
		"rawEventRetentionDays",
	);
	internalAssertPositiveInteger(
		settings.maxRawEventDeletesPerRun,
		"maxRawEventDeletesPerRun",
	);

	internalAssertNumberAtMost(
		settings.mediumVolumeShardCount,
		ANALYTICS_LIMITS.maxMediumVolumeShardCount,
		"settings.mediumVolumeShardCount",
	);
	internalAssertNumberAtMost(
		settings.highVolumeShardCount,
		ANALYTICS_LIMITS.maxHighVolumeShardCount,
		"settings.highVolumeShardCount",
	);
	internalAssertNumberAtMost(
		settings.highVolumeBatchSize,
		ANALYTICS_LIMITS.maxHighVolumeBatchSize,
		"settings.highVolumeBatchSize",
	);
	internalAssertNumberAtMost(
		settings.highVolumeMaxCatchupBatches,
		ANALYTICS_LIMITS.maxHighVolumeMaxCatchupBatches,
		"settings.highVolumeMaxCatchupBatches",
	);
	internalAssertNumberAtMost(
		settings.maxQueryRangeDays,
		ANALYTICS_LIMITS.maxQueryRangeDays,
		"settings.maxQueryRangeDays",
	);
	internalAssertNumberAtMost(
		settings.maxRollupRowsPerQuery,
		ANALYTICS_LIMITS.maxRollupRowsPerQuery,
		"settings.maxRollupRowsPerQuery",
	);
	internalAssertNumberAtMost(
		settings.maxBreakdownItems,
		ANALYTICS_LIMITS.maxBreakdownItems,
		"settings.maxBreakdownItems",
	);
	internalAssertNumberAtMost(
		settings.rawEventRetentionDays,
		ANALYTICS_LIMITS.maxRawEventRetentionDays,
		"settings.rawEventRetentionDays",
	);
	internalAssertNumberAtMost(
		settings.maxRawEventDeletesPerRun,
		ANALYTICS_LIMITS.maxRawEventDeletesPerRun,
		"settings.maxRawEventDeletesPerRun",
	);
	internalAssertNonNegativeInteger(
		settings.rollupRetentionDays,
		"rollupRetentionDays",
	);
	internalAssertPositiveInteger(
		settings.maxRollupDeletesPerRun,
		"maxRollupDeletesPerRun",
	);
	internalAssertNumberAtMost(
		settings.rollupRetentionDays,
		ANALYTICS_LIMITS.maxRollupRetentionDays,
		"settings.rollupRetentionDays",
	);
	internalAssertNumberAtMost(
		settings.maxRollupDeletesPerRun,
		ANALYTICS_LIMITS.maxRollupDeletesPerRun,
		"settings.maxRollupDeletesPerRun",
	);

	if (settings.defaultTimezone !== undefined) {
		try {
			internalAssertValidTimeZone(settings.defaultTimezone);
		} catch {
			internalBadRequest(
				`settings.defaultTimezone must be a valid IANA timezone; received "${settings.defaultTimezone}".`,
			);
		}
	}
}

export function internalValidateConfiguration(args: {
	events: typesAnalyticsEventConfigRuntime[];
	metrics: typesAnalyticsMetricConfigRuntime[];
	settings: typesAnalyticsSettings;
	funnels?: typesAnalyticsFunnelsConfig;
	journeys?: typesAnalyticsJourneysConfig;
}) {
	internalValidateConfigurationLimits(args);

	if (args.events.length === 0) {
		internalBadRequest("At least one analytics event must be configured.");
	}
	if (args.metrics.length === 0) {
		internalBadRequest("At least one analytics metric must be configured.");
	}

	const eventNames = new Set<string>();
	for (const event of args.events) {
		internalAssertNonEmptyString(event.name, "event.name");
		internalAssertNonEmptyString(event.label, `event "${event.name}".label`);

		if (eventNames.has(event.name)) {
			internalBadRequest(`Duplicate analytics event "${event.name}".`);
		}
		eventNames.add(event.name);

		for (const propertyName of Object.keys(event.properties ?? {})) {
			internalAssertNonEmptyString(propertyName, `event "${event.name}" property name`);
		}

		for (const requiredProperty of event.requiredProperties ?? []) {
			internalAssertNonEmptyString(
				requiredProperty,
				`event "${event.name}" required property`,
			);

			if (!event.properties?.[requiredProperty]) {
				internalBadRequest(
					`Required property "${requiredProperty}" is not registered on event "${event.name}".`,
				);
			}
		}
	}

	const metricNames = new Set<string>();
	for (const metric of args.metrics) {
		internalAssertNonEmptyString(metric.name, "metric.name");
		internalAssertNonEmptyString(metric.label, `metric "${metric.name}".label`);

		if (metricNames.has(metric.name)) {
			internalBadRequest(`Duplicate analytics metric "${metric.name}".`);
		}

		metricNames.add(metric.name);

		if (metric.eventNames.length === 0) {
			internalBadRequest(`Metric "${metric.name}" must include at least one event.`);
		}

		for (const eventName of metric.eventNames) {
			if (!eventNames.has(eventName)) {
				internalBadRequest(
					`Metric "${metric.name}" references unknown event "${eventName}".`,
				);
			}
		}

		if (
			metric.aggregation !== "count" &&
			metric.aggregation !== "distinctActors" &&
			!metric.valueProperty
		) {
			internalBadRequest(
				`${metric.aggregation} metric "${metric.name}" requires valueProperty.`,
			);
		}

		for (const dimension of metric.dimensions ?? []) {
			internalAssertNonEmptyString(dimension, `metric "${metric.name}" dimension`);
		}
	}

	for (const metric of args.metrics) {
		if (metric.evaluation) {
			internalValidateMetricEvaluationConfig({
				metric: metric.name,
				evaluation: metric.evaluation,
				metricNames,
			});
		}
	}

	internalValidateSettings(args.settings);
}

export function internalValidateMetricEvaluationConfig(args: {
	metric: string;
	evaluation: typesMetricEvaluationConfig;
	metricNames: Set<string>;
}) {
	const { metric, evaluation } = args;

	for (const [field, value] of Object.entries(evaluation)) {
		if (typeof value === "number" && !Number.isFinite(value)) {
			internalBadRequest(
				`Evaluation config for metric "${metric}": ${field} must be a finite number.`,
			);
		}
	}

	if (evaluation.kind === "conversion" || evaluation.kind === "inverseRate") {
		if (!args.metricNames.has(evaluation.denominatorMetric)) {
			internalBadRequest(
				`Evaluation config for metric "${metric}" references unknown denominator metric "${evaluation.denominatorMetric}".`,
			);
		}

		if (evaluation.denominatorMetric === metric) {
			internalBadRequest(
				`Evaluation config for metric "${metric}" cannot use itself as denominator.`,
			);
		}
	}

	if (evaluation.kind === "goal" && evaluation.targetValue < 0) {
		internalBadRequest(
			`Evaluation config for metric "${metric}": targetValue must not be negative.`,
		);
	}
}

export function internalSanitizeProperties(
	input: Record<string, typesAnalyticsPropertyValue> | undefined,
) {
	const properties: typesAnalyticsProperties = {};

	for (const [key, value] of Object.entries(input ?? {})) {
		if (
			value === null ||
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean"
		) {
			properties[key] = value;
		}
	}

	return properties;
}

export function internalValidateEventInput(
	config: typesAnalyticsConfigState,
	name: string,
	properties: typesAnalyticsProperties,
) {
	const eventConfig = config.eventByName.get(name);
	const errors: string[] = [];

	if (!eventConfig) {
		return [`Unknown analytics event "${name}".`];
	}

	const propertyTypes = eventConfig.properties ?? {};

	for (const key of eventConfig.requiredProperties ?? []) {
		if (properties[key] === undefined || properties[key] === null) {
			errors.push(
				`Missing required property "${key}" for analytics event "${name}".`,
			);
		}
	}

	for (const [key, value] of Object.entries(properties)) {
		const expectedType = propertyTypes[key];

		if (!expectedType) {
			errors.push(
				`Property "${key}" is not registered for analytics event "${name}".`,
			);
			continue;
		}

		if (value !== null && typeof value !== expectedType) {
			errors.push(
				`Property "${key}" for analytics event "${name}" must be ${expectedType}; received ${typeof value}.`,
			);
		}
	}

	return errors;
}

export function internalAssertDateRange(
	args: { from: number; to: number },
	settings: typesAnalyticsSettings,
) {
	const from = startOfUtcDay(args.from);
	const to = startOfUtcDay(args.to);

	if (from > to) {
		internalBadRequest("`from` must be before or equal to `to`.");
	}

	const rangeDays = Math.floor((to - from) / DAY_MS) + 1;

	if (rangeDays > settings.maxQueryRangeDays) {
		internalBadRequest(
			`Analytics queries are limited to ${settings.maxQueryRangeDays} days. Narrow the date range.`,
		);
	}
}

export function internalAssertAllowedDimension(
	metric: typesAnalyticsMetricConfigRuntime,
	groupBy: string,
) {
	if (!metric.dimensions?.includes(groupBy)) {
		internalBadRequest(`Metric "${metric.name}" cannot be grouped by "${groupBy}".`);
	}
}
