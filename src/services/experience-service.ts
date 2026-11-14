import type { ExperienceKind } from "../domain/types";
import { listExperiences } from "./store";

export interface ExperienceView {
    id: string;
    name: string;
    kind: ExperienceKind;
    terminal: string;
    rating: number;
    occupancyPercent: number;
    availableSpots: number;
    durationMinutes: number;
    tags: string[];
}

export function searchExperiences(query: {
    airport: string;
    kind?: ExperienceKind;
    maxDurationMinutes?: number;
    includeFull?: boolean;
}): ExperienceView[] {
    const airport = query.airport.trim().toUpperCase();
    return listExperiences()
        .filter((e) => e.airport === airport)
        .filter((e) => !query.kind || e.kind === query.kind)
        .filter(
            (e) =>
                query.maxDurationMinutes === undefined ||
                e.durationMinutes <= query.maxDurationMinutes,
        )
        .filter((e) => query.includeFull || e.booked < e.capacity)
        .map((e) => ({
            id: e.id,
            name: e.name,
            kind: e.kind,
            terminal: e.terminal,
            rating: e.rating,
            occupancyPercent: Math.round((e.booked / e.capacity) * 100),
            availableSpots: e.capacity - e.booked,
            durationMinutes: e.durationMinutes,
            tags: e.tags,
        }))
        .sort((a, b) => b.rating - a.rating);
}
