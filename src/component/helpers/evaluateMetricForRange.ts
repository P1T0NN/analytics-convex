// HELPERS
import {
	fetchMetricTotalsBatch,
	readMetricTotalFromCache,
	type typesMetricTotalRequest,
} from "./metricTotalCache";
import { getMetricTotalForRange } from "./rollupReads";

// SHARED
import {
	computeConversionRatePercent,
	evaluateMetricLabel,
} from "../../shared/analyticsEvaluation";

// TYPES
import type { QueryCtx } from "../_generated/server";
import type {
	typesAnalyticsConfigState,
	typesAnalyticsMetricConfig,
	typesAnalyticsScope,
	typesMetricEvaluationConfig,
	typesMetricEvaluationResult,
} from "../types/types";

type typesMetricEvaluationBuildArgs = {
	metric: string;
	metricConfig: typesAnalyticsMetricConfig;
	evaluation: typesMetricEvaluationConfig | undefined;
	scope: typesAnalyticsScope;
	from: number;
	to: number;
};

type typesComparisonBlock = {
	current: number;
	previous: number;
	delta: number;
	deltaPercent?: number;
};

type typesMetricEvaluationBuildResult = {
	value: number;
	evaluation: typesMetricEvaluationResult;
	comparison?: typesComparisonBlock;
	conversion?: {
		numerator: number;
		denominator: number;
		ratePercent?: number;
		denominatorMetric?: string;
	};
};

function buildComparisonBlock(args: {
	value: number;
	previous: number;
}): typesComparisonBlock {
	const delta = args.value - args.previous;
	const deltaPercent =
		args.previous !== 0 ? (delta / args.previous) * 100 : undefined;

	return {
		current: args.value,
		previous: args.previous,
		delta,
		deltaPercent,
	};
}

export function buildMetricEvaluationFromCache(
	cache: Map<string, number>,
	args: typesMetricEvaluationBuildArgs,
): typesMetricEvaluationBuildResult {
	const value = readMetricTotalFromCache(cache, args.scope, {
		metric: args.metric,
		from: args.from,
		to: args.to,
	});

	if (!args.evaluation) {
		return {
			value,
			evaluation: {
				label: "neutral",
				reason: "no_evaluation_config",
			},
		};
	}

	if (args.evaluation.kind === "comparison") {
		const rangeMs = args.to - args.from;
		const previous = readMetricTotalFromCache(cache, args.scope, {
			metric: args.metric,
			from: args.from - rangeMs,
			to: args.from,
		});
		const comparison = buildComparisonBlock({ value, previous });

		return {
			value,
			comparison,
			evaluation: evaluateMetricLabel({
				kind: "comparison",
				comparison,
				config: args.evaluation,
			}),
		};
	}

	const denominatorMetric = args.evaluation.denominatorMetric;
	const denominator = readMetricTotalFromCache(cache, args.scope, {
		metric: denominatorMetric,
		from: args.from,
		to: args.to,
	});

	const conversion = {
		numerator: value,
		denominator,
		ratePercent: computeConversionRatePercent({
			numerator: value,
			denominator,
		}),
		denominatorMetric,
	};

	return {
		value,
		conversion,
		evaluation:
			args.evaluation.kind === "conversion"
				? evaluateMetricLabel({
						kind: "conversion",
						conversion,
						config: args.evaluation,
					})
				: evaluateMetricLabel({
						kind: "inverseRate",
						conversion,
						config: args.evaluation,
					}),
	};
}

export async function buildMetricEvaluationResult(
	ctx: QueryCtx,
	config: typesAnalyticsConfigState,
	args: typesMetricEvaluationBuildArgs,
): Promise<typesMetricEvaluationBuildResult> {
	const requests: typesMetricTotalRequest[] = [
		{
			metric: args.metric,
			from: args.from,
			to: args.to,
		},
	];

	if (args.evaluation?.kind === "comparison") {
		const rangeMs = args.to - args.from;
		requests.push({
			metric: args.metric,
			from: args.from - rangeMs,
			to: args.from,
		});
	}

	if (
		args.evaluation?.kind === "conversion" ||
		args.evaluation?.kind === "inverseRate"
	) {
		requests.push({
			metric: args.evaluation.denominatorMetric,
			from: args.from,
			to: args.to,
		});
	}

	const cache = await fetchMetricTotalsBatch(
		ctx,
		config,
		args.scope,
		requests,
	);

	return buildMetricEvaluationFromCache(cache, args);
}

export function buildComparisonRange(args: { from: number; to: number }) {
	const rangeMs = args.to - args.from;
	const previousFrom = args.from - rangeMs;
	const previousTo = args.from;

	return {
		current: {
			from: args.from,
			to: args.to,
		},
		previous: {
			from: previousFrom,
			to: previousTo,
		},
	};
}

