// TYPES
import type { typesAnalyticsFunnelsConfig } from "../../shared/types/config.js";

export function internalSerializeFunnels(
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
