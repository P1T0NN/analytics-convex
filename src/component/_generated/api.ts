/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analyticsConfig from "../analyticsConfig.js";
import type * as crons_processPendingHighVolumeAnalyticsEvents from "../crons/processPendingHighVolumeAnalyticsEvents.js";
import type * as crons_purgeStaleAnalyticsEvents from "../crons/purgeStaleAnalyticsEvents.js";
import type * as crons_purgeStaleAnalyticsRollups from "../crons/purgeStaleAnalyticsRollups.js";
import type * as errors_errors from "../errors/errors.js";
import type * as helpers_aggregateEvent from "../helpers/aggregateEvent.js";
import type * as helpers_claimDailyActorRollup from "../helpers/claimDailyActorRollup.js";
import type * as helpers_claimJourneyStep from "../helpers/claimJourneyStep.js";
import type * as helpers_claimUniqueEvent from "../helpers/claimUniqueEvent.js";
import type * as helpers_evaluateMetricForRange from "../helpers/evaluateMetricForRange.js";
import type * as helpers_incrementDailyMetric from "../helpers/incrementDailyMetric.js";
import type * as helpers_internalWriteAnalyticsEvent from "../helpers/internalWriteAnalyticsEvent.js";
import type * as helpers_metricTotalCache from "../helpers/metricTotalCache.js";
import type * as helpers_prepareTrackEvent from "../helpers/prepareTrackEvent.js";
import type * as helpers_resolveConfiguration from "../helpers/resolveConfiguration.js";
import type * as helpers_rollupReads from "../helpers/rollupReads.js";
import type * as lib from "../lib.js";
import type * as mutations_writeConfiguration from "../mutations/writeConfiguration.js";
import type * as mutations_writeTrack from "../mutations/writeTrack.js";
import type * as queries_fetchBreakdown from "../queries/fetchBreakdown.js";
import type * as queries_fetchConfiguration from "../queries/fetchConfiguration.js";
import type * as queries_fetchDashboardMetrics from "../queries/fetchDashboardMetrics.js";
import type * as queries_fetchFunnelConversion from "../queries/fetchFunnelConversion.js";
import type * as queries_fetchJourneyConversion from "../queries/fetchJourneyConversion.js";
import type * as queries_fetchMetricComparison from "../queries/fetchMetricComparison.js";
import type * as queries_fetchMetricConversion from "../queries/fetchMetricConversion.js";
import type * as queries_fetchMetricEvaluation from "../queries/fetchMetricEvaluation.js";
import type * as queries_fetchMetricTotalsByDimension from "../queries/fetchMetricTotalsByDimension.js";
import type * as queries_fetchSummary from "../queries/fetchSummary.js";
import type * as queries_fetchTimeSeries from "../queries/fetchTimeSeries.js";
import type * as queries_fetchTopDimensionValue from "../queries/fetchTopDimensionValue.js";
import type * as schemas_schemas from "../schemas/schemas.js";
import type * as utils_analyticsEventPayloads from "../utils/analyticsEventPayloads.js";
import type * as utils_buildDailyActorClaimKey from "../utils/buildDailyActorClaimKey.js";
import type * as utils_buildIdempotencyKey from "../utils/buildIdempotencyKey.js";
import type * as utils_buildJourneyStepClaimKey from "../utils/buildJourneyStepClaimKey.js";
import type * as utils_common_stringUtils from "../utils/common/stringUtils.js";
import type * as utils_getDistinctActorRollupTargets from "../utils/getDistinctActorRollupTargets.js";
import type * as utils_getJourneyStepTargets from "../utils/getJourneyStepTargets.js";
import type * as utils_getMetricRollupIncrements from "../utils/getMetricRollupIncrements.js";
import type * as utils_getRollupIncrementKey from "../utils/getRollupIncrementKey.js";
import type * as utils_getTopSeriesKeys from "../utils/getTopSeriesKeys.js";
import type * as utils_hashString from "../utils/hashString.js";
import type * as utils_queryOptionsUtils from "../utils/queryOptionsUtils.js";
import type * as utils_shared_funnelUtils from "../utils/shared/funnelUtils.js";
import type * as utils_shared_journeyUtils from "../utils/shared/journeyUtils.js";
import type * as utils_shared_metricUtils from "../utils/shared/metricUtils.js";
import type * as utils_shared_scopeUtils from "../utils/shared/scopeUtils.js";
import type * as utils_shared_shardUtils from "../utils/shared/shardUtils.js";
import type * as validations_configurationLimits from "../validations/configurationLimits.js";
import type * as validations_eventInputLimits from "../validations/eventInputLimits.js";
import type * as validations_limitUtils from "../validations/limitUtils.js";
import type * as validations_validations from "../validations/validations.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

