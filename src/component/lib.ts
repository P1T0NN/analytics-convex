// MUTATIONS

/** Store events, metrics, and settings config. Run once after deploys. */
export { writeConfiguration } from "./mutations/writeConfiguration.js";

/** Validate and schedule an analytics event or bounded event batch. */
export { writeTrack } from "./mutations/writeTrack.js";

/** @internal — scheduled by writeTrack(), do not call directly. */
export { writeAnalyticsEvent } from "./helpers/writeAnalyticsEvent.js";

// QUERIES

/** Read the current analytics config (events, metrics, settings). */
export { fetchConfiguration } from "./queries/fetchConfiguration.js";

/** Daily bucketed chart data with optional dimension grouping. */
export { fetchTimeSeries } from "./queries/fetchTimeSeries.js";

/** Single aggregated total for a metric over a date range. */
export { fetchSummary } from "./queries/fetchSummary.js";

/** Top dimension values ranked by total. */
export { fetchBreakdown } from "./queries/fetchBreakdown.js";

/** Compare a metric between current and previous period. */
export { fetchMetricComparison } from "./queries/fetchMetricComparison.js";

// HELPERS

/** Aggregated dimension totals (Map<dimensionValue, total>). */
export { getAnalyticsMetricTotalsByDimension } from "./helpers/getAnalyticsMetricTotalsByDimension.js";

/** Single highest-value dimension entry, or null. */
export { getAnalyticsTopDimensionValue } from "./helpers/getAnalyticsTopDimensionValue.js";

// UTILS

/** Pure ranking/sorting utility with tie-breakers. */
export { getAnalyticsRanking } from "./utils/getAnalyticsRanking.js";

// CRONS

/** @internal — batch-aggregate pending high-volume events. */
export { processPendingHighVolumeAnalyticsEvents } from "./crons/processPendingHighVolumeAnalyticsEvents.js";

/** @internal — delete raw events past retention window. */
export { purgeStaleAnalyticsEvents } from "./crons/purgeStaleAnalyticsEvents.js";
