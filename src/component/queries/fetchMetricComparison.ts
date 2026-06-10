// LIBRARIES
import { v } from "convex/values";
import { query } from "../_generated/server";

// HELPERS
import { internalResolveConfiguration } from "../helpers/resolveConfiguration";
import { internalGetMetricTotalsForRanges } from "../helpers/rollupReads";
import { internalGetMetricConfigOrThrow } from "../utils/shared/metricUtils";

// UTILS
import {
	getQueryBucketEndInclusive,
	getQueryBucketStart,
	previousAnalyticsPeriodRange,
} from "../../shared/utils/analyticsDateRangeUtils.js";
import { internalResolveScope } from "../utils/shared/scopeUtils";
import {
	internalResolveQueryBucketUnit,
	internalResolveQueryTimezone,
} from "../utils/queryOptionsUtils";
import { internalAssertDateRange } from "../validations/validations";

// SCHEMAS
import {
	bucketUnitValidator,
	configReferenceFields,
	rangeValidator,
	resolvedScopeValidator,
	scopeInputValidator,
	timezoneValidator,
	unitValidator,
} from "../schemas/schemas";

/**
 * Compare a metric between two equal-length periods.
 *
 * The previous period is auto-calculated from the current range. Day ranges
 * use UTC day counts; week/month ranges use calendar bucket counts.
 */
export const fetchMetricComparison = query({
	args: {
		...configReferenceFields,
		metric: v.string(),
		from: v.number(),
		to: v.number(),
		scope: v.optional(scopeInputValidator),
		bucketUnit: v.optional(bucketUnitValidator),
		timezone: v.optional(timezoneValidator),
	},
	returns: v.object({
		metric: v.string(),
		label: v.string(),
		unit: unitValidator,
		scope: resolvedScopeValidator,
		current: v.number(),
		previous: v.number(),
		delta: v.number(),
		deltaPercent: v.optional(v.number()),
		bucketUnit: bucketUnitValidator,
		timezone: v.string(),
		range: v.object({
			current: rangeValidator,
			previous: rangeValidator,
		}),
	}),
	handler: async (ctx, args) => {
		const config = await internalResolveConfiguration(ctx, {
			configHash: args.configHash,
			config: args.config,
		});
		const bucketUnit = internalResolveQueryBucketUnit(args.bucketUnit);
		const timeZone = internalResolveQueryTimezone(args.timezone, config.settings);
		const { current: currentRange, previous: previousRange } =
			previousAnalyticsPeriodRange(
				{
					from: args.from,
					to: args.to,
				},
				bucketUnit,
				timeZone,
			);

		internalAssertDateRange(
			{
				from: currentRange.from,
				to: getQueryBucketEndInclusive(currentRange.to, bucketUnit, timeZone),
			},
			config.settings,
		);
		internalAssertDateRange(
			{
				from: previousRange.from,
				to: getQueryBucketEndInclusive(previousRange.to, bucketUnit, timeZone),
			},
			config.settings,
		);

		const metricConfig = internalGetMetricConfigOrThrow(config, args.metric);
		const scope = internalResolveScope(args.scope);

		const totals = await internalGetMetricTotalsForRanges(ctx, config, {
			metric: args.metric,
			scope,
			ranges: [
				{
					key: "current",
					from: currentRange.from,
					to: getQueryBucketEndInclusive(currentRange.to, bucketUnit, timeZone),
				},
				{
					key: "previous",
					from: previousRange.from,
					to: getQueryBucketEndInclusive(previousRange.to, bucketUnit, timeZone),
				},
			],
		});
		const current = totals.get("current") ?? 0;
		const previous = totals.get("previous") ?? 0;

		const delta = current - previous;
		const deltaPercent = previous !== 0 ? (delta / previous) * 100 : undefined;

		return {
			metric: args.metric,
			label: metricConfig.label,
			unit: metricConfig.unit,
			scope,
			current,
			previous,
			delta,
			deltaPercent,
			bucketUnit,
			timezone: timeZone === "UTC" ? "UTC" : timeZone,
			range: {
				current: {
					from: getQueryBucketStart(currentRange.from, bucketUnit, timeZone),
					to: getQueryBucketStart(currentRange.to, bucketUnit, timeZone),
				},
				previous: {
					from: getQueryBucketStart(previousRange.from, bucketUnit, timeZone),
					to: getQueryBucketStart(previousRange.to, bucketUnit, timeZone),
				},
			},
		};
	},
});
