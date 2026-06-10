// UTILS
import {
	getQueryBucketStart,
	listQueryBuckets,
} from "./analyticsDateRangeUtils.js";
import { internalReduceMetricRollupRows } from "./metricAggregationUtils.js";

// TYPES
import type {
	typesAnalyticsAggregation,
	typesAnalyticsBucketUnit,
} from "../types/primitives.js";

type typesRollupRow = {
	bucketStart: number;
	dimensionValue: string;
	value: number;
	sampleCount?: number;
};

type typesActorClaimRow = {
	bucketStart: number;
	dimensionValue: string;
	actorKey: string;
};

export function internalBuildBucketedTimeSeriesPoints(args: {
	from: number;
	to: number;
	bucketUnit: typesAnalyticsBucketUnit;
	timeZone: string;
	aggregation: typesAnalyticsAggregation;
	rows: typesRollupRow[];
	seriesKeys: string[];
	metricName: string;
	groupBy?: string;
	fill: boolean;
}) {
	const buckets = args.fill
		? listQueryBuckets(args.from, args.to, args.bucketUnit, args.timeZone)
		: [
				...new Set(
					args.rows.map((row) =>
						getQueryBucketStart(row.bucketStart, args.bucketUnit, args.timeZone),
					),
				),
			].sort((a, b) => a - b);

	const seriesKeySet = new Set(args.seriesKeys);
	const data = buckets.map((bucketStart) => {
		const point: Record<string, number> = { date: bucketStart };
		for (const key of args.seriesKeys) {
			point[key] = 0;
		}
		return point;
	});
	const pointByBucket = new Map(data.map((point) => [point.date, point]));

	const groupedRows = new Map<
		string,
		Array<{ bucketStart: number; value: number; sampleCount?: number }>
	>();

	for (const row of args.rows) {
		const queryBucket = getQueryBucketStart(
			row.bucketStart,
			args.bucketUnit,
			args.timeZone,
		);
		const point = pointByBucket.get(queryBucket);
		if (!point) continue;

		const seriesKey = args.groupBy ? row.dimensionValue : args.metricName;
		if (!seriesKeySet.has(seriesKey)) continue;

		const key = `${queryBucket}:${seriesKey}`;
		const bucketRows = groupedRows.get(key) ?? [];
		bucketRows.push(row);
		groupedRows.set(key, bucketRows);
	}

	for (const [key, bucketRows] of groupedRows) {
		const separatorIndex = key.indexOf(":");
		const queryBucket = Number(key.slice(0, separatorIndex));
		const seriesKey = key.slice(separatorIndex + 1);
		const point = pointByBucket.get(queryBucket);
		if (!point) continue;

		point[seriesKey] = internalReduceMetricRollupRows(
			args.aggregation,
			bucketRows,
		);
	}

	return { data, buckets };
}

export function internalBuildDistinctActorTimeSeriesPoints(args: {
	from: number;
	to: number;
	bucketUnit: typesAnalyticsBucketUnit;
	timeZone: string;
	claims: typesActorClaimRow[];
	seriesKeys: string[];
	metricName: string;
	groupBy?: string;
	fill: boolean;
}) {
	const buckets = args.fill
		? listQueryBuckets(args.from, args.to, args.bucketUnit, args.timeZone)
		: [
				...new Set(
					args.claims.map((claim) =>
						getQueryBucketStart(
							claim.bucketStart,
							args.bucketUnit,
							args.timeZone,
						),
					),
				),
			].sort((a, b) => a - b);

	const seriesKeySet = new Set(args.seriesKeys);
	const data = buckets.map((bucketStart) => {
		const point: Record<string, number> = { date: bucketStart };
		for (const key of args.seriesKeys) {
			point[key] = 0;
		}
		return point;
	});
	const pointByBucket = new Map(data.map((point) => [point.date, point]));

	const actorsByBucketAndSeries = new Map<string, Set<string>>();

	for (const claim of args.claims) {
		const queryBucket = getQueryBucketStart(
			claim.bucketStart,
			args.bucketUnit,
			args.timeZone,
		);
		if (!pointByBucket.has(queryBucket)) continue;

		const seriesKey = args.groupBy ? claim.dimensionValue : args.metricName;
		if (!seriesKeySet.has(seriesKey)) continue;

		const key = `${queryBucket}:${seriesKey}`;
		const actors = actorsByBucketAndSeries.get(key) ?? new Set<string>();
		actors.add(claim.actorKey);
		actorsByBucketAndSeries.set(key, actors);
	}

	for (const [key, actors] of actorsByBucketAndSeries) {
		const separatorIndex = key.indexOf(":");
		const queryBucket = Number(key.slice(0, separatorIndex));
		const seriesKey = key.slice(separatorIndex + 1);
		const point = pointByBucket.get(queryBucket);
		if (!point) continue;
		point[seriesKey] = actors.size;
	}

	return { data, buckets };
}

export function internalCountDistinctActorsInQueryRange(args: {
	from: number;
	to: number;
	bucketUnit: typesAnalyticsBucketUnit;
	timeZone: string;
	claims: typesActorClaimRow[];
}) {
	if (args.bucketUnit === "day") {
		return new Set(args.claims.map((claim) => claim.actorKey)).size;
	}

	const allowedBuckets = new Set(
		listQueryBuckets(args.from, args.to, args.bucketUnit, args.timeZone),
	);
	const actors = new Set<string>();

	for (const claim of args.claims) {
		const queryBucket = getQueryBucketStart(
			claim.bucketStart,
			args.bucketUnit,
			args.timeZone,
		);
		if (!allowedBuckets.has(queryBucket)) continue;
		actors.add(claim.actorKey);
	}

	return actors.size;
}
