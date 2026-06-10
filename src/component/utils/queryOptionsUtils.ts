// UTILS
import {
	ANALYTICS_UTC_TIMEZONE,
	internalResolveAnalyticsTimezone,
} from "../../shared/utils/analyticsTimezoneUtils.js";
import { internalBadRequest } from "../errors/errors.js";

// TYPES
import type { typesAnalyticsBucketUnit } from "../../shared/types/primitives.js";
import type { typesAnalyticsSettings } from "../../shared/types/settings.js";

export function internalResolveQueryBucketUnit(
	bucketUnit: typesAnalyticsBucketUnit | undefined,
) {
	return bucketUnit ?? "day";
}

export function internalResolveQueryTimezone(
	timezone: string | undefined,
	settings: typesAnalyticsSettings,
) {
	try {
		return internalResolveAnalyticsTimezone(timezone, settings.defaultTimezone);
	} catch {
		internalBadRequest(
			`\`timezone\` must be a valid IANA timezone; received "${timezone ?? settings.defaultTimezone}".`,
		);
	}
}

export function internalUsesDistinctActorClaimTimeSeries(args: {
	aggregation: string;
	bucketUnit: typesAnalyticsBucketUnit;
	timeZone: string;
}) {
	return (
		args.aggregation === "distinctActors" &&
		(args.bucketUnit !== "day" || args.timeZone !== ANALYTICS_UTC_TIMEZONE)
	);
}

export function internalUsesRollupRebucketTimeSeries(args: {
	bucketUnit: typesAnalyticsBucketUnit;
	timeZone: string;
}) {
	return args.bucketUnit !== "day" || args.timeZone !== ANALYTICS_UTC_TIMEZONE;
}
