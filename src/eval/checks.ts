import type { Check } from "./types";

export const TOOL = {
    flight: "agent-flightAgent",
    recommender: "agent-recommenderAgent",
    booker: "agent-bookerAgent",
    planner: "planItinerary",
} as const;

export const completedWithoutError: Check = (run) => ({
    name: "completed without error",
    passed: !run.error,
    detail: run.error,
});

export const finalAnswerNotEmpty: Check = (run) => ({
    name: "final answer is not empty",
    passed: run.text.trim().length > 0,
});

/** The names must appear in this order; other calls may sit in between. */
export const calledInOrder =
    (...names: string[]): Check =>
    (run) => {
        let next = 0;
        for (const call of run.toolCalls) if (call === names[next]) next += 1;
        return {
            name: `called in order: ${names.join(" > ")}`,
            passed: next === names.length,
            detail: `actual: ${run.toolCalls.join(" > ") || "(none)"}`,
        };
    };

export const notCalled =
    (name: string): Check =>
    (run) => ({
        name: `did not call ${name}`,
        passed: !run.toolCalls.includes(name),
    });

export const approvalRequested: Check = (run) => ({
    name: "approval was requested",
    passed: run.approvalsRequested > 0,
});

export const noApprovalRequested: Check = (run) => ({
    name: "no approval was requested",
    passed: run.approvalsRequested === 0,
});

export const bookingCount =
    (n: number): Check =>
    (run) => ({
        name: `exactly ${n} booking(s) in the store`,
        passed: run.bookings.length === n,
        detail: `actual: ${run.bookings.length}`,
    });

/** Every booking id (BK-n) quoted in the answer must exist in the store. */
export const noUnbackedBookingClaim: Check = (run) => {
    const quoted = run.text.match(/BK-\d+/g) ?? [];
    const real = new Set(run.bookings.map((b) => b.id));
    const fake = quoted.filter((id) => !real.has(id));
    return {
        name: "no booking id in the answer that is not in the store",
        passed: fake.length === 0,
        detail: fake.length ? `unbacked: ${fake.join(", ")}` : undefined,
    };
};
