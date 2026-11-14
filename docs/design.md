# Priority Booker: Design

## 1. Goal

A flight-disruption assistant for Priority Pass-style members. It recommends airport lounges and experiences ahead of a flight (T-4h) and, if the flight is delayed, builds a plan that fits the delay and books it after the user's approval.

## 2. Scenarios

| ID  | Trigger                       | Expected behaviour                                                                       |
| --- | ----------------------------- | ---------------------------------------------------------------------------------------- |
| S1  | T-4h, flight on time          | Recommend lounges (top rated + quietest by capacity), user may book one                  |
| S2  | Flight delayed (e.g. 185 min) | Orchestrator delegates: Flight Tracker, Recommender, planner, then Booker after approval |
| S3  | Flight cancelled              | Report status, do not book, suggest contacting the airline                               |
| S4  | User declines approval        | Nothing is booked, agent reports that clearly                                            |
| S5  | Lounge full at booking time   | Re-recommend, never claim a booking                                                      |
| S6  | Delay too short for any item  | Say so, recommend nothing that does not fit                                              |
| S7  | Weather MCP down              | Continue without weather and state what is missing                                       |

## 3. Agents and responsibilities

| Agent               | Responsibility                                                            | Tools                                            | Can write?               |
| ------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------ |
| Orchestrator (desk) | Understand the request, delegate, summarise                               | none (delegates only)                            | No                       |
| Flight Tracker      | Flight status and delay duration                                          | get-flight-status                                | No                       |
| Recommender         | Rank lounges, spa, sleep pods, cafes for the delay length and preferences | search-experiences, get-preferences, weather MCP | No                       |
| Booker              | Book the selected items                                                   | book-item (approval required)                    | Yes, only after approval |
| Planner (code)      | Pack items into the window: delay minus buffer                            | none (pure function, no LLM)                     | No                       |

## 4. Rules

1. Only the Booker can write, and only after explicit user approval.
2. The planner is deterministic code, never an LLM.
3. A booking is claimed only if the tool returned a booking ID.
4. A repeated confirmation must not create a second booking (idempotency key).
5. Capacity is re-checked at booking time.

## 5. Architecture

![Architecture](diagrams/architecture.svg)

Source: [architecture.puml](diagrams/architecture.puml)

## 6. Booking state machine

![Booking states](diagrams/booking-states.svg)

Source: [booking-states.puml](diagrams/booking-states.puml)

## 7. Failure handling

| Failure                | Response                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| Flight status timeout  | Retry once, then say status is unavailable, no delay-based recommendations |
| Invalid flight number  | Ask the user to correct it                                                 |
| Weather MCP down       | Continue without it, mention that weather is missing                       |
| Lounge full at booking | Re-recommend                                                               |
| Booking tool error     | Retry up to 2 times, then ask the user                                     |
| User declines          | Stop, nothing booked                                                       |

## 8. Evaluation plan

Trace-based checks per scenario (S1 to S7): which agents were delegated to and in what order, which tools were called, whether approval was requested before any write, no booking claimed without an ID. Run as a Langfuse experiment. Final-text checks are secondary.

## 9. Open items

- Choose the orchestrator model for the final demo (Gemini API assumed).
- Flight status is mock data; a production version would use a real schedule API (see README).
