import { Agent } from "@mastra/core/agent";
import { getModel } from "../config/config";
import { loadWeatherTools } from "../mcp/client";
import { getPreferencesTool } from "../tools/get-preferences";
import { searchExperiencesTool } from "../tools/search-experiences";

export const recommenderAgent = new Agent({
    id: "recommender-agent",
    name: "Recommender",
    description:
        "Recommends airport lounges, spas, sleep pods and cafes for a traveller, based on the airport, the delay length and the traveller preferences. Read-only: it never books.",
    instructions: `You recommend airport experiences. You never book anything.
You are given an airport code, a user id and optionally a delay in minutes.
1. Get the user's preferences.
2. Search experiences at the airport. When there is a delay, ask only for items that fit inside the delay minus 60 minutes.
3. Choose by delay length: under 60 minutes a cafe; 60 to 120 minutes a lounge or spa; over 120 minutes a combination such as a sleep pod plus a lounge or spa.
4. If the user prefers quiet, favour low occupancy. Prefer highly rated options.
5. If weather tools are available, add one short line about the destination weather. If not, skip it.
Reply with a short ranked list. For each item give its id, name, kind, rating, occupancy percent and typical duration in minutes, and a one-line reason.`,
    model: getModel(),
    tools: async () => ({
        getPreferencesTool,
        searchExperiencesTool,
        ...(await loadWeatherTools()),
    }),
});
