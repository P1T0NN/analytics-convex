// CONSTANTS
import { DAY_MS, HOUR_MS } from "../constants.js";

// UTILS
import { startOfUtcDay } from "./analyticsDateRangeUtils.js";

export const ANALYTICS_UTC_TIMEZONE = "UTC";

function internalIsUtcTimeZone(timeZone: string) {
	return timeZone === ANALYTICS_UTC_TIMEZONE || timeZone === "Etc/UTC";
}

export function internalResolveAnalyticsTimezone(
	explicit: string | undefined,
	settingsDefault: string | undefined,
) {
	const timeZone = explicit ?? settingsDefault ?? ANALYTICS_UTC_TIMEZONE;
	internalAssertValidTimeZone(timeZone);
	return timeZone;
}

export function internalAssertValidTimeZone(timeZone: string) {
	if (internalIsUtcTimeZone(timeZone)) {
		return;
	}

	try {
		internalGetFormatter(timeZone);
	} catch {
		throw new Error(`Invalid IANA timezone: ${timeZone}`);
	}
}

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function internalGetFormatter(timeZone: string) {
	let formatter = formatterCache.get(timeZone);
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-US", {
			timeZone,
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hourCycle: "h23",
		});
		formatterCache.set(timeZone, formatter);
	}
	return formatter;
}

type typesWallClock = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
	second: number;
};

/** Wall-clock date and time of `timestamp` as seen in `timeZone`. */
function internalGetWallClock(
	timestamp: number,
	timeZone: string,
): typesWallClock {
	if (internalIsUtcTimeZone(timeZone)) {
		const date = new Date(timestamp);
		return {
			year: date.getUTCFullYear(),
			month: date.getUTCMonth() + 1,
			day: date.getUTCDate(),
			hour: date.getUTCHours(),
			minute: date.getUTCMinutes(),
			second: date.getUTCSeconds(),
		};
	}

	const parts = internalGetFormatter(timeZone).formatToParts(
		new Date(timestamp),
	);
	const read = (type: string) =>
		Number(parts.find((part) => part.type === type)?.value);

	return {
		year: read("year"),
		month: read("month"),
		day: read("day"),
		hour: read("hour"),
		minute: read("minute"),
		second: read("second"),
	};
}

export function internalGetTimeZoneDateParts(
	timestamp: number,
	timeZone: string,
) {
	const { year, month, day } = internalGetWallClock(timestamp, timeZone);
	return { year, month, day };
}

export function internalGetTimeZoneTimeParts(
	timestamp: number,
	timeZone: string,
) {
	const { hour, minute, second } = internalGetWallClock(timestamp, timeZone);
	return { hour, minute, second };
}

/** Zone offset at `timestamp` in ms, positive east of UTC. Second precision. */
function internalGetTimeZoneOffsetMs(timestamp: number, timeZone: string) {
	const truncated = Math.floor(timestamp / 1000) * 1000;
	const wall = internalGetWallClock(truncated, timeZone);
	const wallAsUtc = Date.UTC(
		wall.year,
		wall.month - 1,
		wall.day,
		wall.hour,
		wall.minute,
		wall.second,
	);
	return wallAsUtc - truncated;
}

function internalLocalDateNumber(timestamp: number, timeZone: string) {
	const wall = internalGetWallClock(timestamp, timeZone);
	return wall.year * 10_000 + wall.month * 100 + wall.day;
}

/**
 * UTC instant at which the local calendar date (year, month, day) begins in
 * `timeZone` — i.e. local midnight, or the first existing instant of that
 * date when midnight is skipped by a DST transition.
 *
 * Month/day may overflow their ranges (e.g. month 13); they are normalized
 * with `Date.UTC` calendar semantics.
 */
