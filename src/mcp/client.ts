import { MCPClient } from "@mastra/mcp";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";

export const mcp = new MCPClient({
    id: "priority-booker-mcp",
    servers: {
        weather: { command: npx, args: ["-y", "weather-open-meteo-mcp"] },
    },
});

/**
 * Weather tools are optional. If the MCP server cannot start or is slow,
 * return no tools and let the agent carry on without weather.
 */
export async function loadWeatherTools(timeoutMs = 20_000) {
    if (process.env.DISABLE_WEATHER === "1") return {};
    try {
        const tools = await Promise.race([
            mcp.listTools(),
            new Promise<never>((_, reject) =>
                setTimeout(
                    () =>
                        reject(
                            new Error(
                                `weather MCP timed out after ${timeoutMs}ms`,
                            ),
                        ),
                    timeoutMs,
                ),
            ),
        ]);
        return tools;
    } catch (err) {
        console.warn(
            `[mcp] weather tools unavailable, continuing without them: ${(err as Error).message}`,
        );
        return {};
    }
}