const fullApi: ApiFromModules<{
  analyticsConfig: typeof analyticsConfig;
  "crons/processPendingHighVolumeAnalyticsEvents": typeof crons_processPendingHighVolumeAnalyticsEvents;
  "crons/purgeStaleAnalyticsEvents": typeof crons_purgeStaleAnalyticsEvents;
  "crons/purgeStaleAnalyticsRollups": typeof crons_purgeStaleAnalyticsRollups;
  "errors/errors": typeof errors_errors;
  "helpers/aggregateEvent": typeof helpers_aggregateEvent;
  "helpers/claimDailyActorRollup": typeof helpers_claimDailyActorRollup;
  "helpers/claimJourneyStep": typeof helpers_claimJourneyStep;
  "helpers/claimUniqueEvent": typeof helpers_claimUniqueEvent;
  "helpers/evaluateMetricForRange": typeof helpers_evaluateMetricForRange;
  "helpers/incrementDailyMetric": typeof helpers_incrementDailyMetric;
  "helpers/internalWriteAnalyticsEvent": typeof helpers_internalWriteAnalyticsEvent;
  "helpers/metricTotalCache": typeof helpers_metricTotalCache;
  "helpers/prepareTrackEvent": typeof helpers_prepareTrackEvent;
  "helpers/resolveConfiguration": typeof helpers_resolveConfiguration;
  "helpers/rollupReads": typeof helpers_rollupReads;
  lib: typeof lib;
  "mutations/writeConfiguration": typeof mutations_writeConfiguration;
  "mutations/writeTrack": typeof mutations_writeTrack;
  "queries/fetchBreakdown": typeof queries_fetchBreakdown;
  "queries/fetchConfiguration": typeof queries_fetchConfiguration;
  "queries/fetchDashboardMetrics": typeof queries_fetchDashboardMetrics;
  "queries/fetchFunnelConversion": typeof queries_fetchFunnelConversion;
  "queries/fetchJourneyConversion": typeof queries_fetchJourneyConversion;
  "queries/fetchMetricComparison": typeof queries_fetchMetricComparison;
  "queries/fetchMetricConversion": typeof queries_fetchMetricConversion;
  "queries/fetchMetricEvaluation": typeof queries_fetchMetricEvaluation;
  "queries/fetchMetricTotalsByDimension": typeof queries_fetchMetricTotalsByDimension;
  "queries/fetchSummary": typeof queries_fetchSummary;
  "queries/fetchTimeSeries": typeof queries_fetchTimeSeries;
  "queries/fetchTopDimensionValue": typeof queries_fetchTopDimensionValue;
  "schemas/schemas": typeof schemas_schemas;
  "utils/analyticsEventPayloads": typeof utils_analyticsEventPayloads;
  "utils/buildDailyActorClaimKey": typeof utils_buildDailyActorClaimKey;
  "utils/buildIdempotencyKey": typeof utils_buildIdempotencyKey;
  "utils/buildJourneyStepClaimKey": typeof utils_buildJourneyStepClaimKey;
  "utils/common/stringUtils": typeof utils_common_stringUtils;
  "utils/getDistinctActorRollupTargets": typeof utils_getDistinctActorRollupTargets;
  "utils/getJourneyStepTargets": typeof utils_getJourneyStepTargets;
  "utils/getMetricRollupIncrements": typeof utils_getMetricRollupIncrements;
  "utils/getRollupIncrementKey": typeof utils_getRollupIncrementKey;
  "utils/getTopSeriesKeys": typeof utils_getTopSeriesKeys;
  "utils/hashString": typeof utils_hashString;
  "utils/queryOptionsUtils": typeof utils_queryOptionsUtils;
  "utils/shared/funnelUtils": typeof utils_shared_funnelUtils;
  "utils/shared/journeyUtils": typeof utils_shared_journeyUtils;
  "utils/shared/metricUtils": typeof utils_shared_metricUtils;
  "utils/shared/scopeUtils": typeof utils_shared_scopeUtils;
  "utils/shared/shardUtils": typeof utils_shared_shardUtils;
  "validations/configurationLimits": typeof validations_configurationLimits;
  "validations/eventInputLimits": typeof validations_eventInputLimits;
  "validations/limitUtils": typeof validations_limitUtils;
  "validations/validations": typeof validations_validations;
}> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;

export const components = componentsGeneric() as unknown as {};
