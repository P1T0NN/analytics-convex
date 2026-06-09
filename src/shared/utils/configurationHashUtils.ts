// TYPES
import type {
	typesAnalyticsEventConfigRuntime,
	typesAnalyticsMetricConfigRuntime,
	typesAnalyticsSettings,
	typesAnalyticsFunnelsConfig,
} from "../types/index.js";

type typesConfigurationHashInput = {
	events: typesAnalyticsEventConfigRuntime[];
	metrics: typesAnalyticsMetricConfigRuntime[];
	funnels: typesAnalyticsFunnelsConfig;
	settings: typesAnalyticsSettings;
};

function internalHashString(value: string) {
	let hash = 0;

	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}

	return hash;
}

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
