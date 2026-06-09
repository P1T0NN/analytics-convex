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
	typesAnalyticsFunnelsConfig,
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
	funnels?: typesAnalyticsFunnelsConfig;
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
	const metricNames = new Set(args.metrics.map((metric) => metric.name));

	validateFunnelLimits(args.funnels ?? {}, metricNames);

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
		assertMetricEvaluationReferences(metric, args.metrics);
	}
}

function validateFunnelLimits(
	funnels: typesAnalyticsFunnelsConfig,
	metricNames: Set<string>,
) {
	const funnelNames = Object.keys(funnels);
	assertAtMost(
		funnelNames.length,
		ANALYTICS_LIMITS.maxFunnelsPerConfiguration,
		"funnels",
	);

	for (const funnelName of funnelNames) {
		assertStringLength(
			funnelName,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`funnel "${funnelName}".name`,
		);

		const funnel = funnels[funnelName];
		assertStringLength(
			funnel.label,
			ANALYTICS_LIMITS.maxLabelLength,
			`funnel "${funnelName}".label`,
		);
		assertAtMost(
			funnel.steps.length,
			ANALYTICS_LIMITS.maxFunnelSteps,
			`funnel "${funnelName}".steps`,
		);

		if (funnel.steps.length < 2) {
			badRequest(
				`Funnel "${funnelName}" must include at least two metric steps.`,
			);
		}

		const stepNames = new Set<string>();
		for (const step of funnel.steps) {
			assertStringLength(
				step,
				ANALYTICS_LIMITS.maxIdentifierLength,
				`funnel "${funnelName}" step "${step}"`,
			);

			if (!metricNames.has(step)) {
				badRequest(
					`Funnel "${funnelName}" step "${step}" references unknown metric "${step}".`,
				);
			}

			if (stepNames.has(step)) {
				badRequest(
					`Funnel "${funnelName}" step "${step}" is duplicated.`,
				);
			}

			stepNames.add(step);
		}
	}
}

function assertMetricEvaluationReferences(
	metric: typesAnalyticsMetricConfig,
	metrics: typesAnalyticsMetricConfig[],
) {
	const evaluation = metric.evaluation;
	if (!evaluation) return;

	const metricNames = new Set(metrics.map((entry) => entry.name));

	if (
		evaluation.kind === "conversion" ||
		evaluation.kind === "inverseRate"
	) {
		if (!metricNames.has(evaluation.denominatorMetric)) {
			badRequest(
				`Metric "${metric.name}" evaluation references unknown denominator metric "${evaluation.denominatorMetric}".`,
			);
		}

		if (evaluation.denominatorMetric === metric.name) {
			badRequest(
				`Metric "${metric.name}" evaluation denominatorMetric must reference a different metric.`,
			);
		}
	}

	if (evaluation.kind === "comparison") {
		if (evaluation.excellentGrowthPercent < evaluation.goodGrowthPercent) {
			badRequest(
				`Metric "${metric.name}" evaluation excellentGrowthPercent must be >= goodGrowthPercent.`,
			);
		}

		if (evaluation.goodGrowthPercent < evaluation.badGrowthPercent) {
			badRequest(
				`Metric "${metric.name}" evaluation goodGrowthPercent must be >= badGrowthPercent.`,
			);
		}
	}

	if (evaluation.kind === "conversion") {
		if (evaluation.excellentRatePercent < evaluation.goodRatePercent) {
			badRequest(
				`Metric "${metric.name}" evaluation excellentRatePercent must be >= goodRatePercent.`,
			);
		}

		if (evaluation.goodRatePercent < evaluation.badRatePercent) {
			badRequest(
				`Metric "${metric.name}" evaluation goodRatePercent must be >= badRatePercent.`,
			);
		}
	}

	if (evaluation.kind === "inverseRate") {
		if (evaluation.goodRatePercent > evaluation.badRatePercent) {
			badRequest(
				`Metric "${metric.name}" evaluation goodRatePercent must be <= badRatePercent for inverseRate.`,
			);
		}
	}
}
