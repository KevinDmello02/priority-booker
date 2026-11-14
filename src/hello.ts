import { Agent } from "@mastra/core/agent";
import { getModel } from "./config/config";

const agent = new Agent({
    id: "hello-agent",
    name: "hello-agent",
    instructions: "You are a concise assistant.",
    model: getModel(),
});

const result = await agent.generate(
    "Say hello to Priority Booker in one sentence.",
);
console.log(result.text);
