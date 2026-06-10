// TYPES
import type { Auth } from "convex/server";
import type {
	typesAnalyticsOperation,
	typesCreateAnalyticsApiOptions,
} from "../../shared/types/operations.js";

export async function internalAuthorize(
	options: typesCreateAnalyticsApiOptions,
	ctx: { auth: Auth },
	operation: typesAnalyticsOperation,
) {
	await options.authorize?.(ctx, operation);
}
