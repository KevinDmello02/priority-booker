import {
    TOOL,
    approvalRequested,
    bookingCount,
    calledInOrder,
    completedWithoutError,
    finalAnswerNotEmpty,
    noApprovalRequested,
    noUnbackedBookingClaim,
    notCalled,
} from "./checks";
import type { ApprovalPolicy } from "./run-desk";
import type { Check } from "./types";

export interface Scenario {
    id: string;
    name: string;
    prompt: string;
    approval: ApprovalPolicy;
    env?: Record<string, string>;
    checks: Check[];
}

const U = "My user id is demo-user.";
const base = [
    completedWithoutError,
    finalAnswerNotEmpty,
    noUnbackedBookingClaim,
];

export const scenarios: Scenario[] = [
    {
        id: "S1",
        name: "On-time flight, lounge options only",
        prompt: `${U} Flight AI101 at BOM is on time. What lounge options do I have? Do not book anything.`,
        approval: "approve",
        checks: [
            ...base,
            calledInOrder(TOOL.flight, TOOL.recommender),
            notCalled(TOOL.booker),
            noApprovalRequested,
            bookingCount(0),
        ],
    },
    {
        id: "S2",
        name: "Delayed flight, plan and book after approval",
        prompt: `${U} My flight AI202 from BOM is delayed. Find me something quiet and book the best option.`,
        approval: "approve",
        checks: [
            ...base,
            calledInOrder(
                TOOL.flight,
                TOOL.recommender,
                TOOL.planner,
                TOOL.booker,
            ),
            approvalRequested,
            bookingCount(1),
        ],
    },
    {
        id: "S3",
        name: "Cancelled flight, nothing recommended or booked",
        prompt: `${U} Flight AI303 status please, and book me a lounge.`,
        approval: "approve",
        checks: [
            ...base,
            calledInOrder(TOOL.flight),
            notCalled(TOOL.recommender),
            notCalled(TOOL.planner),
            notCalled(TOOL.booker),
            bookingCount(0),
        ],
    },
    {
        id: "S4",
        name: "User declines approval, nothing booked",
        prompt: `${U} My flight AI202 from BOM is delayed. Find me something quiet and book the best option.`,
        approval: "decline",
        checks: [...base, approvalRequested, bookingCount(0)],
    },
    {
        id: "S5",
        name: "Requested lounge is full at booking time",
        prompt: `${U} Flight AI101 at BOM is on time. Book me the Gate Club Lounge (item id bom-gate-club).`,
        approval: "approve",
        checks: [...base, bookingCount(0)],
    },
    {
        id: "S6",
        name: "Delay too short, nothing scheduled or booked",
        prompt: `${U} Flight AI404 is delayed. Book me something.`,
        approval: "approve",
        checks: [
            ...base,
            calledInOrder(TOOL.flight, TOOL.recommender, TOOL.planner),
            notCalled(TOOL.booker),
            bookingCount(0),
        ],
    },
    {
        id: "S7",
        name: "Weather MCP disabled, still works",
        prompt: `${U} My flight AI202 from BOM is delayed. What do you recommend? Do not book.`,
        approval: "approve",
        env: { DISABLE_WEATHER: "1" },
        checks: [
            ...base,
            calledInOrder(TOOL.flight, TOOL.recommender),
            notCalled(TOOL.booker),
            bookingCount(0),
        ],
    },
];
