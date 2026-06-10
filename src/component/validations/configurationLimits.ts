// LIMITS
import { ANALYTICS_LIMITS } from "../../shared/constants.js";

// VALIDATIONS
import { internalAssertAtMost, internalAssertStringLength } from "./limitUtils.js";

// UTILS
import { internalBadRequest } from "../errors/errors.js";
import { internalIsBlockedDimensionName } from "../../shared/utils/dimensionGuardUtils.js";

// TYPES
import type {
	typesAnalyticsEventConfigRuntime,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsJourneysConfig,
	typesAnalyticsMetricConfigRuntime,
} from "../../shared/types/config.js";
import type {
	typesAnalyticsPropertyType,
} from "../../shared/types/primitives.js";

function assertPropertyConfigLimits(
	event: typesAnalyticsEventConfigRuntime,
	properties: Record<string, typesAnalyticsPropertyType>,
) {
	const propertyNames = Object.keys(properties);
	internalAssertAtMost(
		propertyNames.length,
		ANALYTICS_LIMITS.maxPropertiesPerEventConfig,
		`event "${event.name}".properties`,
	);

	for (const propertyName of propertyNames) {
		internalAssertStringLength(
			propertyName,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`event "${event.name}" property "${propertyName}"`,
		);
	}
}

function assertMetricPropertyReferences(
	metric: typesAnalyticsMetricConfigRuntime,
	eventByName: Map<string, typesAnalyticsEventConfigRuntime>,
) {
	const events = metric.eventNames
		.map((eventName) => eventByName.get(eventName))
		.filter((event): event is typesAnalyticsEventConfigRuntime => Boolean(event));

	for (const eventName of metric.eventNames) {
		const event = eventByName.get(eventName);
		if (!event) continue;

		if (metric.valueProperty) {
			const valueType = event.properties?.[metric.valueProperty];
			if (valueType !== "number") {
				internalBadRequest(
					`Metric "${metric.name}" valueProperty "${metric.valueProperty}" must be a registered number property on event "${eventName}".`,
				);
			}
		}

		if (metric.actorProperty) {
			const actorType = event.properties?.[metric.actorProperty];
			if (actorType !== "string") {
				internalBadRequest(
					`Metric "${metric.name}" actorProperty "${metric.actorProperty}" must be a registered string property on event "${eventName}".`,
				);
			}
		}
	}

	for (const dimension of metric.dimensions ?? []) {
		const isRegisteredForAnyEvent = events.some(
			(event) => event.properties?.[dimension],
		);

		if (!isRegisteredForAnyEvent) {
			internalBadRequest(
				`Metric "${metric.name}" dimension "${dimension}" must be registered on at least one event feeding the metric.`,
			);
		}

		if (internalIsBlockedDimensionName(dimension)) {
			internalBadRequest(
				`Metric "${metric.name}" dimension "${dimension}" is blocked because it is high-cardinality. ` +
					"Use categorical dimensions (plan, feature, path), not user or session identifiers.",
			);
		}
	}
}

