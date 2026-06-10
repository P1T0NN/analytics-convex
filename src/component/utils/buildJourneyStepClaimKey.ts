// CONSTANTS
import { TOTAL_DIMENSION } from "../../shared/constants.js";

// TYPES
import type { typesJourneyStepTarget } from "./getJourneyStepTargets";

export function internalBuildJourneyStepClaimKey(
	target: typesJourneyStepTarget,
	dimension: { dimensionKey: string; dimensionValue: string },
) {
	const parts = [
		target.journey,
		target.scope.scopeType,
		target.scope.scopeId,
	];

	if (target.breakdownProperty) {
		parts.push(dimension.dimensionKey, dimension.dimensionValue);
	}

	parts.push(
		String(target.bucketStart),
		String(target.stepIndex),
		target.actorKey,
	);

	return parts.join(":");
}

export function internalFormatJourneyDimensionValue(
	value: string | number | boolean | null | undefined,
) {
	if (value === null || value === undefined) {
		return "";
	}

	return String(value);
}

export function internalGetJourneyClaimDimension(
	claim: {
		dimensionKey?: string;
		dimensionValue?: string;
	},
) {
	return {
		dimensionKey: claim.dimensionKey ?? TOTAL_DIMENSION,
		dimensionValue: claim.dimensionValue ?? "",
	};
}
