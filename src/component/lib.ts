// MUTATIONS

/** Validate and register the analytics configuration by hash. */
export { writeConfiguration } from "./mutations/writeConfiguration.js";

/** Validate and schedule an analytics event or bounded event batch. */
export { writeTrack } from "./mutations/writeTrack.js";

/** Set or clear a per-scope evaluation override for one metric. */
export { writeMetricEvaluationOverride } from "./mutations/writeMetricEvaluationOverride.js";

/** Delete rollups/claims for metrics or journeys removed from the config. */
export { pruneAnalyticsData } from "./mutations/pruneAnalyticsData.js";

/** One-time month-claim backfill for pre-2.0 distinctActors data. */
export { backfillMonthActorClaims } from "./mutations/backfillMonthActorClaims.js";

// QUERIES

/** Read the current analytics config (events, metrics, settings). */
export { fetchConfiguration } from "./queries/fetchConfiguration.js";

/** Ghost-data audit: orphaned metrics/journeys and stale stored configs. */
export { fetchDataAudit } from "./queries/fetchDataAudit.js";

/** High-volume ingestion backlog visibility (pending count, oldest age). */
export { fetchIngestionHealth } from "./queries/fetchIngestionHealth.js";

/** Daily bucketed chart data with optional dimension grouping. */
export { fetchTimeSeries } from "./queries/fetchTimeSeries.js";

/** Single aggregated total for a metric over a date range. */
export { fetchSummary } from "./queries/fetchSummary.js";

/** Top dimension values ranked by total. */
export { fetchBreakdown } from "./queries/fetchBreakdown.js";

/** Compare a metric between current and previous period. */
export { fetchMetricComparison } from "./queries/fetchMetricComparison.js";

/** Rollup-based conversion between two metrics over the same range. */
export { fetchMetricConversion } from "./queries/fetchMetricConversion.js";

/** Query-time metric health label for dashboard cards. */
export { fetchMetricEvaluation } from "./queries/fetchMetricEvaluation.js";

/** Effective evaluation config for a metric in a scope (override or static). */
export { fetchMetricEvaluationConfig } from "./queries/fetchMetricEvaluationConfig.js";

/** Batch dashboard read for multiple metrics over one date range. */
export { fetchDashboardMetrics } from "./queries/fetchDashboardMetrics.js";

/** Rollup-based conversion for a named funnel (first step → last step). */
export { fetchFunnelConversion } from "./queries/fetchFunnelConversion.js";

/** Rollup-based conversion for a named event-sequence journey. */
export { fetchJourneyConversion } from "./queries/fetchJourneyConversion.js";

/** Aggregated totals by dimension value. */
export { fetchMetricTotalsByDimension } from "./queries/fetchMetricTotalsByDimension.js";

/** Single highest-value dimension entry, or null. */
export { fetchTopDimensionValue } from "./queries/fetchTopDimensionValue.js";

// CRONS

/** @internal - batch-aggregate pending high-volume events. */
export { processPendingHighVolumeAnalyticsEvents } from "./crons/processPendingHighVolumeAnalyticsEvents.js";

/** @internal - delete raw events past retention window. */
export { purgeStaleAnalyticsEvents } from "./crons/purgeStaleAnalyticsEvents.js";

/** @internal - delete rollup rows past retention window. */
export { purgeStaleAnalyticsRollups } from "./crons/purgeStaleAnalyticsRollups.js";

/** @internal - collapse shard rows on cold rollup buckets into shard 0. */
export { compactAnalyticsRollups } from "./crons/compactAnalyticsRollups.js";
