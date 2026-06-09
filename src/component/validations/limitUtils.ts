// UTILS
import { internalBadRequest } from "../errors/errors.js";

export function internalAssertAtMost(count: number, max: number, field: string) {
	if (count > max) {
		internalBadRequest(`${field} must include at most ${max} items.`);
	}
}

export function internalAssertNumberAtMost(value: number, max: number, field: string) {
	if (value > max) {
		internalBadRequest(`${field} must be at most ${max}.`);
	}
}

export function internalAssertStringLength(value: string, max: number, field: string) {
	if (value.length > max) {
		internalBadRequest(`${field} must be at most ${max} characters.`);
	}
}

export function internalAssertFiniteNumber(value: number, field: string) {
	if (!Number.isFinite(value)) {
		internalBadRequest(`${field} must be a finite number.`);
	}
}
