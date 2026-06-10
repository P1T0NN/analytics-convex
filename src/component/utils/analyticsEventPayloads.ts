// TYPES
import type { Doc, Id } from "../_generated/dataModel";
import type {
	typesAnalyticsAggregateEventInput,
} from "../../shared/types/componentInternal.js";
import type {
	typesAnalyticsMetricScope,
} from "../../shared/types/scopes.js";
import type {
	typesAnalyticsProperties,
	typesHighVolumeStatus,
} from "../../shared/types/primitives.js";
import type {
	typesPreparedTrackEventInput,
} from "../../shared/types/tracking.js";

export function internalBuildAnalyticsEventInsert(
	event: typesPreparedTrackEventInput,
	highVolumeStatus: typesHighVolumeStatus,
) {
	return {
		name: event.name,
		occurredAt: event.occurredAt,
		actorId: event.actorId,
		organizationId: event.organizationId,
		subject: event.subject,
		scopes: event.scopes as typesAnalyticsMetricScope[] | undefined,
		properties: event.properties,
		source: event.source,
		idempotencyKey: event.idempotencyKey,
		highVolumeStatus,
	};
}

export function internalBuildAggregateInput(
	eventId: Id<"analyticsEvents">,
	event: typesPreparedTrackEventInput,
): typesAnalyticsAggregateEventInput {
	return {
		eventId,
		name: event.name,
		occurredAt: event.occurredAt,
		actorId: event.actorId,
		organizationId: event.organizationId,
		subject: event.subject,
		scopes: event.scopes as typesAnalyticsMetricScope[] | undefined,
		properties: event.properties as typesAnalyticsProperties,
	};
}

export function internalToAggregateInput(
	event: Doc<"analyticsEvents">,
): typesAnalyticsAggregateEventInput {
	return {
		eventId: event._id,
		name: event.name,
		occurredAt: event.occurredAt,
		...(event.actorId ? { actorId: event.actorId } : {}),
		...(event.organizationId ? { organizationId: event.organizationId } : {}),
		...(event.subject ? { subject: event.subject } : {}),
		...(event.scopes ? { scopes: event.scopes } : {}),
		properties: (event.properties ?? {}) as typesAnalyticsProperties,
	};
}
