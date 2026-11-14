import type { FlightStatus } from "../domain/types";

export const flights: Record<string, FlightStatus> = {
    AI101: {
        flightNumber: "AI101",
        airline: "Air India",
        origin: "BOM",
        destination: "EWR",
        scheduledDeparture: "2026-11-20T23:30:00+05:30",
        status: "on-time",
        delayMinutes: 0,
    },
    AI202: {
        flightNumber: "AI202",
        airline: "Air India",
        origin: "BOM",
        destination: "EWR",
        scheduledDeparture: "2026-11-20T23:30:00+05:30",
        status: "delayed",
        delayMinutes: 185,
    },
    AI303: {
        flightNumber: "AI303",
        airline: "Air India",
        origin: "BOM",
        destination: "EWR",
        scheduledDeparture: "2026-11-20T23:30:00+05:30",
        status: "cancelled",
        delayMinutes: 0,
    },
    AI404: {
        flightNumber: "AI404",
        airline: "Air India",
        origin: "BOM",
        destination: "EWR",
        scheduledDeparture: "2026-11-20T23:30:00+05:30",
        status: "delayed",
        delayMinutes: 30,
    },
};
