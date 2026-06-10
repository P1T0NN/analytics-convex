// TYPES
import type {
	typesAnalyticsEventConfigRuntime,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsJourneysConfig,
	typesAnalyticsMetricConfigRuntime,
} from "../types/config.js";
import type {
	typesAnalyticsSettings,
} from "../types/settings.js";

type typesConfigurationHashInput = {
	events: typesAnalyticsEventConfigRuntime[];
	metrics: typesAnalyticsMetricConfigRuntime[];
	funnels: typesAnalyticsFunnelsConfig;
	journeys: typesAnalyticsJourneysConfig;
	settings: typesAnalyticsSettings;
};

function internalHashMul31(value: string) {
	let hash = 0;

	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}

	return hash;
}

function internalHashFnv1a(value: string) {
	let hash = 0x811c9dc5;

	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 0x01000193) >>> 0;
	}

	return hash >>> 0;
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

/**
 * Deterministic identity hash for a serialized configuration.
 *
 * Combines two independent 32-bit hashes plus the serialized length, so a
 * silent collision (which would make two different configs share stored
 * state) requires all three to match — practically impossible for the
 * small set of configs a deployment ever registers.
 */
export function internalCreateConfigurationHash(input: typesConfigurationHashInput) {
	const serialized = internalSerializeConfigurationForHash(input);
	const h1 = internalHashMul31(serialized).toString(36);
	const h2 = internalHashFnv1a(serialized).toString(36);
	return `v2:${serialized.length}:${h1}${h2}`;
}
