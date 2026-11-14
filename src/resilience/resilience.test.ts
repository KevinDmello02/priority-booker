import { beforeEach, describe, expect, it } from "vitest";
import { maybeFail, resetFaults } from "./faults";
import { withRetry } from "./retry";

describe("withRetry", () => {
    it("returns the result on first success", async () => {
        expect(await withRetry(() => 42)).toBe(42);
    });

    it("retries and then succeeds", async () => {
        let calls = 0;
        const result = await withRetry(() => {
            calls += 1;
            if (calls < 2) throw new Error("boom");
            return "ok";
        });
        expect(result).toBe("ok");
        expect(calls).toBe(2);
    });

    it("throws the last error after retries are exhausted", async () => {
        let calls = 0;
        await expect(
            withRetry(
                () => {
                    calls += 1;
                    throw new Error("still failing");
                },
                { retries: 2 },
            ),
        ).rejects.toThrow("still failing");
        expect(calls).toBe(3);
    });

    it("times out a hanging call", async () => {
        await expect(
            withRetry(() => new Promise(() => {}), {
                retries: 0,
                timeoutMs: 20,
                label: "slow thing",
            }),
        ).rejects.toThrow("slow thing timed out");
    });
});

describe("maybeFail", () => {
    beforeEach(() => resetFaults());

    it("does nothing without the env var", () => {
        expect(() => maybeFail("flight", {})).not.toThrow();
    });

    it("fails the first N calls only", () => {
        const env = { FAULT_FLIGHT_FAILS: "2" };
        expect(() => maybeFail("flight", env)).toThrow("Injected flight fault");
        expect(() => maybeFail("flight", env)).toThrow("Injected flight fault");
        expect(() => maybeFail("flight", env)).not.toThrow();
    });
});
