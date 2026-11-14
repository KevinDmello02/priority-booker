# Priority Booker

An agentic flight-disruption assistant built with TypeScript and [Mastra](https://mastra.ai). An orchestrator delegates to specialised sub-agents that check a flight, recommend airport lounges and experiences (lounge, spa, sleep pod, cafe), fit them into the delay with deterministic code, and book them only after the user approves.

Example: a Mumbai to Newark flight is delayed by 185 minutes. The desk agent checks the flight, asks the recommender for quiet options, plans what fits in the waiting time, and asks the user to approve the booking before anything is written.

## Quick start

Requirements: Node.js 22.13 or later, and one LLM option (a Gemini API key, or a local Ollama model).

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Edit `.env`:

```dotenv
LLM_PROVIDER=api            # api | local
API_MODEL=google/gemini-3.5-flash
GOOGLE_GENERATIVE_AI_API_KEY=<your key>
# or, for a local model:
# LLM_PROVIDER=local
# LOCAL_MODEL=qwen3.5:9b
```

Run it:

```bash
npm start                                   # default demo: delayed flight AI202, books after approval
npm run desk-demo -- "My user id is demo-user. Flight AI101 at BOM is on time. What lounges are there?"
npm test                                    # unit tests, no LLM needed
npm run eval                                # behaviour scenarios against the real model
npm run eval:langfuse                       # same scenarios as a Langfuse experiment (needs Langfuse)
```

Mock flights: `AI101` on time, `AI202` delayed 185 min, `AI303` cancelled, `AI404` delayed 30 min. Demo user: `demo-user`. Airports: BOM and EWR.

Optional: set `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` and `LANGFUSE_BASE_URL` to send traces to Langfuse (cloud or self-hosted). Without them, tracing is simply off.

## Architecture

![Architecture](docs/diagrams/architecture.svg)

Source: [architecture.puml](docs/diagrams/architecture.puml). Full design notes: [docs/design.md](docs/design.md).

| Part                        | Responsibility                                                                                | Can write?          |
| --------------------------- | --------------------------------------------------------------------------------------------- | ------------------- |
| Orchestrator (`desk-agent`) | Follows a fixed step order, delegates, summarises. Never looks anything up or books itself.   | No                  |
| Flight Tracker              | Flight status and delay (`get-flight-status`)                                                 | No                  |
| Recommender                 | Ranks lounges, spas, sleep pods, cafes (`search-experiences`, `get-preferences`, weather MCP) | No                  |
| Planner (`plan-itinerary`)  | Fits items into the delay window using code, not an LLM                                       | Records the plan    |
| Booker                      | Books items (`book-item`)                                                                     | Yes, after approval |
| Weather MCP (open-meteo)    | External MCP server, optional                                                                 | No                  |

![Booking states](docs/diagrams/booking-states.svg)

### Key decisions

- **Supervisor pattern.** One orchestrator with sub-agents as tools. Each sub-agent only has the tools it needs, so the read-only agents cannot write.
- **Deterministic planning.** The window is the delay minus a 60-minute buffer, with 10 minutes of transfer between items. The planner looks the delay up from the flight service itself, so the LLM cannot pass a wrong number.
- **Writes are gated twice.** `book-item` requires user approval (a Mastra tool approval that suspends the run), and the booking store refuses any item the planner did not schedule.
- **Safe retries.** Bookings use an idempotency key, so retries and repeated confirmations cannot double-book. Capacity is re-checked at booking time.
- **Failure handling.** Flight and booking calls have timeouts and retries and return a structured "unavailable" result instead of throwing. The weather MCP is optional: if it fails to start, the recommender runs without it. Faults can be injected with `FAULT_FLIGHT_FAILS=n` and `FAULT_BOOKING_FAILS=n`.
- **Switchable models.** `LLM_PROVIDER` selects an API model or a local Ollama model. Nothing else changes.
- **Observability.** Optional Langfuse tracing through Mastra's observability exporter.

## Testing and evaluation

- `npm test`: unit tests for the config, services, booking store (idempotency, capacity, plan guard), planner, retry and fault helpers, and the eval checks. No LLM or network needed. They also run in CI.
- `npm run eval`: seven scenarios run against the real orchestrator. Checks look at behaviour, not wording: the order of delegations and tool calls, whether approval was requested, what is in the booking store, and whether the answer quotes a booking id that does not exist.
- `npm run eval:langfuse`: the same scenarios as a Langfuse experiment, with each scenario scored.

| ID  | Scenario                                        |
| --- | ----------------------------------------------- |
| S1  | On-time flight: recommend only                  |
| S2  | Delayed flight: plan and book after approval    |
| S3  | Cancelled flight: nothing recommended or booked |
| S4  | User declines approval: nothing booked          |
| S5  | Requested lounge is full: nothing booked        |
| S6  | Delay too short: nothing scheduled or booked    |
| S7  | Weather MCP disabled: still works               |

Results (TODO: fill in from your runs; run each model 2 to 3 times):

| Model                        | Scenarios passing every check | Notes |
| ---------------------------- | ----------------------------- | ----- |
| TODO google/gemini-3.5-flash | TODO / 7                      | TODO  |
| TODO ollama/qwen3.5:9b       | TODO / 7                      | TODO  |

Observations during development: smaller or free-tier models were the weakest part of the system. A local 9B model sometimes stopped after the first delegation and answered from its own knowledge; one hosted model invented tool names that did not exist; and one model occasionally returned an empty turn after several tool results. This is why the planner, the approval gate and the booking guard are code, and why the evals check behaviour.

## Assumptions and limitations

- All data is mocked: flights, lounge inventory, preferences. There are no real airline, lounge or payment integrations.
- State is in memory: bookings, inventory, the recorded plan and the run storage reset when the process stops. The plan is held per process, not per user or session.
- The proactive "4 hours before departure" trigger is not scheduled. The behaviour is exercised by prompting the desk agent directly.
- One demo user and one currency-free booking model. No authentication, quotas or pricing.
- LLM behaviour is non-deterministic, so evals should be run several times and read as pass rates.
- Free-tier model rate limits can interrupt long runs.
- I considered a flight-tracking MCP server (OpenSky) but did not include it: it reports aircraft positions and cannot return a flight's delay.

## What I would do for production

- Real integrations: flight schedule and delay API, lounge capacity and booking APIs, with webhooks for delay changes.
- A scheduler or queue to trigger the T-4h recommendation and delay alerts, with push notifications.
- Persistent storage for bookings, user preferences and agent runs, keyed per user and session, with the booking record written in a transaction.
- Authentication and per-user authorisation; secrets in a manager; rate limiting and spend caps on model calls.
- Structured output between agents (schemas) instead of free text, and a deterministic workflow for the critical path with the LLM used for language and choice.
- Larger eval sets with LLM-judged quality scores alongside the behavioural checks, and regression gating in CI.
- Production tracing with sampling and alerting, and dashboards for tool error rates and approval rates.

## Project layout

```
src/
  agents/       orchestrator and sub-agents
  tools/        Mastra tools (thin wrappers over services)
  services/     flight, experience, preference services and the booking store
  planner/      deterministic itinerary planner
  resilience/   retry, timeout and fault injection
  mcp/          weather MCP client
  config/       env-driven model selection
  eval/         scenarios, checks, runners
  demo/         command-line demos
  data/ domain/ mock data and types
docs/           design document and diagrams
```
