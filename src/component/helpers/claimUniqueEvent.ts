// TYPES
import type { MutationCtx } from "../_generated/server";
import type { typesPreparedTrackEventInput } from "../../shared/types/index.js";

export async function internalClaimUniqueEvent(
	ctx: MutationCtx,
	event: typesPreparedTrackEventInput,
): Promise<{ claimed: boolean }> {
	if (!event.unique) {
		return { claimed: true };
	}

	const { unique } = event;
	const existing = await ctx.db
		.query("analyticsUniqueEvents")
		.withIndex("by_key", (q) => q.eq("key", unique.key))
		.first();

	if (existing) {
		return { claimed: false };
	}

	await ctx.db.insert("analyticsUniqueEvents", {
		key: unique.key,
		eventName: event.name,
		actorId: event.actorId,
		organizationId: event.organizationId,
		subject: event.subject,
		createdAt: Date.now(),
	});

	return { claimed: true };
}

export function internalWithoutUniqueClaim(
	event: typesPreparedTrackEventInput,
): typesPreparedTrackEventInput {
	const { unique: _unique, ...rest } = event;
	return rest;
}
