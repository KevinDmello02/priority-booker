import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { maybeFail } from "../resilience/faults";
import { withRetry } from "../resilience/retry";
import { getFlightStatus } from "../services/flight-service";

export const flightStatusTool = createTool({
    id: "get-flight-status",
    description:
        "Get the current status of a flight by flight number (e.g. AI202): on-time, delayed (with delay in minutes) or cancelled.",
    inputSchema: z.object({
        flightNumber: z.string().describe("Flight number such as AI202"),
    }),
    outputSchema: z.object({
        found: z.boolean(),
        message: z.string().optional(),
        flight: z
            .object({
                flightNumber: z.string(),
                airline: z.string(),
                origin: z.string(),
                destination: z.string(),
                scheduledDeparture: z.string(),
                status: z.enum(["on-time", "delayed", "cancelled"]),
                delayMinutes: z.number(),
            })
            .optional(),
    }),
    execute: async ({ flightNumber }) => {
        try {
            return await withRetry(
                () => {
                    maybeFail("flight");
                    return getFlightStatus(flightNumber);
                },
                { retries: 1, label: "flight status" },
            );
        } catch {
            return {
                found: false,
                message:
                    "The flight status service is unavailable right now. Do not guess a status or a delay. Tell the traveller and stop.",
            };
        }
    },
});
