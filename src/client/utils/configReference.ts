// TYPES
import type {
	typesAnalyticsRuntimeConfig,
} from "../../shared/types/config.js";

export function internalAnalyticsConfigReference(
	config: typesAnalyticsRuntimeConfig,
) {
	if (!config.configHash) {
		throw new Error("Analytics configuration is missing configHash.");
	}

	return {
		configHash: config.configHash,
		config,
	};
}

export function internalAnalyticsConfigHashReference(
	config: typesAnalyticsRuntimeConfig,
) {
	if (!config.configHash) {
		throw new Error("Analytics configuration is missing configHash.");
	}

	return {
		configHash: config.configHash,
	};
}
