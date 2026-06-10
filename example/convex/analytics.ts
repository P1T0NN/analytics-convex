import { components } from "./_generated/api";
import {
	defineAnalytics,
	event,
	property,
} from "../../dist/client/index.js";

export const analytics = defineAnalytics(components.analytics, {
	events: {
		featureUsed: event("feature.used", {
			label: "Feature used",
			properties: {
				feature: property.string({ required: true }),
				plan: property.string(),
				value: property.number(),
			},
		}),
		purchaseCompleted: event("purchase.completed", {
			label: "Purchase completed",
			properties: {
				plan: property.string({ required: true }),
				amount: property.number({ required: true }),
			},
		}),
	},
	metrics: ({ count, sum }) => ({
		featureUses: count("Feature uses")
			.from("feature.used")
			.by("feature", "plan")
			.trafficMode("mediumVolume"),
		featureValue: sum("Feature value", "currency")
			.from("feature.used")
			.value("value")
			.by("feature", "plan"),
		revenue: sum("Revenue", "currency")
			.from("purchase.completed")
			.value("amount")
			.by("plan")
			.trafficMode("highVolume"),
	}),
	settings: {
		rawEventRetentionDays: 30,
	},
});

export const {
	writeTrack,
	fetchSummary,
	fetchTimeSeries,
	fetchBreakdown,
} = analytics.client;

export const {
	processPendingHighVolumeAnalyticsEvents,
	purgeStaleAnalyticsEvents,
} = analytics.crons;
