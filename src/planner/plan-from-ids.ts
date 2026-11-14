import { listExperiences } from "../services/store";
import { planItinerary, type Plan, type PlanItem } from "./plan-itinerary";

/** Looks durations up from the inventory, so the LLM never supplies them. */
export function planFromIds(delayMinutes: number, itemIds: string[]): Plan {
    const inventory = listExperiences();
    const items: PlanItem[] = [];
    const unknown: string[] = [];

    for (const id of itemIds) {
        const e = inventory.find((x) => x.id === id);
        if (e)
            items.push({
                id: e.id,
                name: e.name,
                kind: e.kind,
                durationMinutes: e.durationMinutes,
            });
        else unknown.push(id);
    }

    const plan = planItinerary({ delayMinutes, items });
    return {
        ...plan,
        skipped: [
            ...plan.skipped,
            ...unknown.map((id) => ({ id, reason: "NOT_FOUND" as const })),
        ],
    };
}
