// UTILS
import { hashString } from "./hashString.js";

// TYPES
import type {
  typesAnalyticsEventConfig,
  typesAnalyticsMetricConfig,
  typesAnalyticsSettings,
} from "../types/types.js";

type typesConfigurationHashInput = {
  events: typesAnalyticsEventConfig[];
  metrics: typesAnalyticsMetricConfig[];
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

export function serializeConfigurationForHash(
  input: typesConfigurationHashInput,
) {
  return JSON.stringify(normalizeForHash(input));
}

export function createConfigurationHash(input: typesConfigurationHashInput) {
  const serialized = serializeConfigurationForHash(input);
  return `v1:${serialized.length}:${hashString(serialized).toString(36)}`;
}
