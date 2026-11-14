import { describe, expect, it } from "vitest";
import { buildModel } from "./config";

describe("buildModel", () => {
    it("returns the provider/model string for api", () => {
        expect(
            buildModel({
                LLM_PROVIDER: "api",
                API_MODEL: "google/gemini-3.5-flash",
            }),
        ).toBe("google/gemini-3.5-flash");
    });

    it("returns an OpenAI-compatible config for local", () => {
        expect(
            buildModel({ LLM_PROVIDER: "local", LOCAL_MODEL: "qwen3.5:9b" }),
        ).toEqual({
            id: "ollama/qwen3.5:9b",
            url: "http://localhost:11434/v1",
            apiKey: "ollama",
            api: "chat",
        });
    });

    it("honours OLLAMA_BASE_URL", () => {
        const m = buildModel({
            LLM_PROVIDER: "local",
            LOCAL_MODEL: "x",
            OLLAMA_BASE_URL: "http://host:1/v1",
        });
        expect(m).toMatchObject({ url: "http://host:1/v1" });
    });

    it("is case and whitespace tolerant for the provider", () => {
        expect(
            buildModel({ LLM_PROVIDER: "  API ", API_MODEL: "groq/m" }),
        ).toBe("groq/m");
    });

    it("throws on an unknown or missing provider", () => {
        expect(() => buildModel({})).toThrow('must be "api" or "local"');
        expect(() => buildModel({ LLM_PROVIDER: "cloud" })).toThrow(
            'must be "api" or "local"',
        );
    });

    it("throws when API_MODEL is missing or malformed", () => {
        expect(() => buildModel({ LLM_PROVIDER: "api" })).toThrow("API_MODEL");
        expect(() =>
            buildModel({ LLM_PROVIDER: "api", API_MODEL: "gemini" }),
        ).toThrow("API_MODEL");
    });

    it("throws when LOCAL_MODEL is missing", () => {
        expect(() => buildModel({ LLM_PROVIDER: "local" })).toThrow(
            "LOCAL_MODEL",
        );
    });
});
