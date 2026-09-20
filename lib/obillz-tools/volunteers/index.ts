import { PERMISSIONS } from "@/lib/auth/permissions-shared";
import { defineTool } from "@/lib/obillz-tools/core/defineTool";
import { ToolError } from "@/lib/obillz-tools/core/errors";
import {
  assignVolunteerForClub,
  createPlanningForClub,
  createShiftForClub,
  listPlanningsForClub,
  removeVolunteerForClub,
} from "./service";

export const getPlannings = defineTool<
  Record<string, never>,
  { plannings: unknown[] }
>({
  name: "get_plannings",
  description: "Lists volunteer plannings of the club.",
  action: "volunteers.read",
  permission: PERMISSIONS.VIEW_PLANNINGS,
  risk: "read",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  outputSchema: {
    type: "object",
    properties: { plannings: { type: "array" } },
    required: ["plannings"],
  },
  async execute(actor) {
    return { plannings: await listPlanningsForClub(actor.clubId) };
  },
});

export const createPlanning = defineTool<
  {
    name: string;
    date: string;
    description?: string;
    event_id?: string;
    slots?: Array<{
      location: string;
      start_time: string;
      end_time: string;
      required_people?: number;
    }>;
  },
  { planning: unknown }
>({
  name: "create_planning",
  description:
    "Creates a volunteer planning, optionally with shifts (postes). Example: 10 bar shifts from 10:00 to 12:00.",
  action: "volunteers.planning.create",
  permission: PERMISSIONS.MANAGE_PLANNINGS,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      name: { type: "string" },
      date: { type: "string" },
      description: { type: "string" },
      event_id: { type: "string" },
      slots: { type: "array" },
    },
    required: ["name", "date"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { planning: { type: "object" } },
    required: ["planning"],
  },
  async execute(actor, input) {
    const planning = await createPlanningForClub({
      clubId: actor.clubId,
      actorUserId: actor.userId,
      name: input.name,
      date: input.date,
      description: input.description,
      eventId: input.event_id,
      slots: input.slots?.map((s) => ({
        location: s.location,
        startTime: s.start_time,
        endTime: s.end_time,
        requiredPeople: s.required_people,
      })),
    });
    return { planning };
  },
});

export const createShift = defineTool<
  {
    planning_id: string;
    location: string;
    start_time: string;
    end_time: string;
    required_people?: number;
    slot_date?: string;
  },
  { shift: unknown }
>({
  name: "create_shift",
  description: "Creates a volunteer shift (poste) on a planning.",
  action: "volunteers.shift.create",
  permission: PERMISSIONS.MANAGE_PLANNINGS,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      planning_id: { type: "string" },
      location: { type: "string" },
      start_time: { type: "string" },
      end_time: { type: "string" },
      required_people: { type: "number" },
      slot_date: { type: "string" },
    },
    required: ["planning_id", "location", "start_time", "end_time"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { shift: { type: "object" } },
    required: ["shift"],
  },
  async execute(actor, input) {
    const shift = await createShiftForClub({
      clubId: actor.clubId,
      planningId: input.planning_id,
      location: input.location,
      startTime: input.start_time,
      endTime: input.end_time,
      requiredPeople: input.required_people,
      slotDate: input.slot_date,
    });
    return { shift };
  },
});

export const assignVolunteer = defineTool<
  { planning_id: string; slot_id: string; member_id: string },
  { assignment: unknown }
>({
  name: "assign_volunteer",
  description: "Assigns a club member to a volunteer shift.",
  action: "volunteers.assign",
  permission: PERMISSIONS.MANAGE_PLANNINGS,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      planning_id: { type: "string" },
      slot_id: { type: "string" },
      member_id: { type: "string" },
    },
    required: ["planning_id", "slot_id", "member_id"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { assignment: { type: "object" } },
    required: ["assignment"],
  },
  async execute(actor, input) {
    const assignment = await assignVolunteerForClub({
      clubId: actor.clubId,
      planningId: input.planning_id,
      slotId: input.slot_id,
      memberId: input.member_id,
    });
    return { assignment };
  },
});

export const removeVolunteer = defineTool<
  { planning_id: string; assignment_id: string },
  { success: true }
>({
  name: "remove_volunteer",
  description: "Removes a volunteer assignment from a shift.",
  action: "volunteers.assign.remove",
  permission: PERMISSIONS.MANAGE_PLANNINGS,
  risk: "write",
  inputSchema: {
    type: "object",
    properties: {
      planning_id: { type: "string" },
      assignment_id: { type: "string" },
    },
    required: ["planning_id", "assignment_id"],
    additionalProperties: false,
  },
  outputSchema: {
    type: "object",
    properties: { success: { type: "boolean" } },
    required: ["success"],
  },
  async execute(actor, input) {
    if (!input.assignment_id) {
      throw new ToolError("assignment_id requis", "ASSIGNMENT_ID_REQUIRED");
    }
    return removeVolunteerForClub({
      clubId: actor.clubId,
      planningId: input.planning_id,
      assignmentId: input.assignment_id,
    });
  },
});
