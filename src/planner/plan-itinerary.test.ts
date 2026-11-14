import { beforeEach, describe, expect, it } from "vitest";
import { resetStore } from "../services/store";
import { planFromIds } from "./plan-from-ids";
import { planItinerary, type PlanItem } from "./plan-itinerary";

const pod: PlanItem = {
    id: "pod",
    name: "Pod",
    kind: "sleep-pod",
    durationMinutes: 120,
};
const lounge: PlanItem = {
    id: "lounge",
    name: "Lounge",
    kind: "lounge",
    durationMinutes: 120,
};
const spa: PlanItem = {
    id: "spa",
    name: "Spa",
    kind: "spa",
    durationMinutes: 60,
};
const cafe: PlanItem = {
    id: "cafe",
    name: "Cafe",
    kind: "cafe",
    durationMinutes: 30,
};

describe("planItinerary", () => {
    it("schedules nothing when the delay is within the buffer", () => {
        const plan = planItinerary({ delayMinutes: 60, items: [pod] });
        expect(plan.windowMinutes).toBe(0);
        expect(plan.scheduled).toEqual([]);
        expect(plan.skipped).toEqual([{ id: "pod", reason: "DOES_NOT_FIT" }]);
    });

    it("fits an item that exactly fills the window", () => {
        const plan = planItinerary({ delayMinutes: 180, items: [pod] });
        expect(plan.scheduled).toHaveLength(1);
        expect(plan.remainingMinutes).toBe(0);
    });

    it("skips an item that does not fit after the first", () => {
        const plan = planItinerary({ delayMinutes: 185, items: [pod, spa] });
        expect(plan.windowMinutes).toBe(125);
        expect(plan.scheduled.map((s) => s.id)).toEqual(["pod"]);
        expect(plan.skipped).toEqual([{ id: "spa", reason: "DOES_NOT_FIT" }]);
        expect(plan.remainingMinutes).toBe(5);
    });

    it("chains several items with transfer time between them", () => {
        const plan = planItinerary({
            delayMinutes: 305,
            items: [lounge, spa, cafe],
        });
        expect(
            plan.scheduled.map((s) => [s.id, s.startMinute, s.endMinute]),
        ).toEqual([
            ["lounge", 0, 120],
            ["spa", 130, 190],
            ["cafe", 200, 230],
        ]);
        expect(plan.remainingMinutes).toBe(15);
    });

    it("skips a non-fitting item but still tries later ones, keeping priority order", () => {
        const plan = planItinerary({
            delayMinutes: 185,
            items: [spa, lounge, cafe],
        });
        expect(plan.scheduled.map((s) => s.id)).toEqual(["spa", "cafe"]);
        expect(plan.skipped).toEqual([
            { id: "lounge", reason: "DOES_NOT_FIT" },
        ]);
        expect(plan.remainingMinutes).toBe(25);
    });

    it("honours a custom buffer", () => {
        expect(
            planItinerary({ delayMinutes: 100, items: [], bufferMinutes: 30 })
                .windowMinutes,
        ).toBe(70);
    });

    it("rejects invalid input", () => {
        expect(() => planItinerary({ delayMinutes: -1, items: [] })).toThrow(
            "delayMinutes",
        );
        expect(() =>
            planItinerary({
                delayMinutes: 100,
                items: [{ ...cafe, durationMinutes: 0 }],
            }),
        ).toThrow("durationMinutes");
    });
});

describe("planFromIds", () => {
    beforeEach(() => resetStore());

    it("uses inventory durations and reports unknown ids", () => {
        const plan = planFromIds(305, [
            "bom-quiet-haven",
            "bom-aroma-spa",
            "nope",
        ]);
        expect(plan.scheduled.map((s) => s.id)).toEqual([
            "bom-quiet-haven",
            "bom-aroma-spa",
        ]);
        expect(plan.skipped).toEqual([{ id: "nope", reason: "NOT_FOUND" }]);
    });
});
