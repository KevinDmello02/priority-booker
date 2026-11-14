import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getPreferences } from "../services/preference-service";

export const getPreferencesTool = createTool({
    id: "get-preferences",
    description:
        "Get a user's saved airport preferences (quiet spaces, favourite experience types).",
    inputSchema: z.object({ userId: z.string() }),
    outputSchema: z.object({
        found: z.boolean(),
        message: z.string().optional(),
        preferences: z
            .object({
                userId: z.string(),
                prefersQuiet: z.boolean(),
                favouriteKinds: z.array(
                    z.enum(["lounge", "spa", "sleep-pod", "cafe"]),
                ),
                notes: z.string(),
            })
            .optional(),
    }),
    execute: async ({ userId }) => getPreferences(userId),
});
