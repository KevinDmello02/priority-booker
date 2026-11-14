import "dotenv/config";
import { Mastra } from "@mastra/core";
import { LangfuseExporter } from "@mastra/langfuse";
import { LibSQLStore } from "@mastra/libsql";
import { Observability } from "@mastra/observability";
import { bookerAgent } from "./agents/booker-agent";
import { deskAgent } from "./agents/desk-agent";
import { flightAgent } from "./agents/flight-agent";
import { recommenderAgent } from "./agents/recommender-agent";

export const langfuseEnabled = Boolean(
    process.env.LANGFUSE_PUBLIC_KEY?.trim() &&
    process.env.LANGFUSE_SECRET_KEY?.trim(),
);

const observability = langfuseEnabled
    ? new Observability({
          configs: {
              langfuse: {
                  serviceName: "priority-booker",
                  exporters: [
                      new LangfuseExporter({
                          publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
                          secretKey: process.env.LANGFUSE_SECRET_KEY!,
                          baseUrl:
                              process.env.LANGFUSE_BASE_URL?.trim() ||
                              "http://localhost:3000",
                          realtime: true,
                      }),
                  ],
              },
          },
      })
    : undefined;

// Storage is required for tool approval to suspend and resume.
export const mastra = new Mastra({
    agents: { deskAgent, flightAgent, recommenderAgent, bookerAgent },
    storage: new LibSQLStore({ id: "mastra-storage", url: ":memory:" }),
    ...(observability ? { observability } : {}),
});
