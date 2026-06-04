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
import type * as constants from "../constants.js";
import type * as crons_processPendingHighVolumeAnalyticsEvents from "../crons/processPendingHighVolumeAnalyticsEvents.js";
import type * as crons_purgeStaleAnalyticsEvents from "../crons/purgeStaleAnalyticsEvents.js";
import type * as errors_errors from "../errors/errors.js";
import type * as helpers_aggregateEvent from "../helpers/aggregateEvent.js";
import type * as helpers_collectDailyMetricRows from "../helpers/collectDailyMetricRows.js";
import type * as helpers_getAnalyticsMetricTotalsByDimension from "../helpers/getAnalyticsMetricTotalsByDimension.js";
import type * as helpers_getAnalyticsTopDimensionValue from "../helpers/getAnalyticsTopDimensionValue.js";
import type * as helpers_incrementDailyMetric from "../helpers/incrementDailyMetric.js";
import type * as helpers_prepareTrackEvent from "../helpers/prepareTrackEvent.js";
import type * as helpers_upsertMetricRollupForEvent from "../helpers/upsertMetricRollupForEvent.js";
import type * as helpers_writeAnalyticsEvent from "../helpers/writeAnalyticsEvent.js";
import type * as helpers_writeAnalyticsEvents from "../helpers/writeAnalyticsEvents.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as mutations_configure from "../mutations/configure.js";
import type * as mutations_track from "../mutations/track.js";
import type * as mutations_trackBatch from "../mutations/trackBatch.js";
import type * as queries_fetchBreakdown from "../queries/fetchBreakdown.js";
import type * as queries_fetchConfiguration from "../queries/fetchConfiguration.js";
import type * as queries_fetchMetricComparison from "../queries/fetchMetricComparison.js";
import type * as queries_fetchSummary from "../queries/fetchSummary.js";
import type * as queries_fetchTimeSeries from "../queries/fetchTimeSeries.js";
import type * as schemas_schemas from "../schemas/schemas.js";
import type * as types_types from "../types/types.js";
import type * as utils_buildIdempotencyKey from "../utils/buildIdempotencyKey.js";
import type * as utils_common_dateUtils from "../utils/common/dateUtils.js";
import type * as utils_common_stringUtils from "../utils/common/stringUtils.js";
import type * as utils_compareScores from "../utils/compareScores.js";
import type * as utils_getAnalyticsRanking from "../utils/getAnalyticsRanking.js";
import type * as utils_getTopSeriesKeys from "../utils/getTopSeriesKeys.js";
import type * as utils_hashString from "../utils/hashString.js";
import type * as utils_listDailyBuckets from "../utils/listDailyBuckets.js";
import type * as utils_shared_metricUtils from "../utils/shared/metricUtils.js";
import type * as utils_shared_scopeUtils from "../utils/shared/scopeUtils.js";
import type * as utils_shared_shardUtils from "../utils/shared/shardUtils.js";
import type * as utils_toAggregateInput from "../utils/toAggregateInput.js";
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
  constants: typeof constants;
  "crons/processPendingHighVolumeAnalyticsEvents": typeof crons_processPendingHighVolumeAnalyticsEvents;
  "crons/purgeStaleAnalyticsEvents": typeof crons_purgeStaleAnalyticsEvents;
  "errors/errors": typeof errors_errors;
  "helpers/aggregateEvent": typeof helpers_aggregateEvent;
  "helpers/collectDailyMetricRows": typeof helpers_collectDailyMetricRows;
  "helpers/getAnalyticsMetricTotalsByDimension": typeof helpers_getAnalyticsMetricTotalsByDimension;
  "helpers/getAnalyticsTopDimensionValue": typeof helpers_getAnalyticsTopDimensionValue;
  "helpers/incrementDailyMetric": typeof helpers_incrementDailyMetric;
  "helpers/prepareTrackEvent": typeof helpers_prepareTrackEvent;
  "helpers/upsertMetricRollupForEvent": typeof helpers_upsertMetricRollupForEvent;
  "helpers/writeAnalyticsEvent": typeof helpers_writeAnalyticsEvent;
  "helpers/writeAnalyticsEvents": typeof helpers_writeAnalyticsEvents;
  http: typeof http;
  lib: typeof lib;
  "mutations/configure": typeof mutations_configure;
  "mutations/track": typeof mutations_track;
  "mutations/trackBatch": typeof mutations_trackBatch;
  "queries/fetchBreakdown": typeof queries_fetchBreakdown;
  "queries/fetchConfiguration": typeof queries_fetchConfiguration;
  "queries/fetchMetricComparison": typeof queries_fetchMetricComparison;
  "queries/fetchSummary": typeof queries_fetchSummary;
  "queries/fetchTimeSeries": typeof queries_fetchTimeSeries;
  "schemas/schemas": typeof schemas_schemas;
  "types/types": typeof types_types;
  "utils/buildIdempotencyKey": typeof utils_buildIdempotencyKey;
  "utils/common/dateUtils": typeof utils_common_dateUtils;
  "utils/common/stringUtils": typeof utils_common_stringUtils;
  "utils/compareScores": typeof utils_compareScores;
  "utils/getAnalyticsRanking": typeof utils_getAnalyticsRanking;
  "utils/getTopSeriesKeys": typeof utils_getTopSeriesKeys;
  "utils/hashString": typeof utils_hashString;
  "utils/listDailyBuckets": typeof utils_listDailyBuckets;
  "utils/shared/metricUtils": typeof utils_shared_metricUtils;
  "utils/shared/scopeUtils": typeof utils_shared_scopeUtils;
  "utils/shared/shardUtils": typeof utils_shared_shardUtils;
  "utils/toAggregateInput": typeof utils_toAggregateInput;
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
