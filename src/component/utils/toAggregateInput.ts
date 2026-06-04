// TYPES
import type { Doc } from "../_generated/dataModel";
import type { typesAnalyticsAggregateEventInput, typesAnalyticsProperties } from "../types/types.js";

export function toAggregateInput(
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
