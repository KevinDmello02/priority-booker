import { loadWeatherTools, mcp } from "./client";

const tools = await loadWeatherTools();
console.log(Object.keys(tools));
await mcp.disconnect();