export function internalValidateConfigurationLimits(args: {
	events: typesAnalyticsEventConfigRuntime[];
	metrics: typesAnalyticsMetricConfigRuntime[];
	funnels?: typesAnalyticsFunnelsConfig;
	journeys?: typesAnalyticsJourneysConfig;
}) {
	internalAssertAtMost(
		args.events.length,
		ANALYTICS_LIMITS.maxEventsPerConfiguration,
		"events",
	);
	internalAssertAtMost(
		args.metrics.length,
		ANALYTICS_LIMITS.maxMetricsPerConfiguration,
		"metrics",
	);

	const eventByName = new Map(args.events.map((event) => [event.name, event]));
	const metricNames = new Set(args.metrics.map((metric) => metric.name));

	validateFunnelLimits(args.funnels ?? {}, metricNames);
	validateJourneyLimits(args.journeys ?? {}, eventByName);

	for (const event of args.events) {
		internalAssertStringLength(
			event.name,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`event "${event.name}".name`,
		);
		internalAssertStringLength(
			event.label,
			ANALYTICS_LIMITS.maxLabelLength,
			`event "${event.name}".label`,
		);
		assertPropertyConfigLimits(event, event.properties ?? {});
		internalAssertAtMost(
			event.requiredProperties?.length ?? 0,
			ANALYTICS_LIMITS.maxRequiredPropertiesPerEvent,
			`event "${event.name}".requiredProperties`,
		);
	}

	for (const metric of args.metrics) {
		internalAssertStringLength(
			metric.name,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`metric "${metric.name}".name`,
		);
		internalAssertStringLength(
			metric.label,
			ANALYTICS_LIMITS.maxLabelLength,
			`metric "${metric.name}".label`,
		);
		if (metric.description) {
			internalAssertStringLength(
				metric.description,
				ANALYTICS_LIMITS.maxDescriptionLength,
				`metric "${metric.name}".description`,
			);
		}
		internalAssertAtMost(
			metric.eventNames.length,
			ANALYTICS_LIMITS.maxEventNamesPerMetric,
			`metric "${metric.name}".eventNames`,
		);
		internalAssertAtMost(
			metric.dimensions?.length ?? 0,
			ANALYTICS_LIMITS.maxDimensionsPerMetric,
			`metric "${metric.name}".dimensions`,
		);
		assertMetricPropertyReferences(metric, eventByName);
		assertMetricEvaluationReferences(metric, args.metrics);

		if (
			metric.aggregation === "distinctActors" &&
			metric.trafficMode &&
			metric.trafficMode !== "lowVolume"
		) {
			internalBadRequest(
				`Metric "${metric.name}" uses distinctActors aggregation and must stay on lowVolume traffic mode.`,
			);
		}

		if (metric.rollupGranularity === "hour") {
			if (metric.aggregation === "distinctActors") {
				internalBadRequest(
					`Metric "${metric.name}" cannot combine hourly rollups with distinctActors aggregation.`,
				);
			}

			if (metric.trafficMode && metric.trafficMode !== "lowVolume") {
				internalBadRequest(
					`Metric "${metric.name}" uses hourly rollups and must stay on lowVolume traffic mode.`,
				);
			}
		}
	}
}

function validateJourneyLimits(
	journeys: typesAnalyticsJourneysConfig,
	eventByName: Map<string, typesAnalyticsEventConfigRuntime>,
) {
	const journeyNames = Object.keys(journeys);
	internalAssertAtMost(
		journeyNames.length,
		ANALYTICS_LIMITS.maxJourneysPerConfiguration,
		"journeys",
	);

	for (const journeyName of journeyNames) {
		internalAssertStringLength(
			journeyName,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`journey "${journeyName}".name`,
		);

		const journey = journeys[journeyName];
		internalAssertStringLength(
			journey.label,
			ANALYTICS_LIMITS.maxLabelLength,
			`journey "${journeyName}".label`,
		);
		internalAssertAtMost(
			journey.steps.length,
			ANALYTICS_LIMITS.maxJourneySteps,
			`journey "${journeyName}".steps`,
		);

		if (journey.steps.length < 2) {
			internalBadRequest(
				`Journey "${journeyName}" must include at least two event steps.`,
			);
		}

		if (journey.breakdownProperty) {
			internalAssertStringLength(
				journey.breakdownProperty,
				ANALYTICS_LIMITS.maxIdentifierLength,
				`journey "${journeyName}".breakdownProperty`,
			);

			const firstStepEvent = eventByName.get(journey.steps[0]!);
			if (!firstStepEvent?.properties?.[journey.breakdownProperty]) {
				internalBadRequest(
					`Journey "${journeyName}" breakdownProperty "${journey.breakdownProperty}" must be registered on first-step event "${journey.steps[0]}".`,
				);
			}

			if (internalIsBlockedDimensionName(journey.breakdownProperty)) {
				internalBadRequest(
					`Journey "${journeyName}" breakdownProperty "${journey.breakdownProperty}" is blocked because it is high-cardinality. ` +
						"Use categorical properties (plan, feature, region), not user or session identifiers.",
				);
			}
		}

		const stepNames = new Set<string>();
		for (const step of journey.steps) {
			internalAssertStringLength(
				step,
				ANALYTICS_LIMITS.maxIdentifierLength,
				`journey "${journeyName}" step "${step}"`,
			);

			if (!eventByName.has(step)) {
				internalBadRequest(
					`Journey "${journeyName}" step "${step}" references unknown event "${step}".`,
				);
			}

			if (stepNames.has(step)) {
				internalBadRequest(
					`Journey "${journeyName}" step "${step}" is duplicated.`,
				);
			}

			stepNames.add(step);
		}
	}
}

