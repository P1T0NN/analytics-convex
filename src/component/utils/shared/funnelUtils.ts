// UTILS
import { internalBadRequest } from "../../errors/errors";

// TYPES
import type {
	typesAnalyticsConfigState,
	typesAnalyticsFunnelConfig,
} from "../../../shared/types/index.js";

export function internalGetFunnelConfigOrThrow(
	config: typesAnalyticsConfigState,
	funnel: string,
): typesAnalyticsFunnelConfig {
	const funnelConfig = config.funnelByName.get(funnel);
	if (!funnelConfig) {
		internalBadRequest(`Unknown analytics funnel "${funnel}".`);
	}

	return funnelConfig;
}
