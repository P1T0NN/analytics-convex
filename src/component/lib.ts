// MUTATIONS

/** Legacy validation-only compatibility mutation. */
export { writeConfiguration } from "./mutations/writeConfiguration.js";

/** Validate and schedule an analytics event or bounded event batch. */
export { writeTrack } from "./mutations/writeTrack.js";

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

/** Aggregated totals by dimension value. */
export { fetchMetricTotalsByDimension } from "./queries/fetchMetricTotalsByDimension.js";

/** Single highest-value dimension entry, or null. */
export { fetchTopDimensionValue } from "./queries/fetchTopDimensionValue.js";

// CRONS

/** @internal - batch-aggregate pending high-volume events. */
export { processPendingHighVolumeAnalyticsEvents } from "./crons/processPendingHighVolumeAnalyticsEvents.js";

/** @internal - delete raw events past retention window. */
export { purgeStaleAnalyticsEvents } from "./crons/purgeStaleAnalyticsEvents.js";
