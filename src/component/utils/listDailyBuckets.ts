// CONFIG
import { DAY_MS } from "../../shared/constants.js";

// UTILS
import { internalStartOfUtcDay } from "./common/dateUtils.js";

export function internalListDailyBuckets(from: number, to: number) {
	const start = internalStartOfUtcDay(from);
	const end = internalStartOfUtcDay(to);
	const buckets: number[] = [];

	for (let bucket = start; bucket <= end; bucket += DAY_MS) {
		buckets.push(bucket);
	}

	return buckets;
}
