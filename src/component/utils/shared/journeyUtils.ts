// UTILS
import { internalBadRequest } from "../../errors/errors";

// TYPES
import type {
	typesAnalyticsConfigState,
} from "../../../shared/types/componentInternal.js";
import type {
	typesAnalyticsJourneyConfig,
} from "../../../shared/types/config.js";

export function internalGetJourneyConfigOrThrow(
	config: typesAnalyticsConfigState,
	journey: string,
): typesAnalyticsJourneyConfig {
	const journeyConfig = config.journeyByName.get(journey);
	if (!journeyConfig) {
		internalBadRequest(`Unknown analytics journey "${journey}".`);
	}

	return journeyConfig;
}
