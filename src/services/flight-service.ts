import { flights } from "../data/flights";
import type { FlightStatus } from "../domain/types";

export type FlightLookup =
    | { found: true; flight: FlightStatus }
    | { found: false; message: string };

export function getFlightStatus(raw: string): FlightLookup {
    const key = raw.replace(/\s+/g, "").toUpperCase();
    const flight = flights[key];
    if (!flight) {
        return {
            found: false,
            message: `No flight found for "${raw}". Ask the user to check the flight number.`,
        };
    }
    return { found: true, flight };
}
