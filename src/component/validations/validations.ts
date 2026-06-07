// CONSTANTS
import { ANALYTICS_LIMITS } from "../../shared/analyticsLimits.js";
import { DAY_MS } from "../constants.js";

// UTILS
import { startOfUtcDay } from "../utils/common/dateUtils.js";
import { badRequest } from "../errors/errors.js";

// VALIDATIONS
import { validateConfigurationLimits } from "./configurationLimits.js";
import { assertNumberAtMost } from "./limitUtils.js";

// TYPES
import type {
	typesAnalyticsConfigState,
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsProperties,
	typesAnalyticsPropertyValue,
	typesAnalyticsSettings,
} from "../types/types.js";

export function assertNonEmptyString(value: string, field: string) {
	if (value.trim().length === 0) {
		badRequest(`${field} must not be empty.`);
	}
}

export function assertPositiveInteger(
	value: number,
	field: keyof typesAnalyticsSettings,
) {
	if (!Number.isInteger(value) || value <= 0) {
		badRequest(`settings.${field} must be a positive integer.`);
	}
}

export function assertNonNegativeInteger(
	value: number,
	field: keyof typesAnalyticsSettings,
) {
	if (!Number.isInteger(value) || value < 0) {
		badRequest(`settings.${field} must be a non-negative integer.`);
	}
}

export function validateSettings(settings: typesAnalyticsSettings) {
	assertPositiveInteger(
		settings.mediumVolumeShardCount,
		"mediumVolumeShardCount",
	);
	assertPositiveInteger(settings.highVolumeShardCount, "highVolumeShardCount");
	assertPositiveInteger(settings.highVolumeBatchSize, "highVolumeBatchSize");
	assertPositiveInteger(
		settings.highVolumeBatchIntervalMinutes,
		"highVolumeBatchIntervalMinutes",
	);
	assertNonNegativeInteger(
		settings.highVolumeMaxCatchupBatches,
		"highVolumeMaxCatchupBatches",
	);
	assertPositiveInteger(settings.maxQueryRangeDays, "maxQueryRangeDays");
	assertPositiveInteger(
		settings.maxRollupRowsPerQuery,
		"maxRollupRowsPerQuery",
	);
	assertPositiveInteger(settings.maxBreakdownItems, "maxBreakdownItems");
	assertNonNegativeInteger(
		settings.rawEventRetentionDays,
		"rawEventRetentionDays",
	);
	assertPositiveInteger(
		settings.maxRawEventDeletesPerRun,
		"maxRawEventDeletesPerRun",
	);

	assertNumberAtMost(
		settings.mediumVolumeShardCount,
		ANALYTICS_LIMITS.maxMediumVolumeShardCount,
		"settings.mediumVolumeShardCount",
	);
	assertNumberAtMost(
		settings.highVolumeShardCount,
		ANALYTICS_LIMITS.maxHighVolumeShardCount,
		"settings.highVolumeShardCount",
	);
	assertNumberAtMost(
		settings.highVolumeBatchSize,
		ANALYTICS_LIMITS.maxHighVolumeBatchSize,
		"settings.highVolumeBatchSize",
	);
	assertNumberAtMost(
		settings.highVolumeMaxCatchupBatches,
		ANALYTICS_LIMITS.maxHighVolumeMaxCatchupBatches,
		"settings.highVolumeMaxCatchupBatches",
	);
	assertNumberAtMost(
		settings.maxQueryRangeDays,
		ANALYTICS_LIMITS.maxQueryRangeDays,
		"settings.maxQueryRangeDays",
	);
	assertNumberAtMost(
		settings.maxRollupRowsPerQuery,
		ANALYTICS_LIMITS.maxRollupRowsPerQuery,
		"settings.maxRollupRowsPerQuery",
	);
	assertNumberAtMost(
		settings.maxBreakdownItems,
		ANALYTICS_LIMITS.maxBreakdownItems,
		"settings.maxBreakdownItems",
	);
	assertNumberAtMost(
		settings.rawEventRetentionDays,
		ANALYTICS_LIMITS.maxRawEventRetentionDays,
		"settings.rawEventRetentionDays",
	);
	assertNumberAtMost(
		settings.maxRawEventDeletesPerRun,
		ANALYTICS_LIMITS.maxRawEventDeletesPerRun,
		"settings.maxRawEventDeletesPerRun",
	);
}

export function validateConfiguration(args: {
	events: typesAnalyticsEventConfig[];
	metrics: typesAnalyticsMetricConfig[];
	settings: typesAnalyticsSettings;
}) {
	validateConfigurationLimits(args);

	if (args.events.length === 0) {
		badRequest("At least one analytics event must be configured.");
	}
	if (args.metrics.length === 0) {
		badRequest("At least one analytics metric must be configured.");
	}

	const eventNames = new Set<string>();
	for (const event of args.events) {
		assertNonEmptyString(event.name, "event.name");
		assertNonEmptyString(event.label, `event "${event.name}".label`);

		if (eventNames.has(event.name)) {
			badRequest(`Duplicate analytics event "${event.name}".`);
		}
		eventNames.add(event.name);

		for (const propertyName of Object.keys(event.properties ?? {})) {
			assertNonEmptyString(propertyName, `event "${event.name}" property name`);
		}

		for (const requiredProperty of event.requiredProperties ?? []) {
			assertNonEmptyString(
				requiredProperty,
				`event "${event.name}" required property`,
			);

			if (!event.properties?.[requiredProperty]) {
				badRequest(
					`Required property "${requiredProperty}" is not registered on event "${event.name}".`,
				);
			}
		}
	}

	const metricNames = new Set<string>();
	for (const metric of args.metrics) {
		assertNonEmptyString(metric.name, "metric.name");
		assertNonEmptyString(metric.label, `metric "${metric.name}".label`);

		if (metricNames.has(metric.name)) {
			badRequest(`Duplicate analytics metric "${metric.name}".`);
		}

		metricNames.add(metric.name);

		if (metric.eventNames.length === 0) {
			badRequest(`Metric "${metric.name}" must include at least one event.`);
		}

		for (const eventName of metric.eventNames) {
			if (!eventNames.has(eventName)) {
				badRequest(
					`Metric "${metric.name}" references unknown event "${eventName}".`,
				);
			}
		}

		if (metric.aggregation === "sum" && !metric.valueProperty) {
			badRequest(`Sum metric "${metric.name}" requires valueProperty.`);
		}

		for (const dimension of metric.dimensions ?? []) {
			assertNonEmptyString(dimension, `metric "${metric.name}" dimension`);
		}
	}

	validateSettings(args.settings);
}

export function sanitizeProperties(
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

export function validateEventInput(
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

export function assertDateRange(
	args: { from: number; to: number },
	settings: typesAnalyticsSettings,
) {
	const from = startOfUtcDay(args.from);
	const to = startOfUtcDay(args.to);

	if (from > to) {
		badRequest("`from` must be before or equal to `to`.");
	}

	const rangeDays = Math.floor((to - from) / DAY_MS) + 1;

	if (rangeDays > settings.maxQueryRangeDays) {
		badRequest(
			`Analytics queries are limited to ${settings.maxQueryRangeDays} days. Narrow the date range.`,
		);
	}
}

export function assertAllowedDimension(
	metric: typesAnalyticsMetricConfig,
	groupBy: string,
) {
	if (!metric.dimensions?.includes(groupBy)) {
		badRequest(`Metric "${metric.name}" cannot be grouped by "${groupBy}".`);
	}
}
