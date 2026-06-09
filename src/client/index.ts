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
export { trackAnalytics } from "./helpers/trackAnalytics";
export { trackAnalyticsEvent } from "./helpers/trackAnalyticsEvent";
export { trackAnalyticsEvents } from "./helpers/trackAnalyticsEvents";

// PURE UTILS
export {
	computeConversionRatePercent,
	computePercentOfGoal,
	evaluateMetricLabel,
} from "../shared/utils/analyticsEvaluationUtils";
export {
	compareScores,
	getAnalyticsRanking,
} from "../shared/utils/analyticsRankingUtils";

// LIMITS
export {
	ANALYTICS_LIMITS,
	ANALYTICS_METRIC_LABELS,
	ANALYTICS_RESOURCE_SCOPE_SEPARATOR,
	ANALYTICS_SCOPE_SEPARATOR,
	ANALYTICS_TRAFFIC_MODE,
} from "../shared/constants";

// SCOPES
export {
	createAnalyticsResourceScope,
	createAnalyticsResourceScopeId,
	createAnalyticsResourceScopeInput,
	createAnalyticsScopeId,
} from "../shared/utils/analyticsScopesUtils";

// CRONS
export { registerAnalyticsCrons } from "./crons/registerAnalyticsCrons";

// TYPES
export {
	type typesAnalyticsAggregation,
	type typesAnalyticsDateRange,
	type typesAnalyticsEventConfig,
	type typesAnalyticsEventConfigRuntime,
	type typesAnalyticsMetricConfig,
	type typesAnalyticsMetricConfigRuntime,
	type typesAnalyticsMetricLabel,
	type typesAnalyticsMetricScope,
	type typesAnalyticsOperation,
	type typesAnalyticsPropertyType,
	type typesAnalyticsPropertyValue,
	type typesAnalyticsRankingDirection,
	type typesAnalyticsRankingTieBreaker,
	type typesAnalyticsResolvedScope,
	type typesAnalyticsResourceScope,
	type typesAnalyticsResourceScopeInput,
	type typesAnalyticsRuntimeConfig,
	type typesAnalyticsScopeInput,
	type typesAnalyticsScopeType,
	type typesAnalyticsSettings,
	type typesAnalyticsTrafficMode,
	type typesAnalyticsUnit,
	type typesAnalyticsUnique,
	type typesAnalyticsFunnelConfig,
	type typesAnalyticsFunnelsConfig,
	type typesCreateAnalyticsApiOptions,
	type typesCreateAnalyticsApiOptionsForConfig,
	type typesDashboardMetricConversion,
	type typesDashboardMetricGoal,
	type typesDashboardMetricItem,
	type typesDashboardMetricsResponse,
	type typesFunnelConversionResponse,
	type typesGetAnalyticsRankingArgs,
	type typesMetricComparisonEvaluationConfig,
	type typesMetricComparisonInput,
	type typesMetricComparisonResponse,
	type typesMetricConversionEvaluationConfig,
	type typesMetricConversionInput,
	type typesMetricConversionResponse,
	type typesMetricEvaluationConfig,
	type typesMetricEvaluationConversion,
	type typesMetricEvaluationGoal,
	type typesMetricEvaluationReason,
	type typesMetricEvaluationResponse,
	type typesMetricEvaluationResult,
	type typesMetricGoalEvaluationConfig,
	type typesMetricGoalInput,
	type typesMetricInverseRateEvaluationConfig,
	type typesMetricSummaryResponse,
	type typesTrackEventInput,
	type typesTrackEventsInput,
	type typesTypedTrackBatchInputForEvents,
	type typesTypedTrackEventInput,
	type typesTypedTrackEventInputForEvents,
	type typesTypedTrackEventOptions,
	type typesUnifiedTrackInputForEvents,
	type typesWriteTrackResult,
} from "../shared/types/index.js";

export type {
	typesBreakdownArgs,
	typesDashboardMetricsArgs,
	typesDimensionNameForMetric,
	typesFunnelConversionArgs,
	typesMetricComparisonArgs,
	typesMetricConversionArgs,
	typesMetricEvaluationArgs,
	typesMetricName,
	typesMetricRangeArgs,
	typesMetricTotalsByDimensionArgs,
	typesQueryCtx,
	typesTimeSeriesArgs,
	typesTopDimensionValueArgs,
} from "../shared/types/queryArgs.js";

// SCHEMAS
export {
	propertyValueValidator,
	scopeInputValidator,
	scopeValidator,
	sourceValidator,
	subjectValidator,
	uniqueEventValidator,
	uniqueScopeValidator,
} from "./schemas/schemas";

export type QueryCtx = Pick<
	GenericQueryCtx<GenericDataModel>,
	"auth" | "runQuery"
>;
export type MutationCtx = Pick<
	GenericMutationCtx<GenericDataModel>,
	"auth" | "runMutation"
>;
