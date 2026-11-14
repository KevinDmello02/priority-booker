import "dotenv/config";

export type ModelId = `${string}/${string}`;

type Env = Record<string, string | undefined>;

export type ModelConfig =
    ModelId | { id: ModelId; url: string; apiKey: string; api: "chat" };

export function buildModel(env: Env = process.env): ModelConfig {
    const provider = (env.LLM_PROVIDER ?? "").trim().toLowerCase();

    if (provider === "local") {
        const name = env.LOCAL_MODEL?.trim();
        if (!name)
            throw new Error(
                "LLM_PROVIDER=local but LOCAL_MODEL is not set in .env.",
            );
        return {
            id: `ollama/${name}` as ModelId,
            url: env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434/v1",
            apiKey: "ollama",
            api: "chat",
        };
    }

    if (provider === "api") {
        const id = env.API_MODEL?.trim();
        if (!id || !id.includes("/")) {
            throw new Error(
                "LLM_PROVIDER=api but API_MODEL is missing or not in provider/model format.",
            );
        }
        return id as ModelId;
    }

    throw new Error(
        'LLM_PROVIDER must be "api" or "local". Check your .env file.',
    );
}

let cached: ModelConfig | undefined;

/** Lazy, so importing this module never throws (important for tests). */
export function getModel(): ModelConfig {
    cached ??= buildModel();
    return cached;
}
