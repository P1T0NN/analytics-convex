// TYPES
import type {
	typesAnalyticsMetricScope,
	typesHighVolumeStatus,
	typesPreparedTrackEventInput,
} from "../types/types";

export function buildAnalyticsEventInsert(
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
