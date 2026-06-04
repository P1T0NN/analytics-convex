// UTILS
import { badRequest } from "../errors/errors.js";

export function assertAtMost(count: number, max: number, field: string) {
	if (count > max) {
		badRequest(`${field} must include at most ${max} items.`);
	}
}

export function assertNumberAtMost(value: number, max: number, field: string) {
	if (value > max) {
		badRequest(`${field} must be at most ${max}.`);
	}
}

export function assertStringLength(value: string, max: number, field: string) {
	if (value.length > max) {
		badRequest(`${field} must be at most ${max} characters.`);
	}
}

export function assertFiniteNumber(value: number, field: string) {
	if (!Number.isFinite(value)) {
		badRequest(`${field} must be a finite number.`);
	}
}
