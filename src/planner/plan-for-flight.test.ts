import { beforeEach, describe, expect, it } from "vitest";
import { createBooking, resetStore } from "../services/store";
import { planForFlight } from "./plan-for-flight";

beforeEach(() => resetStore());

describe("planForFlight", () => {
    it("uses the delay from the flight service and records the plan", () => {
        const plan = planForFlight("AI202", [
            "bom-quiet-haven",
            "bom-aroma-spa",
        ]);
        expect(plan.delayMinutes).toBe(185);
        expect(plan.windowMinutes).toBe(125);
        expect(plan.scheduled.map((s) => s.id)).toEqual(["bom-quiet-haven"]);
        expect(plan.skipped).toEqual([
            { id: "bom-aroma-spa", reason: "DOES_NOT_FIT" },
        ]);
        expect(
            createBooking({
                userId: "u",
                itemId: "bom-aroma-spa",
                idempotencyKey: "a",
            }),
        ).toEqual({
            ok: false,
            reason: "NOT_PLANNED",
        });
        expect(
            createBooking({
                userId: "u",
                itemId: "bom-quiet-haven",
                idempotencyKey: "b",
            }).ok,
        ).toBe(true);
    });

    it("schedules nothing for a short delay", () => {
        const plan = planForFlight("AI404", ["bom-quiet-haven"]);
        expect(plan.windowMinutes).toBe(0);
        expect(plan.scheduled).toEqual([]);
    });

    it("does not restrict bookings for an on-time flight", () => {
        const plan = planForFlight("AI101", ["bom-quiet-haven"]);
        expect(plan.note).toContain("no itinerary");
        expect(
            createBooking({
                userId: "u",
                itemId: "bom-quiet-haven",
                idempotencyKey: "c",
            }).ok,
        ).toBe(true);
    });

    it("returns a note for an unknown flight", () => {
        expect(planForFlight("XX999", ["bom-quiet-haven"]).note).toContain(
            "No flight found",
        );
    });
});
