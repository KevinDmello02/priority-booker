export type ExperienceKind = "lounge" | "spa" | "sleep-pod" | "cafe";

export interface FlightStatus {
    flightNumber: string;
    airline: string;
    origin: string;
    destination: string;
    scheduledDeparture: string;
    status: "on-time" | "delayed" | "cancelled";
    delayMinutes: number;
}

export interface Experience {
    id: string;
    airport: string;
    terminal: string;
    kind: ExperienceKind;
    name: string;
    rating: number;
    capacity: number;
    booked: number;
    durationMinutes: number;
    tags: string[];
}

export interface Preferences {
    userId: string;
    prefersQuiet: boolean;
    favouriteKinds: ExperienceKind[];
    notes: string;
}

export interface Booking {
    id: string;
    userId: string;
    itemId: string;
    idempotencyKey: string;
    createdAt: string;
}

export type BookingResult =
    | { ok: true; booking: Booking; duplicate: boolean }
    | { ok: false; reason: "NOT_FOUND" | "FULL" | "NOT_PLANNED" };
