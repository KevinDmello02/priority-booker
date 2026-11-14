import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { maybeFail } from "../resilience/faults";
import { withRetry } from "../resilience/retry";
import { createBooking } from "../services/store";

export const bookItemTool = createTool({
    id: "book-item",
    description:
        "Book one lounge, spa, sleep pod or cafe slot for a user. Requires user approval. Returns a booking id on success, or a reason (FULL, NOT_FOUND, NOT_PLANNED, UNAVAILABLE) on failure. Use a unique idempotencyKey per intended booking.",
    inputSchema: z.object({
        userId: z.string(),
        itemId: z.string().describe("The id returned by search-experiences"),
        idempotencyKey: z
            .string()
            .describe("Unique key per intended booking, e.g. userId-itemId"),
    }),
    outputSchema: z.object({
        ok: z.boolean(),
        bookingId: z.string().optional(),
        duplicate: z.boolean().optional(),
        reason: z
            .enum(["NOT_FOUND", "FULL", "NOT_PLANNED", "UNAVAILABLE"])
            .optional(),
    }),
    requireApproval: true,
    execute: async (input) => {
        try {
            // Retrying is safe: the idempotency key prevents a second booking.
            const r = await withRetry(
                () => {
                    maybeFail("booking");
                    return createBooking(input);
                },
                { retries: 2, label: "booking" },
            );
            return r.ok
                ? { ok: true, bookingId: r.booking.id, duplicate: r.duplicate }
                : { ok: false, reason: r.reason };
        } catch {
            return { ok: false, reason: "UNAVAILABLE" as const };
        }
    },
});
