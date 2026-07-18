import assert from "node:assert/strict";
import test from "node:test";

import { getEventStatus } from "../src/lib/eventStatus";

const now = new Date("2026-07-19T12:00:00+08:00");

test("an event is ended after its explicit end time", () => {
  assert.equal(
    getEventStatus(
      {
        endsAt: "2026-07-19T12:00:00+08:00",
        registrationOpen: true,
        maxSeats: 80,
        registeredCount: 45,
      },
      now,
    ),
    "ended",
  );
});

test("a future event is full when no seats remain", () => {
  assert.equal(
    getEventStatus(
      {
        endsAt: "2026-08-22T17:00:00+08:00",
        registrationOpen: true,
        maxSeats: 50,
        registeredCount: 50,
      },
      now,
    ),
    "full",
  );
});

test("a future event can be manually closed", () => {
  assert.equal(
    getEventStatus(
      {
        endsAt: "2026-08-22T17:00:00+08:00",
        registrationOpen: false,
        maxSeats: 50,
        registeredCount: 18,
      },
      now,
    ),
    "closed",
  );
});

test("a future event with seats and registration enabled is open", () => {
  assert.equal(
    getEventStatus(
      {
        endsAt: "2026-08-22T17:00:00+08:00",
        registrationOpen: true,
        maxSeats: 50,
        registeredCount: 18,
      },
      now,
    ),
    "open",
  );
});
