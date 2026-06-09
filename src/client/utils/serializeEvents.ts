// TYPES
import type { typesAnalyticsEventConfig } from "../../shared/types/index.js";

export function internalSerializeEvents(events: readonly typesAnalyticsEventConfig[]) {
	return events.map((event) => ({
		name: event.name,
		label: event.label,
		...(event.properties ? { properties: event.properties } : {}),
		...(event.requiredProperties
			? { requiredProperties: [...event.requiredProperties] }
			: {}),
	}));
}
