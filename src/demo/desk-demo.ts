import readline from "node:readline/promises";
import { mcp } from "../mcp/client";
import { mastra } from "../mastra";
import { listBookings } from "../services/store";

const prompt =
    process.argv.slice(2).join(" ") ||
    "My user id is demo-user. My flight AI202 from BOM is delayed. Find me something quiet and book the best option.";

const desk = mastra.getAgent("deskAgent");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const verbose = process.env.VERBOSE === "1";

const short = (v: unknown, n = 600) => JSON.stringify(v)?.slice(0, n);

async function consume(
    stream: Awaited<ReturnType<typeof desk.stream>>,
): Promise<void> {
    for await (const chunk of stream.fullStream) {
        if (chunk.type === "tool-call") {
            console.log(`\n[tool] ${chunk.payload.toolName}`);
        } else if (chunk.type === "tool-result" && verbose) {
            console.log(
                `[result] ${chunk.payload.toolName}: ${short(chunk.payload.result)}`,
            );
        } else if (chunk.type === "text-delta") {
            process.stdout.write(chunk.payload.text);
        } else if (chunk.type === "error" && verbose) {
            console.log("[error]", short(chunk));
        } else if (chunk.type === "finish" && verbose) {
            console.log("\n[finish]", short(chunk.payload, 400));
        } else if (chunk.type === "tool-call-approval") {
            const answer = await rl.question(
                `\n\nApprove booking action? (y/n) `,
            );
            const next =
                answer.trim().toLowerCase() === "y"
                    ? await desk.approveToolCall({ runId: stream.runId })
                    : await desk.declineToolCall({ runId: stream.runId });
            await consume(next);
            return;
        }
    }
}

try {
    console.log(`> ${prompt}\n`);
    await consume(await desk.stream(prompt, { maxSteps: 12 }));
    console.log("\n\nBookings in store:", listBookings());
} finally {
    rl.close();
    await mcp.disconnect();
}
