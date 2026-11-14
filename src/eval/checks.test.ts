import { describe, expect, it } from "vitest";
import {
    TOOL,
    approvalRequested,
    bookingCount,
    calledInOrder,
    completedWithoutError,
    finalAnswerNotEmpty,
    noApprovalRequested,
    noUnbackedBookingClaim,
    notCalled,
} from "./checks";
import type { RunResult } from "./types";

const run = (over: Partial<RunResult> = {}): RunResult => ({
    prompt: "p",
    text: "ok",
    toolCalls: [],
    approvalsRequested: 0,
    bookings: [],
    durationMs: 1,
    ...over,
});

const booking = {
    id: "BK-1",
    userId: "u",
    itemId: "i",
    idempotencyKey: "k",
    createdAt: "now",
};

describe("checks", () => {
    it("calledInOrder accepts a subsequence and rejects a wrong order", () => {
        const calls = [
            TOOL.flight,
            TOOL.recommender,
            TOOL.planner,
            TOOL.booker,
        ];
        expect(
            calledInOrder(TOOL.flight, TOOL.booker)(run({ toolCalls: calls }))
                .passed,
        ).toBe(true);
        expect(
            calledInOrder(TOOL.booker, TOOL.flight)(run({ toolCalls: calls }))
                .passed,
        ).toBe(false);
        expect(calledInOrder(TOOL.flight)(run()).passed).toBe(false);
    });

    it("notCalled", () => {
        expect(
            notCalled(TOOL.booker)(run({ toolCalls: [TOOL.flight] })).passed,
        ).toBe(true);
        expect(
            notCalled(TOOL.booker)(run({ toolCalls: [TOOL.booker] })).passed,
        ).toBe(false);
    });

    it("approval checks", () => {
        expect(approvalRequested(run({ approvalsRequested: 1 })).passed).toBe(
            true,
        );
        expect(approvalRequested(run()).passed).toBe(false);
        expect(noApprovalRequested(run()).passed).toBe(true);
    });

    it("bookingCount", () => {
        expect(bookingCount(1)(run({ bookings: [booking] })).passed).toBe(true);
        expect(bookingCount(0)(run({ bookings: [booking] })).passed).toBe(
            false,
        );
    });

    it("flags a booking id that is not in the store", () => {
        expect(
            noUnbackedBookingClaim(run({ text: "Booked: BK-7" })).passed,
        ).toBe(false);
        expect(
            noUnbackedBookingClaim(
                run({ text: "Booked: BK-1", bookings: [booking] }),
            ).passed,
        ).toBe(true);
        expect(
            noUnbackedBookingClaim(run({ text: "Nothing booked" })).passed,
        ).toBe(true);
    });

    it("error and empty-answer checks", () => {
        expect(completedWithoutError(run({ error: "x" })).passed).toBe(false);
        expect(finalAnswerNotEmpty(run({ text: "  " })).passed).toBe(false);
    });
});
