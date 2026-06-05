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

// LIMITS
export { ANALYTICS_LIMITS } from "../shared/analyticsLimits";

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
