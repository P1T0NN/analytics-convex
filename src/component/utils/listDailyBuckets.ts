// CONFIG
import { DAY_MS } from "../constants.js";

// UTILS
import { startOfUtcDay } from "./common/dateUtils.js";

export function listDailyBuckets(from: number, to: number) {
    const start = startOfUtcDay(from);
    const end = startOfUtcDay(to);
    const buckets: number[] = [];
    
    for (let bucket = start; bucket <= end; bucket += DAY_MS) {
        buckets.push(bucket);
    }
    
    return buckets;
}