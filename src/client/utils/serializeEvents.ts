// TYPES
import type { typesAnalyticsEventConfig } from "../types/types";

export function serializeEvents(events: readonly typesAnalyticsEventConfig[]) {
	return events.map((event) => ({
		name: event.name,
		label: event.label,
		...(event.properties ? { properties: event.properties } : {}),
		...(event.requiredProperties
			? { requiredProperties: [...event.requiredProperties] }
			: {}),
	}));
}
