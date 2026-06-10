// CONSTANTS
import { TOTAL_DIMENSION } from "../../shared/constants.js";

// UTILS
import {
	internalBuildJourneyStepClaimKey,
	internalFormatJourneyDimensionValue,
} from "../utils/buildJourneyStepClaimKey";

// TYPES
import type { MutationCtx } from "../_generated/server.js";
import type { typesJourneyStepTarget } from "../utils/getJourneyStepTargets";

async function internalResolveJourneyStepDimension(
	ctx: MutationCtx,
	target: typesJourneyStepTarget,
) {
	if (!target.breakdownProperty) {
		return { dimensionKey: TOTAL_DIMENSION, dimensionValue: "" };
	}

	if (target.stepIndex === 0) {
		return {
			dimensionKey: target.breakdownProperty,
			dimensionValue: internalFormatJourneyDimensionValue(
				target.properties[target.breakdownProperty],
			),
		};
	}

	const stepZeroClaim = await ctx.db
		.query("analyticsJourneyStepClaims")
		.withIndex("by_journey_scope_actor_step_bucket", (q) =>
			q
				.eq("journey", target.journey)
				.eq("scopeType", target.scope.scopeType)
				.eq("scopeId", target.scope.scopeId)
				.eq("actorKey", target.actorKey)
				.eq("stepIndex", 0)
				.lte("bucketStart", target.bucketStart),
		)
		.first();

	if (!stepZeroClaim) {
		return null;
	}

	return {
		dimensionKey: stepZeroClaim.dimensionKey ?? target.breakdownProperty,
		dimensionValue: stepZeroClaim.dimensionValue ?? "",
	};
}

export async function internalClaimJourneyStep(
	ctx: MutationCtx,
	target: typesJourneyStepTarget,
) {
	const dimension = await internalResolveJourneyStepDimension(ctx, target);
	if (!dimension) {
		return { claimed: false };
	}

	const claimKey = internalBuildJourneyStepClaimKey(target, dimension);
	const existing = await ctx.db
		.query("analyticsJourneyStepClaims")
		.withIndex("by_claim_key", (q) => q.eq("claimKey", claimKey))
		.first();

	if (existing) {
		return { claimed: false };
	}

	if (target.stepIndex > 0) {
		const priorClaim = await ctx.db
			.query("analyticsJourneyStepClaims")
			.withIndex("by_journey_scope_actor_step_bucket", (q) =>
				q
					.eq("journey", target.journey)
					.eq("scopeType", target.scope.scopeType)
					.eq("scopeId", target.scope.scopeId)
					.eq("actorKey", target.actorKey)
					.eq("stepIndex", target.stepIndex - 1)
					.lte("bucketStart", target.bucketStart),
			)
			.first();

		if (!priorClaim) {
			return { claimed: false };
		}

		if (target.breakdownProperty) {
			const priorDimension = {
				dimensionKey: priorClaim.dimensionKey ?? target.breakdownProperty,
				dimensionValue: priorClaim.dimensionValue ?? "",
			};
			if (
				priorDimension.dimensionKey !== dimension.dimensionKey ||
				priorDimension.dimensionValue !== dimension.dimensionValue
			) {
				return { claimed: false };
			}
		}
	}

	await ctx.db.insert("analyticsJourneyStepClaims", {
		claimKey,
		journey: target.journey,
		stepIndex: target.stepIndex,
		bucketStart: target.bucketStart,
		scopeType: target.scope.scopeType,
		scopeId: target.scope.scopeId,
		actorKey: target.actorKey,
		...(target.breakdownProperty
			? {
					dimensionKey: dimension.dimensionKey,
					dimensionValue: dimension.dimensionValue,
				}
			: {}),
	});

	return { claimed: true };
}
