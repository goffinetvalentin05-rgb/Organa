import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import {
  createEventForClub,
  getEventForClub,
  listEventsForClub,
  updateEventForClub,
} from "./service";

export const getEvents = defineTool<Record<string, never>, { events: unknown[] }>({
  name: "get_events",
  description: "Lists club events with revenue and expense totals.",
  action: "events.read",
  permission: PERMISSIONS.VIEW_EXPENSES,
  risk: "read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  outputSchema: {
    type: "object",
    properties: { events: { type: "array" } },
    required: ["events"],
  },
  async execute(actor) {
    return { events: await listEventsForClub(actor.clubId) };
  },
});

export const getEvent = defineTool<{ event_id: string }, { event: unknown }>({
  name: "get_event",
  description: "Returns one event with linked invoices, revenues and expenses.",
  action: "events.read",
  permission: PERMISSIONS.VIEW_EXPENSES,
  risk: "read",
  inputSchema: {
    type: "object",
    properties: { event_id: { type: "string" } },
    required: ["event_id"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { event: { type: "object" } },
    required: ["event"],
  },
  async execute(actor, input) {
    if (!input?.event_id) throw new ToolError("event_id requis", "EVENT_ID_REQUIRED");
    return { event: await getEventForClub(actor.clubId, input.event_id) };
  },
});

export const createEvent = defineTool<
  {
    name: string;
    start_date: string;
    end_date?: string;
    description?: string;
    event_type_id?: string;
  },
  { event: unknown }
>({
  name: "create_event",
  description: "Creates a club event (manifestation).",
  action: "events.create",
  permission: PERMISSIONS.MANAGE_EXPENSES,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      start_date: { type: "string", description: "ISO date" },
      end_date: { type: "string" },
      description: { type: "string" },
      event_type_id: { type: "string" },
    },
    required: ["name", "start_date"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { event: { type: "object" } },
    required: ["event"],
  },
  async execute(actor, input) {
    const event = await createEventForClub({
      clubId: actor.clubId,
      name: input.name,
      description: input.description,
      startDate: input.start_date,
      endDate: input.end_date,
      eventTypeId: input.event_type_id,
    });
    return { event };
  },
});

export const updateEvent = defineTool<
  {
    event_id: string;
    name: string;
    start_date: string;
    end_date?: string;
    description?: string;
    status?: string;
    event_type_id?: string;
  },
  { event: unknown }
>({
  name: "update_event",
  description: "Updates a club event.",
  action: "events.update",
  permission: PERMISSIONS.MANAGE_EXPENSES,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      event_id: { type: "string" },
      name: { type: "string" },
      start_date: { type: "string" },
      end_date: { type: "string" },
      description: { type: "string" },
      status: { type: "string" },
      event_type_id: { type: "string" },
    },
    required: ["event_id", "name", "start_date"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { event: { type: "object" } },
    required: ["event"],
  },
  async execute(actor, input) {
    const event = await updateEventForClub({
      clubId: actor.clubId,
      eventId: input.event_id,
      name: input.name,
      description: input.description,
      startDate: input.start_date,
      endDate: input.end_date,
      status: input.status,
      eventTypeId: input.event_type_id,
    });
    return { event };
  },
});

export const completeEvent = defineTool<
  { event_id: string; name: string; start_date: string },
  { event: unknown }
>({
  name: "complete_event",
  description: "Marks an event as completed.",
  action: "events.update",
  permission: PERMISSIONS.MANAGE_EXPENSES,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      event_id: { type: "string" },
      name: { type: "string" },
      start_date: { type: "string" },
    },
    required: ["event_id", "name", "start_date"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { event: { type: "object" } },
    required: ["event"],
  },
  async execute(actor, input) {
    const event = await updateEventForClub({
      clubId: actor.clubId,
      eventId: input.event_id,
      name: input.name,
      startDate: input.start_date,
      status: "completed",
    });
    return { event };
  },
});
