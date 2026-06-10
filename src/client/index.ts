// LIBRARIES
import type {
	GenericDataModel,
	GenericMutationCtx,
	GenericQueryCtx,
} from "convex/server";

// API
export { defineAnalytics } from "./api/defineAnalytics";

// BUILDERS
export { event } from "./builders/event";
export { count, sum, avg, min, max, distinctActors } from "./builders/metric";
export { property } from "./builders/property";

// PURE UTILS
export {
	analyticsDayRangeIncludesToday,
	countUtcDaysInRange,
	createAnalyticsCompletedDayRange,
	createAnalyticsDayRange,
	createAnalyticsTodayRange,
	normalizeAnalyticsDayRange,
	previousAnalyticsDayRange,
	previousAnalyticsPeriodRange,
	startOfUtcDay,
	startOfUtcWeek,
	startOfUtcMonth,
	getQueryBucketStart,
	listQueryBuckets,
} from "../shared/utils/analyticsDateRangeUtils";
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

// TYPES
export type {
	typesAnalyticsAggregation,
	typesAnalyticsPropertyType,
	typesAnalyticsPropertyValue,
	typesAnalyticsRollupGranularity,
	typesAnalyticsBucketUnit,
	typesAnalyticsTrafficMode,
	typesAnalyticsUnit,
} from "../shared/types/primitives.js";
export type {
	typesAnalyticsDateRange,
	typesDashboardMetricConversion,
	typesDashboardMetricGoal,
	typesDashboardMetricItem,
	typesDashboardMetricsResponse,
	typesFunnelConversionResponse,
	typesJourneyConversionResponse,
	typesMetricComparisonResponse,
	typesMetricConversionResponse,
	typesMetricEvaluationConversion,
	typesMetricEvaluationGoal,
	typesMetricEvaluationResponse,
	typesMetricSummaryResponse,
} from "../shared/types/queries.js";
export type {
	typesAnalyticsEventConfig,
	typesAnalyticsEventConfigRuntime,
	typesAnalyticsFunnelConfig,
	typesAnalyticsFunnelsConfig,
	typesAnalyticsJourneyConfig,
	typesAnalyticsJourneysConfig,
	typesAnalyticsMetricConfig,
	typesAnalyticsMetricConfigRuntime,
	typesAnalyticsRuntimeConfig,
} from "../shared/types/config.js";
export type {
	typesAnalyticsMetricLabel,
	typesMetricComparisonEvaluationConfig,
	typesMetricComparisonInput,
	typesMetricConversionEvaluationConfig,
	typesMetricConversionInput,
	typesMetricEvaluationConfig,
	typesMetricEvaluationReason,
	typesMetricEvaluationResult,
	typesMetricGoalEvaluationConfig,
	typesMetricGoalInput,
	typesMetricInverseRateEvaluationConfig,
} from "../shared/types/evaluation.js";
export type {
	typesAnalyticsMetricScope,
	typesAnalyticsResolvedScope,
	typesAnalyticsResourceScope,
	typesAnalyticsResourceScopeInput,
	typesAnalyticsScopeInput,
	typesAnalyticsScopeType,
} from "../shared/types/scopes.js";
export type {
	typesAnalyticsOperation,
} from "../shared/types/operations.js";
export type {
	typesAnalyticsRankingDirection,
	typesAnalyticsRankingTieBreaker,
	typesGetAnalyticsRankingArgs,
} from "../shared/types/ranking.js";
export type {
	typesAnalyticsSettings,
} from "../shared/types/settings.js";
export type {
	typesAnalyticsUnique,
	typesTrackEventInput,
	typesTrackEventsInput,
	typesWriteTrackResult,
} from "../shared/types/tracking.js";
export type {
	typesTypedTrackBatchInputForEvents,
	typesTypedTrackEventInput,
	typesTypedTrackEventInputForEvents,
	typesTypedTrackEventOptions,
	typesUnifiedTrackInputForEvents,
} from "../shared/types/typedTracking.js";

export type {
	typesBreakdownArgs,
	typesDashboardMetricsArgs,
	typesDimensionNameForMetric,
	typesFunnelConversionArgs,
	typesJourneyConversionArgs,
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
