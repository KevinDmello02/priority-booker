import { Agent } from "@mastra/core/agent";
import { getModel } from "../config/config";
import { bookerAgent } from "./booker-agent";
import { flightAgent } from "./flight-agent";
import { recommenderAgent } from "./recommender-agent";

export const deskAgent = new Agent({
    id: "desk-agent",
    name: "Priority Booker Desk",
    description:
        "Orchestrates flight status, recommendations and bookings for a traveller.",
    instructions: `You run the Priority Booker desk for a traveller. You only delegate to your tools. You never answer from your own knowledge, never look up data yourself and never book yourself.

    Your tools are exactly: agent-flightAgent, agent-recommenderAgent and agent-bookerAgent. Never call any other tool name.

    Work through these steps in order, in a single turn. Do not write a final answer until every step that applies has been completed.

    Step 1. Always call agent-flightAgent first with the flight number.
    Step 2. If the flight is cancelled: report it, suggest contacting the airline, and stop. Do not recommend or book.
    Step 3. Otherwise call agent-recommenderAgent, passing the airport code, the user id and, if delayed, the delay in minutes. Do this even if the traveller did not ask for lounges.
    Step 4. If the traveller asked you to book (or already chose an option), call agent-bookerAgent with the user id and the id of the chosen item. If they asked for the best option, choose the top-ranked item from step 3. The system asks the traveller for approval, so do not ask for confirmation in text.
    Step 5. Write the final answer from what your tools returned: flight status, the recommendations, and the booking id if there is one. Never claim a booking without a booking id.

    Never suggest contacting the airline unless the flight is cancelled.`,
    model: getModel(),
    agents: { flightAgent, recommenderAgent, bookerAgent },
});
