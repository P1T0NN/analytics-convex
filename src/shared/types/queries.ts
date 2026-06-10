// TYPES
import type { typesMetricComparisonInput, typesMetricEvaluationResult } from "./evaluation.js";
import type { typesAnalyticsUnit } from "./primitives.js";
import type { typesAnalyticsResolvedScope } from "./scopes.js";

export type typesAnalyticsDateRange = {
	from: number;
	to: number;
};

export type typesMetricSummaryResponse = {
	metric: string;
	label: string;
	unit: typesAnalyticsUnit;
	scope: typesAnalyticsResolvedScope;
	value: number;
	range: typesAnalyticsDateRange;
};

export type typesMetricComparisonResponse = {
	metric: string;
	label: string;
	unit: typesAnalyticsUnit;
	scope: typesAnalyticsResolvedScope;
	current: number;
	previous: number;
	delta: number;
	deltaPercent?: number;
	range: {
		current: typesAnalyticsDateRange;
		previous: typesAnalyticsDateRange;
	};
};

export type typesMetricConversionResponse = {
	numeratorMetric: string;
	denominatorMetric: string;
	numerator: number;
	denominator: number;
	ratePercent?: number;
	scope: typesAnalyticsResolvedScope;
	range: typesAnalyticsDateRange;
};

export type typesMetricEvaluationConversion = {
	numerator: number;
	denominator: number;
	ratePercent?: number;
	denominatorMetric?: string;
};

export type typesMetricEvaluationGoal = {
	targetValue: number;
	value: number;
	percentOfGoal?: number;
};

export type typesMetricEvaluationResponse = {
	metric: string;
	label: string;
	unit: typesAnalyticsUnit;
	scope: typesAnalyticsResolvedScope;
	value: number;
	range: typesAnalyticsDateRange;
	evaluation: typesMetricEvaluationResult;
	comparison?: typesMetricComparisonInput;
	conversion?: typesMetricEvaluationConversion;
	goal?: typesMetricEvaluationGoal;
};

export type typesDashboardMetricConversion = {
	numerator: number;
	denominator: number;
	ratePercent?: number;
	denominatorMetric: string;
};

export type typesDashboardMetricGoal = {
	targetValue: number;
	value: number;
	percentOfGoal?: number;
};

export type typesDashboardMetricItem = {
	value: number;
	label: string;
	unit: typesAnalyticsUnit;
	comparison?: typesMetricComparisonInput;
	evaluation?: typesMetricEvaluationResult;
	conversion?: typesDashboardMetricConversion;
	goal?: typesDashboardMetricGoal;
};

export type typesDashboardMetricsResponse = {
	scope: typesAnalyticsResolvedScope;
	range: typesAnalyticsDateRange;
	metrics: Record<string, typesDashboardMetricItem>;
};

export type typesFunnelConversionResponse = {
	funnel: string;
	label: string;
	steps: string[];
	numeratorMetric: string;
	denominatorMetric: string;
	numerator: number;
	denominator: number;
	ratePercent?: number;
	scope: typesAnalyticsResolvedScope;
	range: typesAnalyticsDateRange;
};

export type typesJourneyConversionResponse = {
	journey: string;
	label: string;
	steps: string[];
	stepCounts: number[];
	ratePercents: Array<number | null>;
	scope: typesAnalyticsResolvedScope;
	range: typesAnalyticsDateRange;
};
