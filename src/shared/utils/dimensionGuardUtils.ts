// CONSTANTS
import { ANALYTICS_HIGH_CARDINALITY_DIMENSIONS } from "../constants.js";

const blockedDimensionNames = new Set(
	ANALYTICS_HIGH_CARDINALITY_DIMENSIONS.map((name) => normalizeDimensionName(name)),
);

function normalizeDimensionName(name: string) {
	return name.replace(/[\s_-]/g, "").toLowerCase();
}

export function internalIsBlockedDimensionName(name: string) {
	return blockedDimensionNames.has(normalizeDimensionName(name));
}
