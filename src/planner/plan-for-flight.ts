import { getFlightStatus } from "../services/flight-service";
import { recordPlan } from "../services/store";
import { planFromIds } from "./plan-from-ids";
import type { Plan } from "./plan-itinerary";

export interface FlightPlan extends Plan {
    delayMinutes: number;
    note?: string;
}

const empty = (note: string): FlightPlan => ({
    delayMinutes: 0,
    windowMinutes: 0,
    remainingMinutes: 0,
    scheduled: [],
    skipped: [],
    note,
});

/** The delay comes from the flight service, never from the caller (an LLM). */
export function planForFlight(
    flightNumber: string,
    itemIds: string[],
): FlightPlan {
    const lookup = getFlightStatus(flightNumber);
    if (!lookup.found) return empty(lookup.message);

    const { flight } = lookup;
    if (flight.status !== "delayed") {
        // No plan is recorded, so bookings for an on-time flight are not restricted.
        return empty(
            `Flight ${flight.flightNumber} is ${flight.status}; no itinerary is needed.`,
        );
    }

    const plan = planFromIds(flight.delayMinutes, itemIds);
    recordPlan(plan.scheduled.map((s) => s.id));
    return { ...plan, delayMinutes: flight.delayMinutes };
}
