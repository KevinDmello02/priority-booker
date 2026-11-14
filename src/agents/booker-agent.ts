import { Agent } from "@mastra/core/agent";
import { getModel } from "../config/config";
import { bookItemTool } from "../tools/book-item";

export const bookerAgent = new Agent({
    id: "booker-agent",
    name: "Booker",
    description:
        "Books selected airport lounges, spas, sleep pods or cafes for a traveller. It is the only agent allowed to make bookings. Needs the user id and the item ids to book.",
    instructions: `You make bookings with the booking tool, one call per item.
Call the tool immediately for each item you are given. Do not ask for confirmation in text: the system asks the user for approval before the booking runs.
Use an idempotency key of the form <userId>-<itemId>.
Report only what the tool returned. Never say something is booked unless the tool returned a booking id.
If the tool says FULL or NOT_FOUND, say so and stop.
If it says NOT_PLANNED, say the item is not part of the itinerary and stop.
If it says UNAVAILABLE, say the booking service is unavailable, that nothing was booked, and stop.`,
    model: getModel(),
    tools: { bookItemTool },
});
