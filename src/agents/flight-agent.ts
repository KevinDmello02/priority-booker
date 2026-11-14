import { Agent } from "@mastra/core/agent";
import { getModel } from "../config/config";
import { flightStatusTool } from "../tools/flight-status";

export const flightAgent = new Agent({
    id: "flight-agent",
    name: "Flight Tracker",
    description:
        "Looks up the live status of a flight: on-time, delayed (with delay minutes) or cancelled.",
    instructions: `You report flight status.
Use the flight status tool for the flight number you are given and never guess a status.
If the flight is not found, say so and ask for a corrected flight number.
Reply briefly with: flight number, origin, destination, status and delay in minutes.`,
    model: getModel(),
    tools: { flightStatusTool },
});
