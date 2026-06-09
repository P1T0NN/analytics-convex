// UTILS
import { badRequest } from "../../errors/errors";

// TYPES
import type {
	typesAnalyticsConfigState,
	typesAnalyticsFunnelConfig,
} from "../../types/types.js";

export function getFunnelConfigOrThrow(
	config: typesAnalyticsConfigState,
	funnel: string,
): typesAnalyticsFunnelConfig {
	const funnelConfig = config.funnelByName.get(funnel);
	if (!funnelConfig) {
		badRequest(`Unknown analytics funnel "${funnel}".`);
	}

	return funnelConfig;
}
