// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// CONFIG
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";

// HELPERS
import {
	internalCollectDailyActorClaims,
	internalCollectDailyMetricRows,
	internalCountDistinctActorsByDimensionFromClaims,
	internalGetMetricTotalForRange,
} from "../helpers/rollupReads";

// UTILS
import {
	internalGetMetricConfigOrThrow,
	internalGetMetricRollupGranularity,
} from "../utils/shared/metricUtils";
import { internalGetFunnelConfigOrThrow } from "../utils/shared/funnelUtils";
import { internalResolveScope } from "../utils/shared/scopeUtils";
import { startOfUtcDay } from "../../shared/utils/analyticsDateRangeUtils.js";
import { internalReduceMetricRollupTotalsByKey } from "../../shared/utils/metricAggregationUtils.js";
import {
	internalAssertAllowedDimension,
	internalAssertDateRange,
} from "../validations/validations";
import { internalBadRequest } from "../errors/errors";
import { computeConversionRatePercent } from "../../shared/utils/analyticsEvaluationUtils";

// SCHEMAS
import {
	configReferenceFields,
	funnelConversionResponseValidator,
	scopeInputValidator,
} from "../schemas/schemas";

/**
 * Rollup-based conversion for a named funnel (first step → last step).
 */
export const fetchFunnelConversion = query({
	args: {
		...configReferenceFields,
		funnel: v.string(),
		from: v.number(),
		to: v.number(),
		scope: v.optional(scopeInputValidator),
		groupBy: v.optional(v.string()),
	},
	returns: funnelConversionResponseValidator,
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});
		internalAssertDateRange({ from: args.from, to: args.to }, config.settings);

		const funnelConfig = internalGetFunnelConfigOrThrow(config, args.funnel);
		if (funnelConfig.steps.length < 2) {
			internalBadRequest(
				`Funnel "${args.funnel}" must include at least two metric steps.`,
			);
		}

		const denominatorMetric = funnelConfig.steps[0]!;
		const numeratorMetric = funnelConfig.steps[funnelConfig.steps.length - 1]!;

		const denominatorConfig = internalGetMetricConfigOrThrow(
			config,
			denominatorMetric,
		);
		const numeratorConfig = internalGetMetricConfigOrThrow(
			config,
			numeratorMetric,
		);

		if (args.groupBy) {
			internalAssertAllowedDimension(denominatorConfig, args.groupBy);
			internalAssertAllowedDimension(numeratorConfig, args.groupBy);
		}

		const scope = internalResolveScope(args.scope);

		if (!args.groupBy) {
			const [numerator, denominator] = await Promise.all([
				internalGetMetricTotalForRange(ctx, config, {
					metric: numeratorMetric,
					scope,
					from: args.from,
					to: args.to,
				}),
				internalGetMetricTotalForRange(ctx, config, {
					metric: denominatorMetric,
					scope,
					from: args.from,
					to: args.to,
				}),
			]);

			return {
				funnel: args.funnel,
				label: funnelConfig.label,
				steps: funnelConfig.steps,
				numeratorMetric,
				denominatorMetric,
				numerator,
				denominator,
				ratePercent: computeConversionRatePercent({ numerator, denominator }),
				scope,
				range: {
					from: startOfUtcDay(args.from),
					to: startOfUtcDay(args.to),
				},
			};
		}

		// Distinct-actor totals cannot be summed across day rollup rows for
		// multi-day ranges — dedupe via actor claims like fetchBreakdown does.
		const groupBy = args.groupBy;
		const collectTotalsByDimension = async (
			metric: string,
			metricConfig: typeof numeratorConfig,
		) => {
			if (
				metricConfig.aggregation === "distinctActors" &&
				startOfUtcDay(args.from) !== startOfUtcDay(args.to)
			) {
				return internalCountDistinctActorsByDimensionFromClaims(
					await internalCollectDailyActorClaims(ctx, {
						metric,
						scope,
						dimensionKey: groupBy,
						from: args.from,
						to: args.to,
						settings: config.settings,
					}),
				);
			}

			return internalReduceMetricRollupTotalsByKey(
				metricConfig.aggregation,
				await internalCollectDailyMetricRows(ctx, {
					metric,
					scope,
					dimensionKey: groupBy,
					from: args.from,
					to: args.to,
					settings: config.settings,
					granularity: internalGetMetricRollupGranularity(metricConfig),
				}),
			);
		};

		const [numeratorTotals, denominatorTotals] = await Promise.all([
			collectTotalsByDimension(numeratorMetric, numeratorConfig),
			collectTotalsByDimension(denominatorMetric, denominatorConfig),
		]);

		const dimensionValues = [
			...new Set([
				...numeratorTotals.keys(),
				...denominatorTotals.keys(),
			]),
		];

		const fullBreakdown = dimensionValues.map((dimensionValue) => {
			const numerator = numeratorTotals.get(dimensionValue) ?? 0;
			const denominator = denominatorTotals.get(dimensionValue) ?? 0;
			return {
				dimensionValue,
				numerator,
				denominator,
				ratePercent: computeConversionRatePercent({ numerator, denominator }),
			};
		});

		// Totals come from the full set; the returned breakdown is capped so a
		// high-cardinality dimension cannot blow up the response.
		const numerator = fullBreakdown.reduce(
			(total, row) => total + row.numerator,
			0,
		);
		const denominator = fullBreakdown.reduce(
			(total, row) => total + row.denominator,
			0,
		);
		const breakdown = fullBreakdown
			.sort(
				(left, right) =>
					right.denominator - left.denominator ||
					left.dimensionValue.localeCompare(right.dimensionValue),
			)
			.slice(0, config.settings.maxBreakdownItems);

		return {
			funnel: args.funnel,
			label: funnelConfig.label,
			steps: funnelConfig.steps,
			numeratorMetric,
			denominatorMetric,
			numerator,
			denominator,
			ratePercent: computeConversionRatePercent({ numerator, denominator }),
			groupBy: args.groupBy,
			breakdown,
			scope,
			range: {
				from: startOfUtcDay(args.from),
				to: startOfUtcDay(args.to),
			},
		};
	},
});
