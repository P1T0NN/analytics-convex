// TYPES
import type { Auth } from "convex/server";
import type {
	typesCreateAnalyticsApiOptions,
	typesAnalyticsOperation,
} from "../types/types";

export async function authorize(
	options: typesCreateAnalyticsApiOptions,
	ctx: { auth: Auth },
	operation: typesAnalyticsOperation,
) {
	await options.authorize?.(ctx, operation);
}
