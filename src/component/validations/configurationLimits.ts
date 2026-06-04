// LIMITS
import { ANALYTICS_LIMITS } from "../../shared/analyticsLimits.js";

// VALIDATIONS
import { assertAtMost, assertStringLength } from "./limitUtils.js";

// UTILS
import { badRequest } from "../errors/errors.js";

// TYPES
import type {
	typesAnalyticsEventConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsPropertyType,
} from "../types/types.js";

function assertPropertyConfigLimits(
	event: typesAnalyticsEventConfig,
	properties: Record<string, typesAnalyticsPropertyType>,
) {
	const propertyNames = Object.keys(properties);
	assertAtMost(
		propertyNames.length,
		ANALYTICS_LIMITS.maxPropertiesPerEventConfig,
		`event "${event.name}".properties`,
	);

	for (const propertyName of propertyNames) {
		assertStringLength(
			propertyName,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`event "${event.name}" property "${propertyName}"`,
		);
	}
}

function assertMetricPropertyReferences(
	metric: typesAnalyticsMetricConfig,
	eventByName: Map<string, typesAnalyticsEventConfig>,
) {
	const events = metric.eventNames
		.map((eventName) => eventByName.get(eventName))
		.filter((event): event is typesAnalyticsEventConfig => Boolean(event));

	for (const eventName of metric.eventNames) {
		const event = eventByName.get(eventName);
		if (!event) continue;

		if (metric.valueProperty) {
			const valueType = event.properties?.[metric.valueProperty];
			if (valueType !== "number") {
				badRequest(
					`Metric "${metric.name}" valueProperty "${metric.valueProperty}" must be a registered number property on event "${eventName}".`,
				);
			}
		}
	}

	for (const dimension of metric.dimensions ?? []) {
		const isRegisteredForAnyEvent = events.some(
			(event) => event.properties?.[dimension],
		);

		if (!isRegisteredForAnyEvent) {
			badRequest(
				`Metric "${metric.name}" dimension "${dimension}" must be registered on at least one event feeding the metric.`,
			);
		}
	}
}

export function validateConfigurationLimits(args: {
	events: typesAnalyticsEventConfig[];
	metrics: typesAnalyticsMetricConfig[];
}) {
	assertAtMost(
		args.events.length,
		ANALYTICS_LIMITS.maxEventsPerConfiguration,
		"events",
	);
	assertAtMost(
		args.metrics.length,
		ANALYTICS_LIMITS.maxMetricsPerConfiguration,
		"metrics",
	);

	const eventByName = new Map(args.events.map((event) => [event.name, event]));

	for (const event of args.events) {
		assertStringLength(
			event.name,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`event "${event.name}".name`,
		);
		assertStringLength(
			event.label,
			ANALYTICS_LIMITS.maxLabelLength,
			`event "${event.name}".label`,
		);
		assertPropertyConfigLimits(event, event.properties ?? {});
		assertAtMost(
			event.requiredProperties?.length ?? 0,
			ANALYTICS_LIMITS.maxRequiredPropertiesPerEvent,
			`event "${event.name}".requiredProperties`,
		);
	}

	for (const metric of args.metrics) {
		assertStringLength(
			metric.name,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`metric "${metric.name}".name`,
		);
		assertStringLength(
			metric.label,
			ANALYTICS_LIMITS.maxLabelLength,
			`metric "${metric.name}".label`,
		);
		if (metric.description) {
			assertStringLength(
				metric.description,
				ANALYTICS_LIMITS.maxDescriptionLength,
				`metric "${metric.name}".description`,
			);
		}
		assertAtMost(
			metric.eventNames.length,
			ANALYTICS_LIMITS.maxEventNamesPerMetric,
			`metric "${metric.name}".eventNames`,
		);
		assertAtMost(
			metric.dimensions?.length ?? 0,
			ANALYTICS_LIMITS.maxDimensionsPerMetric,
			`metric "${metric.name}".dimensions`,
		);
		assertMetricPropertyReferences(metric, eventByName);
	}
}
