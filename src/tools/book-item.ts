import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createBooking } from "../services/store";

export const bookItemTool = createTool({
    id: "book-item",
    description:
        "Book one lounge, spa, sleep pod or cafe slot for a user. Requires user approval. Returns a booking id on success, or a reason (FULL, NOT_FOUND) on failure. Use a unique idempotencyKey per intended booking.",
    inputSchema: z.object({
        userId: z.string(),
        itemId: z.string().describe("The id returned by search-experiences"),
        idempotencyKey: z
            .string()
            .describe(
                "Unique key per intended booking, e.g. userId-itemId-flightNumber",
            ),
    }),
    outputSchema: z.object({
        ok: z.boolean(),
        bookingId: z.string().optional(),
        duplicate: z.boolean().optional(),
        reason: z.enum(["NOT_FOUND", "FULL"]).optional(),
    }),
    requireApproval: true,
    execute: async (input) => {
        const r = createBooking(input);
        return r.ok
            ? { ok: true, bookingId: r.booking.id, duplicate: r.duplicate }
            : { ok: false, reason: r.reason };
    },
});
