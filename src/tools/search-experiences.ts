import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { searchExperiences } from "../services/experience-service";

export const searchExperiencesTool = createTool({
    id: "search-experiences",
    description:
        "Search airport lounges, spas, sleep pods and cafes. Returns rating, current occupancy percent, available spots and typical duration. Sorted by rating. Full venues are hidden unless includeFull is true.",
    inputSchema: z.object({
        airport: z.string().describe("IATA airport code, e.g. BOM"),
        kind: z.enum(["lounge", "spa", "sleep-pod", "cafe"]).optional(),
        maxDurationMinutes: z.number().int().positive().optional(),
        includeFull: z.boolean().optional(),
    }),
    outputSchema: z.object({
        results: z.array(
            z.object({
                id: z.string(),
                name: z.string(),
                kind: z.enum(["lounge", "spa", "sleep-pod", "cafe"]),
                terminal: z.string(),
                rating: z.number(),
                occupancyPercent: z.number(),
                availableSpots: z.number(),
                durationMinutes: z.number(),
                tags: z.array(z.string()),
            }),
        ),
    }),
    execute: async (input) => ({ results: searchExperiences(input) }),
});
