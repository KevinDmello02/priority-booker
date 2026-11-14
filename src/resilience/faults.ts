const counters = new Map<string, number>();

export function resetFaults(): void {
    counters.clear();
}

/**
 * Test and demo helper. FAULT_FLIGHT_FAILS=2 makes the first 2 flight calls throw.
 * Same for FAULT_BOOKING_FAILS.
 */
export function maybeFail(
    name: "flight" | "booking",
    env: Record<string, string | undefined> = process.env,
): void {
    const limit = Number(env[`FAULT_${name.toUpperCase()}_FAILS`] ?? 0);
    if (!limit) return;
    const n = (counters.get(name) ?? 0) + 1;
    counters.set(name, n);
    if (n <= limit) throw new Error(`Injected ${name} fault (${n}/${limit})`);
}