export async function buildPeriodComparison(
	ctx: QueryCtx,
	config: typesAnalyticsConfigState,
	args: {
		metric: string;
		scope: typesAnalyticsScope;
		from: number;
		to: number;
	},
) {
	const rangeMs = args.to - args.from;
	const [value, previous] = await Promise.all([
		getMetricTotalForRange(ctx, config, {
			metric: args.metric,
			scope: args.scope,
			from: args.from,
			to: args.to,
		}),
		getMetricTotalForRange(ctx, config, {
			metric: args.metric,
			scope: args.scope,
			from: args.from - rangeMs,
			to: args.from,
		}),
	]);

	return buildComparisonBlock({ value, previous });
}

export function collectDashboardMetricTotalRequests(args: {
	metrics: string[];
	metricConfigs: Map<string, typesAnalyticsMetricConfig>;
	from: number;
	to: number;
	includeComparison: boolean;
	includeEvaluation: boolean;
}) {
	const requests: typesMetricTotalRequest[] = [];
	const rangeMs = args.to - args.from;
	const previousFrom = args.from - rangeMs;
	const previousTo = args.from;

	for (const metric of args.metrics) {
		const metricConfig = args.metricConfigs.get(metric);
		if (!metricConfig) continue;

		requests.push({
			metric,
			from: args.from,
			to: args.to,
		});

		const needsPreviousPeriod =
			args.includeComparison ||
			(args.includeEvaluation &&
				metricConfig.evaluation?.kind === "comparison");

		if (needsPreviousPeriod) {
			requests.push({
				metric,
				from: previousFrom,
				to: previousTo,
			});
		}

		if (args.includeEvaluation) {
			const evaluation = metricConfig.evaluation;
			if (
				evaluation?.kind === "conversion" ||
				evaluation?.kind === "inverseRate"
			) {
				requests.push({
					metric: evaluation.denominatorMetric,
					from: args.from,
					to: args.to,
				});
			}
		}
	}

	return requests;
}

export async function buildDashboardMetricsForRange(
	ctx: QueryCtx,
	config: typesAnalyticsConfigState,
	args: {
		metrics: string[];
		scope: typesAnalyticsScope;
		from: number;
		to: number;
		includeComparison?: boolean;
		includeEvaluation?: boolean;
	},
) {
	const includeComparison = args.includeComparison ?? false;
	const includeEvaluation = args.includeEvaluation ?? false;
	const requests = collectDashboardMetricTotalRequests({
		metrics: args.metrics,
		metricConfigs: config.metricByName,
		from: args.from,
		to: args.to,
		includeComparison,
		includeEvaluation,
	});
	const cache = await fetchMetricTotalsBatch(
		ctx,
		config,
		args.scope,
		requests,
	);

	const metrics: Record<
		string,
		{
			value: number;
			label: string;
			unit: typesAnalyticsMetricConfig["unit"];
			comparison?: typesComparisonBlock;
			evaluation?: typesMetricEvaluationResult;
			conversion?: {
				numerator: number;
				denominator: number;
				ratePercent?: number;
				denominatorMetric: string;
			};
		}
	> = {};

	for (const metric of args.metrics) {
		const metricConfig = config.metricByName.get(metric);
		if (!metricConfig) continue;

		const value = readMetricTotalFromCache(cache, args.scope, {
			metric,
			from: args.from,
			to: args.to,
		});

		const item: (typeof metrics)[string] = {
			value,
			label: metricConfig.label,
			unit: metricConfig.unit,
		};

		if (includeComparison) {
			const rangeMs = args.to - args.from;
			const previous = readMetricTotalFromCache(cache, args.scope, {
				metric,
				from: args.from - rangeMs,
				to: args.from,
			});
			item.comparison = buildComparisonBlock({ value, previous });
		}

		if (includeEvaluation) {
			const evaluationResult = buildMetricEvaluationFromCache(cache, {
				metric,
				metricConfig,
				evaluation: metricConfig.evaluation,
				scope: args.scope,
				from: args.from,
				to: args.to,
			});
			item.evaluation = evaluationResult.evaluation;

			if (evaluationResult.comparison && !item.comparison) {
				item.comparison = evaluationResult.comparison;
			}

			if (evaluationResult.conversion) {
				item.conversion = {
					numerator: evaluationResult.conversion.numerator,
					denominator: evaluationResult.conversion.denominator,
					ratePercent: evaluationResult.conversion.ratePercent,
					denominatorMetric:
						evaluationResult.conversion.denominatorMetric ?? "",
				};
			}
		}

		metrics[metric] = item;
	}

	return metrics;
}
