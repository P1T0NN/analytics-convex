// UTILS
import { internalHashString } from "./hashString.js";

// TYPES
import type {
	typesAnalyticsEventConfigRuntime,
	typesAnalyticsMetricConfigRuntime,
	typesAnalyticsSettings,
	typesAnalyticsFunnelsConfig,
} from "../../shared/types/index.js";

type typesConfigurationHashInput = {
	events: typesAnalyticsEventConfigRuntime[];
	metrics: typesAnalyticsMetricConfigRuntime[];
	funnels: typesAnalyticsFunnelsConfig;
	settings: typesAnalyticsSettings;
};

function normalizeForHash(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => normalizeForHash(item));
	}

	if (value !== null && typeof value === "object") {
		const input = value as Record<string, unknown>;
		const output: Record<string, unknown> = {};

		for (const key of Object.keys(input).sort()) {
			const normalized = normalizeForHash(input[key]);
			if (normalized !== undefined) {
				output[key] = normalized;
			}
		}

		return output;
	}

	return value;
}

export function internalSerializeConfigurationForHash(
	input: typesConfigurationHashInput,
) {
	return JSON.stringify(normalizeForHash(input));
}

export function internalCreateConfigurationHash(input: typesConfigurationHashInput) {
	const serialized = internalSerializeConfigurationForHash(input);
	return `v1:${serialized.length}:${internalHashString(serialized).toString(36)}`;
}
