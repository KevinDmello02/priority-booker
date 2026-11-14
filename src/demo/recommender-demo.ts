import { mcp } from "../mcp/client";
import { mastra } from "../mastra";

const agent = mastra.getAgent("recommenderAgent");
const result = await agent.generate(
    "Airport: BOM. User id: demo-user. Delay: 185 minutes. Recommend quiet options.",
    { maxSteps: 8 },
);

console.log("finishReason:", result.finishReason);
console.log("steps:", result.steps?.length);
console.log("warnings:", JSON.stringify(result.warnings ?? []));
console.log("--- text ---");
console.log(result.text);
console.log("--- tool results ---");
for (const t of (result.toolResults ?? []) as unknown[]) {
    console.log(JSON.stringify(t, null, 2).slice(0, 1500));
}

await mcp.disconnect();
