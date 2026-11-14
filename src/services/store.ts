import { seedExperiences } from "../data/experiences";
import type { Booking, BookingResult, Experience } from "../domain/types";

let inventory: Experience[] = seedExperiences();
let bookingsById = new Map<string, Booking>();
let bookingsByKey = new Map<string, Booking>();
let counter = 0;
let plannedIds: Set<string> | null = null;

export function resetStore(): void {
    inventory = seedExperiences();
    bookingsById = new Map();
    bookingsByKey = new Map();
    counter = 0;
    plannedIds = null;
}

export function listExperiences(): Experience[] {
    return inventory;
}

export function listBookings(): Booking[] {
    return [...bookingsById.values()];
}

/** Records which items the planner scheduled. Bookings are then limited to these. */
export function recordPlan(ids: string[]): void {
    plannedIds = new Set(ids);
}

function isPlanned(id: string): boolean {
    // No plan recorded (for example an on-time flight) means no restriction.
    return plannedIds === null || plannedIds.has(id);
}

export function createBooking(input: {
    userId: string;
    itemId: string;
    idempotencyKey: string;
}): BookingResult {
    // Idempotency: the same key never creates a second booking.
    const existing = bookingsByKey.get(input.idempotencyKey);
    if (existing) return { ok: true, booking: existing, duplicate: true };

    if (!isPlanned(input.itemId)) return { ok: false, reason: "NOT_PLANNED" };

    const item = inventory.find((e) => e.id === input.itemId);
    if (!item) return { ok: false, reason: "NOT_FOUND" };

    // Capacity is re-checked at booking time, not trusted from the earlier search.
    if (item.booked >= item.capacity) return { ok: false, reason: "FULL" };

    item.booked += 1;
    counter += 1;
    const booking: Booking = {
        id: `BK-${counter}`,
        userId: input.userId,
        itemId: input.itemId,
        idempotencyKey: input.idempotencyKey,
        createdAt: new Date().toISOString(),
    };
    bookingsById.set(booking.id, booking);
    bookingsByKey.set(input.idempotencyKey, booking);
    return { ok: true, booking, duplicate: false };
}
