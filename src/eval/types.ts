import type { Booking } from "../domain/types";

export interface RunResult {
    prompt: string;
    text: string;
    toolCalls: string[];
    approvalsRequested: number;
    bookings: Booking[];
    error?: string;
    durationMs: number;
}

export interface CheckResult {
    name: string;
    passed: boolean;
    detail?: string;
}

export type Check = (run: RunResult) => CheckResult;
