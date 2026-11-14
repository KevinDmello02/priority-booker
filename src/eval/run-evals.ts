import { mcp } from "../mcp/client";
import { runDesk } from "./run-desk";
import { scenarios } from "./scenarios";

const only = process.argv[2]; // optional: npm run eval -- S2

async function main() {
    const selected = only ? scenarios.filter((s) => s.id === only) : scenarios;
    let failed = 0;

    for (const s of selected) {
        const saved: Record<string, string | undefined> = {};
        for (const [k, v] of Object.entries(s.env ?? {})) {
            saved[k] = process.env[k];
            process.env[k] = v;
        }

        console.log(`\n${s.id}  ${s.name}`);
        const run = await runDesk(s.prompt, s.approval);
        console.log(
            `    tools: ${run.toolCalls.join(" > ") || "(none)"}  (${(run.durationMs / 1000).toFixed(1)}s)`,
        );

        for (const check of s.checks) {
            const r = check(run);
            if (!r.passed) failed += 1;
            console.log(
                `    ${r.passed ? "PASS" : "FAIL"}  ${r.name}${!r.passed && r.detail ? `  [${r.detail}]` : ""}`,
            );
        }

        for (const [k, v] of Object.entries(saved)) {
            if (v === undefined) delete process.env[k];
            else process.env[k] = v;
        }
    }

    console.log(
        `\n${failed === 0 ? "ALL CHECKS PASSED" : `${failed} CHECK(S) FAILED`}`,
    );
    await mcp.disconnect();
    process.exit(failed === 0 ? 0 : 1);
}

main();
