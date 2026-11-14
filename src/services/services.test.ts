import { beforeEach, describe, expect, it } from "vitest";
import { createBooking, listBookings, recordPlan, resetStore } from "./store";
import { getFlightStatus } from "./flight-service";
import { searchExperiences } from "./experience-service";
import { getPreferences } from "./preference-service";

beforeEach(() => resetStore());

describe("flight service", () => {
    it("finds a flight case- and space-insensitively", () => {
        const r = getFlightStatus(" ai 202 ");
        expect(r.found && r.flight.delayMinutes).toBe(185);
    });
    it("returns a helpful message for unknown flights", () => {
        const r = getFlightStatus("XX999");
        expect(r.found).toBe(false);
    });
});

describe("experience search", () => {
    it("sorts by rating and hides full venues by default", () => {
        const r = searchExperiences({ airport: "bom" });
        expect(r[0].name).toBe("Premier Lounge");
        expect(r.find((e) => e.id === "bom-gate-club")).toBeUndefined();
    });
    it("can include full venues", () => {
        expect(
            searchExperiences({ airport: "BOM", includeFull: true }).some(
                (e) => e.id === "bom-gate-club",
            ),
        ).toBe(true);
    });
    it("filters by kind and duration", () => {
        expect(
            searchExperiences({ airport: "BOM", kind: "spa" }).map((e) => e.id),
        ).toEqual(["bom-aroma-spa"]);
        expect(
            searchExperiences({ airport: "BOM", maxDurationMinutes: 30 }).map(
                (e) => e.id,
            ),
        ).toEqual(["bom-terminal-brew"]);
    });
    it("reports occupancy", () => {
        const q = searchExperiences({ airport: "BOM", kind: "lounge" }).find(
            (e) => e.id === "bom-quiet-haven",
        );
        expect(q?.occupancyPercent).toBe(30);
    });
});

describe("booking store", () => {
    const base = { userId: "demo-user", itemId: "bom-quiet-haven" };

    it("books and reduces availability", () => {
        const r = createBooking({ ...base, idempotencyKey: "k1" });
        expect(r.ok && r.booking.id).toBe("BK-1");
        expect(
            searchExperiences({ airport: "BOM", kind: "lounge" }).find(
                (e) => e.id === "bom-quiet-haven",
            )?.availableSpots,
        ).toBe(27);
    });
    it("is idempotent for the same key", () => {
        createBooking({ ...base, idempotencyKey: "k1" });
        const again = createBooking({ ...base, idempotencyKey: "k1" });
        expect(again.ok && again.duplicate).toBe(true);
        expect(listBookings()).toHaveLength(1);
    });
    it("rejects a full venue at booking time", () => {
        expect(
            createBooking({
                userId: "u",
                itemId: "bom-gate-club",
                idempotencyKey: "k2",
            }),
        ).toEqual({ ok: false, reason: "FULL" });
    });
    it("rejects an unknown item", () => {
        expect(
            createBooking({
                userId: "u",
                itemId: "nope",
                idempotencyKey: "k3",
            }),
        ).toEqual({ ok: false, reason: "NOT_FOUND" });
    });
    it("only books items the planner scheduled", () => {
        recordPlan(["bom-quiet-haven"]);
        expect(
            createBooking({
                userId: "u",
                itemId: "bom-aroma-spa",
                idempotencyKey: "p1",
            }),
        ).toEqual({
            ok: false,
            reason: "NOT_PLANNED",
        });
        expect(
            createBooking({
                userId: "u",
                itemId: "bom-quiet-haven",
                idempotencyKey: "p2",
            }).ok,
        ).toBe(true);
    });
    it("blocks all bookings when the plan is empty", () => {
        recordPlan([]);
        expect(
            createBooking({
                userId: "u",
                itemId: "bom-quiet-haven",
                idempotencyKey: "p3",
            }),
        ).toEqual({
            ok: false,
            reason: "NOT_PLANNED",
        });
    });
});

describe("preferences", () => {
    it("returns saved preferences or a message", () => {
        expect(getPreferences("demo-user").found).toBe(true);
        expect(getPreferences("ghost").found).toBe(false);
    });
});
