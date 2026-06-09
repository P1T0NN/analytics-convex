// TYPES
import type { Auth } from "convex/server";
import type {
	typesCreateAnalyticsApiOptions,
	typesAnalyticsOperation,
} from "../../shared/types/index.js";

export async function internalAuthorize(
	options: typesCreateAnalyticsApiOptions,
	ctx: { auth: Auth },
	operation: typesAnalyticsOperation,
) {
	await options.authorize?.(ctx, operation);
}
