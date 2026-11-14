import type { Preferences } from "../domain/types";

export const preferences: Record<string, Preferences> = {
    "demo-user": {
        userId: "demo-user",
        prefersQuiet: true,
        favouriteKinds: ["lounge", "sleep-pod"],
        notes: "Prefers quiet spaces, avoids crowded lounges.",
    },
};