function internalTimeZoneDateStart(
	year: number,
	month: number,
	day: number,
	timeZone: string,
) {
	const targetAsUtc = Date.UTC(year, month - 1, day);
	if (internalIsUtcTimeZone(timeZone)) {
		return targetAsUtc;
	}

	const target = new Date(targetAsUtc);
	const targetNumber =
		target.getUTCFullYear() * 10_000 +
		(target.getUTCMonth() + 1) * 100 +
		target.getUTCDate();

	// Two offset passes resolve local midnight exactly whenever it exists,
	// including across DST transitions earlier in the day.
	let candidate = targetAsUtc - internalGetTimeZoneOffsetMs(targetAsUtc, timeZone);
	candidate = targetAsUtc - internalGetTimeZoneOffsetMs(candidate, timeZone);

	if (
		internalLocalDateNumber(candidate, timeZone) === targetNumber &&
		internalLocalDateNumber(candidate - 1000, timeZone) < targetNumber
	) {
		return candidate;
	}

	// Local midnight does not exist (DST skips over it) or the passes
	// oscillated. Binary-search the first instant whose local date reaches
	// the target. Offsets span -12h..+14h, so this window always brackets it.
	let low = targetAsUtc - 15 * HOUR_MS;
	let high = targetAsUtc + 13 * HOUR_MS;

	while (high - low > 1000) {
		const mid = low + Math.floor((high - low) / 2000) * 1000;
		if (internalLocalDateNumber(mid, timeZone) >= targetNumber) {
			high = mid;
		} else {
			low = mid;
		}
	}

	return high;
}

/** UTC ms for the start of the calendar day in `timeZone` containing `timestamp`. */
export function startOfTimeZoneDay(timestamp: number, timeZone: string) {
	if (internalIsUtcTimeZone(timeZone)) {
		return startOfUtcDay(timestamp);
	}

	const wall = internalGetWallClock(timestamp, timeZone);
	return internalTimeZoneDateStart(wall.year, wall.month, wall.day, timeZone);
}

/** ISO week (Monday) start in the given timezone. */
export function startOfTimeZoneWeek(timestamp: number, timeZone: string) {
	const wall = internalGetWallClock(timestamp, timeZone);
	// Pure calendar arithmetic on the local date to find its Monday.
	const localDateAsUtc = Date.UTC(wall.year, wall.month - 1, wall.day);
	const weekday = new Date(localDateAsUtc).getUTCDay();
	const isoWeekday = weekday === 0 ? 7 : weekday;
	const monday = new Date(localDateAsUtc - (isoWeekday - 1) * DAY_MS);

	return internalTimeZoneDateStart(
		monday.getUTCFullYear(),
		monday.getUTCMonth() + 1,
		monday.getUTCDate(),
		timeZone,
	);
}

export function startOfTimeZoneMonth(timestamp: number, timeZone: string) {
	const wall = internalGetWallClock(timestamp, timeZone);
	return internalTimeZoneDateStart(wall.year, wall.month, 1, timeZone);
}

/** Start of the calendar month `months` after the month containing `bucketStart`. */
export function addTimeZoneMonths(
	bucketStart: number,
	months: number,
	timeZone: string,
) {
	const wall = internalGetWallClock(bucketStart, timeZone);
	return internalTimeZoneDateStart(wall.year, wall.month + months, 1, timeZone);
}

/** Start of the calendar day in `timeZone` that follows the day starting at `dayStart`. */
export function nextTimeZoneDayStart(dayStart: number, timeZone: string) {
	if (internalIsUtcTimeZone(timeZone)) {
		return dayStart + DAY_MS;
	}

	// Noon-ish of the next local day, floored to its start. Robust against
	// 23h/25h DST days.
	return startOfTimeZoneDay(dayStart + DAY_MS + 12 * HOUR_MS, timeZone);
}

/** Start of the ISO week in `timeZone` that follows the week starting at `weekStart`. */
export function nextTimeZoneWeekStart(weekStart: number, timeZone: string) {
	if (internalIsUtcTimeZone(timeZone)) {
		return weekStart + 7 * DAY_MS;
	}

	return startOfTimeZoneWeek(weekStart + 7 * DAY_MS + 12 * HOUR_MS, timeZone);
}
