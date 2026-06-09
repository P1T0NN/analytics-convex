// CONSTANTS
import { ANALYTICS_TRAFFIC_MODE } from "../constants.js";

export type typesAnalyticsTrafficMode = (typeof ANALYTICS_TRAFFIC_MODE)[keyof typeof ANALYTICS_TRAFFIC_MODE];
export type typesAnalyticsPropertyType = "string" | "number" | "boolean";
export type typesAnalyticsPropertyValue = string | number | boolean | null;
export type typesAnalyticsUnit = "count" | "currency" | "bytes";
export type typesAnalyticsAggregation = "count" | "sum";
export type typesRollupMode = "realtime" | "highVolume";
export type typesHighVolumeStatus = "none" | "pending" | "processed";
export type typesAnalyticsProperties = Record<string, typesAnalyticsPropertyValue>;