function validateFunnelLimits(
	funnels: typesAnalyticsFunnelsConfig,
	metricNames: Set<string>,
) {
	const funnelNames = Object.keys(funnels);
	internalAssertAtMost(
		funnelNames.length,
		ANALYTICS_LIMITS.maxFunnelsPerConfiguration,
		"funnels",
	);

	for (const funnelName of funnelNames) {
		internalAssertStringLength(
			funnelName,
			ANALYTICS_LIMITS.maxIdentifierLength,
			`funnel "${funnelName}".name`,
		);

		const funnel = funnels[funnelName];
		internalAssertStringLength(
			funnel.label,
			ANALYTICS_LIMITS.maxLabelLength,
			`funnel "${funnelName}".label`,
		);
		internalAssertAtMost(
			funnel.steps.length,
			ANALYTICS_LIMITS.maxFunnelSteps,
			`funnel "${funnelName}".steps`,
		);

		if (funnel.steps.length < 2) {
			internalBadRequest(
				`Funnel "${funnelName}" must include at least two metric steps.`,
			);
		}

		const stepNames = new Set<string>();
		for (const step of funnel.steps) {
			internalAssertStringLength(
				step,
				ANALYTICS_LIMITS.maxIdentifierLength,
				`funnel "${funnelName}" step "${step}"`,
			);

			if (!metricNames.has(step)) {
				internalBadRequest(
					`Funnel "${funnelName}" step "${step}" references unknown metric "${step}".`,
				);
			}

			if (stepNames.has(step)) {
				internalBadRequest(
					`Funnel "${funnelName}" step "${step}" is duplicated.`,
				);
			}

			stepNames.add(step);
		}
	}
}

function assertMetricEvaluationReferences(
	metric: typesAnalyticsMetricConfigRuntime,
	metrics: typesAnalyticsMetricConfigRuntime[],
) {
	const evaluation = metric.evaluation;
	if (!evaluation) return;

	const metricNames = new Set(metrics.map((entry) => entry.name));

	if (
		evaluation.kind === "conversion" ||
		evaluation.kind === "inverseRate"
	) {
		if (!metricNames.has(evaluation.denominatorMetric)) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation references unknown denominator metric "${evaluation.denominatorMetric}".`,
			);
		}

		if (evaluation.denominatorMetric === metric.name) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation denominatorMetric must reference a different metric.`,
			);
		}
	}

	if (evaluation.kind === "comparison") {
		if (evaluation.excellentGrowthPercent < evaluation.goodGrowthPercent) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation excellentGrowthPercent must be >= goodGrowthPercent.`,
			);
		}

		if (evaluation.goodGrowthPercent < evaluation.badGrowthPercent) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation goodGrowthPercent must be >= badGrowthPercent.`,
			);
		}
	}

	if (evaluation.kind === "conversion") {
		if (evaluation.excellentRatePercent < evaluation.goodRatePercent) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation excellentRatePercent must be >= goodRatePercent.`,
			);
		}

		if (evaluation.goodRatePercent < evaluation.badRatePercent) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation goodRatePercent must be >= badRatePercent.`,
			);
		}
	}

	if (evaluation.kind === "inverseRate") {
		if (evaluation.goodRatePercent > evaluation.badRatePercent) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation goodRatePercent must be <= badRatePercent for inverseRate.`,
			);
		}
	}

	if (evaluation.kind === "goal") {
		if (evaluation.targetValue <= 0) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation targetValue must be > 0.`,
			);
		}

		if (evaluation.excellentPercentOfGoal < 0) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation excellentPercentOfGoal must be >= 0.`,
			);
		}

		if (evaluation.goodPercentOfGoal < 0) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation goodPercentOfGoal must be >= 0.`,
			);
		}

		if (evaluation.badPercentOfGoal < 0) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation badPercentOfGoal must be >= 0.`,
			);
		}

		if (evaluation.excellentPercentOfGoal < evaluation.goodPercentOfGoal) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation excellentPercentOfGoal must be >= goodPercentOfGoal.`,
			);
		}

		if (evaluation.goodPercentOfGoal < evaluation.badPercentOfGoal) {
			internalBadRequest(
				`Metric "${metric.name}" evaluation goodPercentOfGoal must be >= badPercentOfGoal.`,
			);
		}
	}
}
