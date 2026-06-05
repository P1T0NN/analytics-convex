// LIBRARIES
import type {
  GenericDataModel,
  GenericMutationCtx,
  GenericQueryCtx,
} from "convex/server";

// API
export { createAnalyticsApi } from "./api/createAnalyticsApi";
export { defineAnalytics } from "./api/defineAnalytics";
export { setupAnalytics } from "./api/setupAnalytics";

// BUILDERS
export { event } from "./builders/event";
export { count, sum } from "./builders/metric";
export { property } from "./builders/property";

// HELPERS
export { configureAnalytics } from "./helpers/configureAnalytics";
export { createAnalyticsReader } from "./helpers/createAnalyticsReader";
export { createAnalyticsTracker } from "./helpers/createAnalyticsTracker";
export { trackAnalyticsEvent } from "./helpers/trackAnalyticsEvent";
export { trackAnalyticsEvents } from "./helpers/trackAnalyticsEvents";

// COMPONENT HELPERS
export { aggregateEvent } from "../component/helpers/aggregateEvent";
export { collectDailyMetricRows } from "../component/helpers/collectDailyMetricRows";
export { getAnalyticsMetricTotalsByDimension } from "../component/helpers/getAnalyticsMetricTotalsByDimension";
export { getAnalyticsTopDimensionValue } from "../component/helpers/getAnalyticsTopDimensionValue";
export { getMetricTotalForRange } from "../component/helpers/getMetricTotalForRange";
export { incrementDailyMetric } from "../component/helpers/incrementDailyMetric";
export { prepareTrackEvent } from "../component/helpers/prepareTrackEvent";
export { upsertMetricRollupForEvent } from "../component/helpers/upsertMetricRollupForEvent";
export { writeAnalyticsEvent } from "../component/helpers/writeAnalyticsEvent";

// COMPONENT UTILS
export { buildAggregateInput } from "../component/utils/buildAggregateInput";
export { buildAnalyticsEventInsert } from "../component/utils/buildAnalyticsEventInsert";
export { buildIdempotencyKey } from "../component/utils/buildIdempotencyKey";
export { compareScores } from "../component/utils/compareScores";
export { getAnalyticsRanking } from "../component/utils/getAnalyticsRanking";
export { getMetricRollupIncrements } from "../component/utils/getMetricRollupIncrements";
export { getRollupIncrementKey } from "../component/utils/getRollupIncrementKey";
export { getTopSeriesKeys } from "../component/utils/getTopSeriesKeys";
export { hashString } from "../component/utils/hashString";
export { listDailyBuckets } from "../component/utils/listDailyBuckets";
export { toAggregateInput } from "../component/utils/toAggregateInput";

// LIMITS
export { ANALYTICS_LIMITS } from "../shared/analyticsLimits";

// SCOPES
export {
  ANALYTICS_RESOURCE_SCOPE_SEPARATOR,
  ANALYTICS_SCOPE_SEPARATOR,
  createAnalyticsResourceScope,
  createAnalyticsResourceScopeId,
  createAnalyticsResourceScopeInput,
  createAnalyticsScopeId,
  type typesAnalyticsResourceScope,
  type typesAnalyticsResourceScopeInput,
} from "../shared/analyticsScopes";

// CRONS
export { registerAnalyticsCrons } from "./crons/registerAnalyticsCrons";

// TYPES
export {
  ANALYTICS_TRAFFIC_MODE,
  type typesAnalyticsAggregation,
  type typesAnalyticsEventConfig,
  type typesAnalyticsMetricConfig,
  type typesAnalyticsMetricScope,
  type typesAnalyticsOperation,
  type typesAnalyticsPropertyType,
  type typesAnalyticsPropertyValue,
  type typesAnalyticsScopeInput,
  type typesAnalyticsScopeType,
  type typesAnalyticsSettings,
  type typesAnalyticsTrafficMode,
  type typesAnalyticsUnit,
  type typesCreateAnalyticsApiOptions,
  type typesCreateAnalyticsApiOptionsForConfig,
  type typesTrackEventInput,
  type typesTrackEventsInput,
  type typesTypedTrackBatchInputForEvents,
  type typesTypedTrackEventInput,
  type typesTypedTrackEventInputForEvents,
  type typesTypedTrackEventOptions,
  type typesUnifiedTrackInputForEvents,
} from "./types/types";

// SCHEMAS
export {
  propertyValueValidator,
  scopeInputValidator,
  scopeValidator,
  sourceValidator,
  subjectValidator,
} from "./schemas/schemas";

export type QueryCtx = Pick<
  GenericQueryCtx<GenericDataModel>,
  "auth" | "runQuery"
>;
export type MutationCtx = Pick<
  GenericMutationCtx<GenericDataModel>,
  "auth" | "runMutation"
>;
