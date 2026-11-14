import { Mastra } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { bookerAgent } from "./agents/booker-agent";
import { deskAgent } from "./agents/desk-agent";
import { flightAgent } from "./agents/flight-agent";
import { recommenderAgent } from "./agents/recommender-agent";

// Storage is required for tool approval to suspend and resume.
export const mastra = new Mastra({
    agents: { deskAgent, flightAgent, recommenderAgent, bookerAgent },
    storage: new LibSQLStore({ id: "mastra-storage", url: ":memory:" }),
});
