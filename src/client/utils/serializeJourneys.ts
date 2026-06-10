// TYPES
import type {
	typesAnalyticsJourneysConfig,
} from "../../shared/types/config.js";

export function internalSerializeJourneys(
	journeys?: typesAnalyticsJourneysConfig,
) {
	if (!journeys) return undefined;

	return Object.fromEntries(
		Object.entries(journeys).map(([name, journey]) => [
			name,
			{
				label: journey.label,
				steps: [...journey.steps],
				...(journey.breakdownProperty
					? { breakdownProperty: journey.breakdownProperty }
					: {}),
			},
		]),
	);
}
