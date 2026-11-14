import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { planForFlight } from "../planner/plan-for-flight";

export const planItineraryTool = createTool({
    id: "plan-itinerary",
    description:
        "Fit chosen experiences into a delayed flight's waiting time. Pass the flight number and the item ids in priority order (best first). The delay is looked up by the tool, so do not pass it. Returns what is scheduled, with start and end minutes, and what was skipped. Only items listed as scheduled may be booked.",
    inputSchema: z.object({
        flightNumber: z.string().describe("Flight number such as AI202"),
        itemIds: z
            .array(z.string())
            .describe("Recommended item ids, best first"),
    }),
    outputSchema: z.object({
        delayMinutes: z.number(),
        windowMinutes: z.number(),
        remainingMinutes: z.number(),
        note: z.string().optional(),
        scheduled: z.array(
            z.object({
                id: z.string(),
                name: z.string(),
                kind: z.string(),
                durationMinutes: z.number(),
                startMinute: z.number(),
                endMinute: z.number(),
            }),
        ),
        skipped: z.array(
            z.object({
                id: z.string(),
                reason: z.enum(["DOES_NOT_FIT", "NOT_FOUND"]),
            }),
        ),
    }),
    execute: async ({ flightNumber, itemIds }) =>
        planForFlight(flightNumber, itemIds),
});
