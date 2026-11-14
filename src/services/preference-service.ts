import { preferences } from "../data/preferences";
import type { Preferences } from "../domain/types";

export type PreferenceLookup =
    | { found: true; preferences: Preferences }
    | { found: false; message: string };

export function getPreferences(userId: string): PreferenceLookup {
    const p = preferences[userId];
    return p
        ? { found: true, preferences: p }
        : { found: false, message: `No saved preferences for ${userId}.` };
}
