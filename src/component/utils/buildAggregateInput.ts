// TYPES
import type { Id } from "../_generated/dataModel";
import type {
	typesAnalyticsAggregateEventInput,
	typesAnalyticsMetricScope,
	typesAnalyticsProperties,
	typesPreparedTrackEventInput,
} from "../types/types";

export function buildAggregateInput(
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
