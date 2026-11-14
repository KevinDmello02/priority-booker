import { resetFaults } from "../resilience/faults";
import { mastra } from "../mastra";
import { listBookings, resetStore } from "../services/store";
import type { RunResult } from "./types";

export type ApprovalPolicy = "approve" | "decline";

export async function runDesk(
    prompt: string,
    approval: ApprovalPolicy = "approve",
    maxSteps = 12,
): Promise<RunResult> {
    resetStore();
    resetFaults();

    const desk = mastra.getAgent("deskAgent");
    const toolCalls: string[] = [];
    let approvalsRequested = 0;
    let text = "";
    let error: string | undefined;
    const started = Date.now();

    async function consume(
        stream: Awaited<ReturnType<typeof desk.stream>>,
    ): Promise<void> {
        for await (const chunk of stream.fullStream) {
            if (chunk.type === "tool-call") {
                toolCalls.push(chunk.payload.toolName);
            } else if (chunk.type === "text-delta") {
                text += chunk.payload.text;
            } else if (chunk.type === "error") {
                error = JSON.stringify(chunk).slice(0, 300);
            } else if (chunk.type === "tool-call-approval") {
                approvalsRequested += 1;
                const next =
                    approval === "approve"
                        ? await desk.approveToolCall({ runId: stream.runId })
                        : await desk.declineToolCall({ runId: stream.runId });
                await consume(next);
                return;
            }
        }
    }

    try {
        await consume(await desk.stream(prompt, { maxSteps }));
    } catch (err) {
        error = (err as Error).message;
    }

    return {
        prompt,
        text,
        toolCalls,
        approvalsRequested,
        bookings: listBookings(),
        error,
        durationMs: Date.now() - started,
    };
}
