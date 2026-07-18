export type EventStatus = "ended" | "full" | "closed" | "open";

export interface EventStatusInput {
  endsAt: string;
  registrationOpen: boolean;
  maxSeats: number;
  registeredCount: number;
  lifecycleStatus?: "scheduled" | "ended" | "cancelled";
}

export function getEventStatus(
  event: EventStatusInput,
  now = new Date(),
): EventStatus {
  if (
    event.lifecycleStatus === "ended" ||
    new Date(event.endsAt).getTime() <= now.getTime()
  ) {
    return "ended";
  }

  if (event.registeredCount >= event.maxSeats) {
    return "full";
  }

  if (!event.registrationOpen) {
    return "closed";
  }

  return "open";
}
