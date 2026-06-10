import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { analytics } from "./analytics";

export const useFeature = mutation({
	args: {
		feature: v.string(),
		plan: v.string(),
		value: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await analytics.track(ctx, {
			name: "feature.used",
			properties: {
				feature: args.feature,
				plan: args.plan,
				...(args.value !== undefined ? { value: args.value } : {}),
			},
			source: { type: "server" },
		});
	},
});

export const recordPurchase = mutation({
	args: {
		plan: v.string(),
		amount: v.number(),
	},
	handler: async (ctx, args) => {
		await analytics.track(ctx, {
			name: "purchase.completed",
			properties: {
				plan: args.plan,
				amount: args.amount,
			},
			source: { type: "server" },
		});
	},
});

export const featureUsesSummary = query({
	args: {},
	handler: async (ctx) => {
		const now = Date.now();
		const from = now - 30 * 24 * 60 * 60 * 1000;

		return await analytics.fetchSummary(ctx, {
			metric: "featureUses",
			from,
			to: now,
		});
	},
});
