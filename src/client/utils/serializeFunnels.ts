// TYPES
import type { typesAnalyticsFunnelsConfig } from "../../shared/analyticsFunnels";

export function serializeFunnels(
	funnels?: typesAnalyticsFunnelsConfig,
): typesAnalyticsFunnelsConfig | undefined {
	if (!funnels) return undefined;

	return Object.fromEntries(
		Object.entries(funnels).map(([name, funnel]) => [
			name,
			{
				label: funnel.label,
				steps: [...funnel.steps],
			},
		]),
	);
}
