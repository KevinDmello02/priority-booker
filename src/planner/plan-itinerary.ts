export const DEFAULT_BUFFER_MINUTES = 60;
export const DEFAULT_TRANSFER_MINUTES = 10;

export interface PlanItem {
    id: string;
    name: string;
    kind: string;
    durationMinutes: number;
}

export interface ScheduledItem extends PlanItem {
    startMinute: number;
    endMinute: number;
}

export interface SkippedItem {
    id: string;
    reason: "DOES_NOT_FIT" | "NOT_FOUND";
}

export interface Plan {
    windowMinutes: number;
    scheduled: ScheduledItem[];
    skipped: SkippedItem[];
    remainingMinutes: number;
}

export interface PlanInput {
    delayMinutes: number;
    items: PlanItem[]; // priority order, best first
    bufferMinutes?: number;
    transferMinutes?: number;
}

function assertNonNegativeInt(value: number, label: string): void {
    if (!Number.isInteger(value) || value < 0) {
        throw new Error(
            `${label} must be a non-negative integer, got ${value}`,
        );
    }
}

export function planItinerary(input: PlanInput): Plan {
    const buffer = input.bufferMinutes ?? DEFAULT_BUFFER_MINUTES;
    const transfer = input.transferMinutes ?? DEFAULT_TRANSFER_MINUTES;

    assertNonNegativeInt(input.delayMinutes, "delayMinutes");
    assertNonNegativeInt(buffer, "bufferMinutes");
    assertNonNegativeInt(transfer, "transferMinutes");
    for (const item of input.items) {
        if (
            !Number.isInteger(item.durationMinutes) ||
            item.durationMinutes <= 0
        ) {
            throw new Error(
                `durationMinutes must be a positive integer for ${item.id}, got ${item.durationMinutes}`,
            );
        }
    }

    const windowMinutes = Math.max(0, input.delayMinutes - buffer);
    const scheduled: ScheduledItem[] = [];
    const skipped: SkippedItem[] = [];
    let cursor = 0;

    for (const item of input.items) {
        const startMinute = scheduled.length > 0 ? cursor + transfer : 0;
        const endMinute = startMinute + item.durationMinutes;
        if (endMinute <= windowMinutes) {
            scheduled.push({ ...item, startMinute, endMinute });
            cursor = endMinute;
        } else {
            skipped.push({ id: item.id, reason: "DOES_NOT_FIT" });
        }
    }

    return {
        windowMinutes,
        scheduled,
        skipped,
        remainingMinutes: windowMinutes - cursor,
    };
}
