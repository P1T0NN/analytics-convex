// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// HELPERS
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// UTILS
import { computeConversionRatePercent } from "../../shared/utils/analyticsEvaluationUtils";
import { startOfUtcDay } from "../../shared/utils/analyticsDateRangeUtils.js";
import { internalGetJourneyClaimDimension } from "../utils/buildJourneyStepClaimKey";
import { internalResolveScope } from "../utils/shared/scopeUtils";
import { internalGetJourneyConfigOrThrow } from "../utils/shared/journeyUtils";
import { internalBadRequest } from "../errors/errors";

// VALIDATIONS
import { internalAssertDateRange } from "../validations/validations";

// SCHEMAS
import {
	configReferenceFields,
	journeyConversionResponseValidator,
	scopeInputValidator,
} from "../schemas/schemas";

type typesJourneyClaim = {
	actorKey: string;
	stepIndex: number;
	dimensionKey?: string;
	dimensionValue?: string;
};

function internalCountJourneySteps(
	claims: typesJourneyClaim[],
	stepCount: number,
	dimensionValue?: string,
) {
	const stepCounts = Array.from({ length: stepCount }, () => 0);

	for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
		const actors = new Set<string>();

		for (const claim of claims) {
			if (claim.stepIndex !== stepIndex) continue;
			if (dimensionValue !== undefined) {
				const dimension = internalGetJourneyClaimDimension(claim);
				if (dimension.dimensionValue !== dimensionValue) continue;
			}
			actors.add(claim.actorKey);
		}

		stepCounts[stepIndex] = actors.size;
	}

	return stepCounts;
}

function internalJourneyRatePercents(stepCounts: number[]) {
	const firstStepCount = stepCounts[0] ?? 0;
	return stepCounts.map((count, index) =>
		index === 0
			? null
			: computeConversionRatePercent({
					numerator: count,
					denominator: firstStepCount,
				}) ?? null,
	);
}

/**
 * Event-sequence journey conversion over UTC day buckets.
 */
export const fetchJourneyConversion = query({
	args: {
		...configReferenceFields,
		journey: v.string(),
		from: v.number(),
		to: v.number(),
		scope: v.optional(scopeInputValidator),
		groupBy: v.optional(v.string()),
	},
	returns: journeyConversionResponseValidator,
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});
		internalAssertDateRange({ from: args.from, to: args.to }, config.settings);

		const journeyConfig = internalGetJourneyConfigOrThrow(config, args.journey);
		if (journeyConfig.steps.length < 2) {
			internalBadRequest(
				`Journey "${args.journey}" must include at least two event steps.`,
			);
		}

		if (args.groupBy) {
			if (!journeyConfig.breakdownProperty) {
				internalBadRequest(
					`Journey "${args.journey}" does not define breakdownProperty for groupBy queries.`,
				);
			}
			if (args.groupBy !== journeyConfig.breakdownProperty) {
				internalBadRequest(
					`groupBy must match journey breakdownProperty "${journeyConfig.breakdownProperty}".`,
				);
			}
		}

		const scope = internalResolveScope(args.scope);
		const fromDay = startOfUtcDay(args.from);
		const toDay = startOfUtcDay(args.to);

		const claims = (
			await Promise.all(
				journeyConfig.steps.map(async (_step, stepIndex) => {
					const stepClaims = await ctx.db
						.query("analyticsJourneyStepClaims")
						.withIndex("by_journey_scope_step_bucket", (q) =>
							q
								.eq("journey", args.journey)
								.eq("scopeType", scope.type)
								.eq("scopeId", scope.id)
								.eq("stepIndex", stepIndex)
								.gte("bucketStart", fromDay)
								.lte("bucketStart", toDay),
						)
						.take(config.settings.maxRollupRowsPerQuery + 1);

					return stepClaims;
				}),
			)
		).flat();

		if (claims.length > config.settings.maxRollupRowsPerQuery) {
			internalBadRequest(
				`Journey query matched more than ${config.settings.maxRollupRowsPerQuery} step claims. Narrow the date range or scope.`,
			);
		}

		const stepCounts = internalCountJourneySteps(
			claims,
			journeyConfig.steps.length,
		);

		// Cap the breakdown so a high-cardinality breakdown property cannot
		// blow up the response: keep the entries with the most step-1 actors.
		const breakdown = args.groupBy
			? [
					...new Set(
						claims
							.filter(
								(claim) =>
									internalGetJourneyClaimDimension(claim).dimensionKey ===
									args.groupBy,
							)
							.map(
								(claim) =>
									internalGetJourneyClaimDimension(claim).dimensionValue,
							),
					),
				]
					.map((dimensionValue) => {
						const dimensionStepCounts = internalCountJourneySteps(
							claims,
							journeyConfig.steps.length,
							dimensionValue,
						);
						return {
							dimensionValue,
							stepCounts: dimensionStepCounts,
							ratePercents: internalJourneyRatePercents(dimensionStepCounts),
						};
					})
					.sort(
						(left, right) =>
							(right.stepCounts[0] ?? 0) - (left.stepCounts[0] ?? 0) ||
							left.dimensionValue.localeCompare(right.dimensionValue),
					)
					.slice(0, config.settings.maxBreakdownItems)
			: undefined;

		return {
			journey: args.journey,
			label: journeyConfig.label,
			steps: journeyConfig.steps,
			stepCounts,
			ratePercents: internalJourneyRatePercents(stepCounts),
			...(journeyConfig.breakdownProperty
				? { breakdownProperty: journeyConfig.breakdownProperty }
				: {}),
			...(breakdown ? { breakdown } : {}),
			scope,
			range: {
				from: fromDay,
				to: toDay,
			},
		};
	},
});
