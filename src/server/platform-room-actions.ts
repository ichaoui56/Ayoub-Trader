"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getActiveAdmin } from "./dashboard-auth";
import { prisma } from "./prisma";

export type PlatformRoomActionState = { success: boolean; message: string; slug?: string };

const emptyState: PlatformRoomActionState = { success: false, message: "" };

function value(formData: FormData, key: string, label: string, maxLength: number, optional = false) {
  const raw = formData.get(key);
  if (typeof raw !== "string") throw new Error(`${label} is required.`);
  const cleaned = raw.trim();
  if ((!optional && !cleaned) || cleaned.length > maxLength) throw new Error(`${label} is invalid.`);
  return cleaned;
}

function actionFailure(error: unknown, fallback: string): PlatformRoomActionState {
  if (error instanceof Error && !(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return { success: false, message: error.message };
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return { success: false, message: "A room with a similar name already exists." };
  }
  console.error("[platform-rooms] Room management action failed:", error);
  return { success: false, message: fallback };
}

function refreshRoomViews(slug?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/rooms");
  if (slug) revalidatePath(`/dashboard/rooms/${slug}`);
}

async function requirePlatformAdmin() {
  const admin = await getActiveAdmin();
  if (!admin) throw new Error("An active administrator is required.");
  return admin;
}

export async function createPlatformRoom(
  _state: PlatformRoomActionState = emptyState,
  formData: FormData,
): Promise<PlatformRoomActionState> {
  try {
    const admin = await requirePlatformAdmin();
    const name = value(formData, "name", "Room name", 80);
    const category = value(formData, "category", "Category", 40);
    const description = value(formData, "description", "Description", 500, true);
    const coverImage = value(formData, "coverImage", "Cover image", 1000, true);
    if (coverImage) {
      try { if (new URL(coverImage).protocol !== "https:") throw new Error(); } catch { throw new Error("Room cover images must use an HTTPS URL."); }
    }
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60).replace(/-$/g, "");
    if (!slug) throw new Error("Use a room name containing at least one letter or number.");
    if (["new", "operations"].includes(slug)) throw new Error("That room name is reserved for a management page. Choose another name.");
    if (await prisma.vipRoom.findUnique({ where: { slug }, select: { id: true } })) {
      throw new Error("A room with that name already exists. Choose a different name.");
    }
    await prisma.$transaction(async (transaction) => {
      const room = await transaction.vipRoom.create({
        data: { slug, name, category, description, coverImage, isPublished: true },
        select: { id: true },
      });
      await transaction.vipAuditLog.create({
        data: { actorId: admin.id, action: "PLATFORM_ROOM_CREATED", subjectId: room.id, details: { slug, name, category, coverImage } },
      });
    });
    refreshRoomViews(slug);
    return { success: true, message: `${name} has been created.`, slug };
  } catch (error) {
    return actionFailure(error, "The room could not be created. Check the database connection and try again.");
  }
}

export async function assignPlatformRoomCustomer(
  _state: PlatformRoomActionState = emptyState,
  formData: FormData,
): Promise<PlatformRoomActionState> {
  try {
    const admin = await requirePlatformAdmin();
    const roomId = value(formData, "roomId", "Room", 40);
    const membershipId = value(formData, "membershipId", "Customer membership", 40);
    const [room, membership] = await Promise.all([
      prisma.vipRoom.findUnique({ where: { id: roomId }, select: { id: true, slug: true, name: true, isPublished: true } }),
      prisma.vipMembership.findUnique({ where: { id: membershipId }, select: { id: true, customerId: true, status: true, expiresAt: true, customer: { select: { name: true } } } }),
    ]);
    if (!room) throw new Error("This room no longer exists.");
    if (!room.isPublished) throw new Error("Publish this room before assigning customers.");
    if (!membership || membership.status !== "ACTIVE" || membership.expiresAt <= new Date()) {
      throw new Error("Only customers with an active, unexpired membership can be assigned.");
    }
    await prisma.$transaction(async (transaction) => {
      const customerAssignment = await transaction.vipRoomAssignment.findFirst({ where: { customerId: membership.customerId, roomId, revokedAt: null } });
      if (customerAssignment) throw new Error("This customer is already assigned to the room.");
      const current = await transaction.vipRoomAssignment.findUnique({ where: { membershipId_roomId: { membershipId, roomId } } });
      if (current && !current.revokedAt) throw new Error("This customer is already assigned to the room.");
      if (current) {
        await transaction.vipRoomAssignment.update({ where: { id: current.id }, data: { revokedAt: null, assignedAt: new Date() } });
      } else {
        await transaction.vipRoomAssignment.create({ data: { customerId: membership.customerId, membershipId, roomId } });
      }
      await transaction.vipAuditLog.create({
        data: { actorId: admin.id, action: "PLATFORM_ROOM_CUSTOMER_ASSIGNED", subjectId: membershipId, details: { roomId, customerId: membership.customerId } },
      });
      await transaction.vipNotification.create({
        data: { customerId: membership.customerId, title: "Private room access updated", message: `You have been assigned to ${room.name}.` },
      });
    });
    refreshRoomViews(room.slug);
    return { success: true, message: `${membership.customer.name} was assigned to ${room.name}.` };
  } catch (error) {
    return actionFailure(error, "The customer could not be assigned. Check the database connection and try again.");
  }
}

export async function removePlatformRoomCustomer(
  _state: PlatformRoomActionState = emptyState,
  formData: FormData,
): Promise<PlatformRoomActionState> {
  try {
    const admin = await requirePlatformAdmin();
    const roomId = value(formData, "roomId", "Room", 40);
    const assignmentId = value(formData, "assignmentId", "Room assignment", 40);
    const assignment = await prisma.vipRoomAssignment.findFirst({
      where: { id: assignmentId, roomId, revokedAt: null },
      select: { id: true, membershipId: true, customerId: true, room: { select: { slug: true } }, customer: { select: { name: true } } },
    });
    if (!assignment) throw new Error("This active room assignment was not found.");
    await prisma.$transaction(async (transaction) => {
      await transaction.vipRoomAssignment.update({ where: { id: assignment.id }, data: { revokedAt: new Date() } });
      await transaction.vipAuditLog.create({
        data: { actorId: admin.id, action: "PLATFORM_ROOM_CUSTOMER_REMOVED", subjectId: assignment.membershipId, details: { roomId, customerId: assignment.customerId } },
      });
      await transaction.vipNotification.create({
        data: { customerId: assignment.customerId, title: "Private room access updated", message: "Your access to a private room has been removed." },
      });
    });
    refreshRoomViews(assignment.room.slug);
    return { success: true, message: `${assignment.customer.name} was removed from the room.` };
  } catch (error) {
    return actionFailure(error, "The room assignment could not be removed. Try again.");
  }
}

export async function updatePlatformRoom(
  _state: PlatformRoomActionState = emptyState,
  formData: FormData,
): Promise<PlatformRoomActionState> {
  try {
    const admin = await requirePlatformAdmin();
    const roomId = value(formData, "roomId", "Room", 40);
    const name = value(formData, "name", "Room name", 80);
    const category = value(formData, "category", "Category", 40);
    const description = value(formData, "description", "Description", 500, true);
    const coverImage = value(formData, "coverImage", "Cover image", 1000, true);
    if (coverImage) {
      try { if (new URL(coverImage).protocol !== "https:") throw new Error(); } catch { throw new Error("Room cover images must use an HTTPS URL."); }
    }
    const isPublished = formData.get("isPublished") === "on";
    const room = await prisma.vipRoom.findUnique({ where: { id: roomId }, select: { id: true, slug: true } });
    if (!room) throw new Error("This room no longer exists.");
    await prisma.$transaction(async (transaction) => {
      await transaction.vipRoom.update({ where: { id: roomId }, data: { name, category, description, coverImage, isPublished } });
      await transaction.vipAuditLog.create({
        data: { actorId: admin.id, action: "PLATFORM_ROOM_UPDATED", subjectId: room.id, details: { name, category, description, coverImage, isPublished } },
      });
    });
    refreshRoomViews(room.slug);
    return { success: true, message: "Room details have been updated.", slug: room.slug };
  } catch (error) {
    return actionFailure(error, "The room could not be updated. Check the database connection and try again.");
  }
}

export async function deletePlatformRoom(
  _state: PlatformRoomActionState = emptyState,
  formData: FormData,
): Promise<PlatformRoomActionState> {
  try {
    const admin = await requirePlatformAdmin();
    const roomId = value(formData, "roomId", "Room", 40);
    const result = await prisma.$transaction(async (transaction) => {
      const room = await transaction.vipRoom.findUnique({
        where: { id: roomId },
        include: { _count: { select: { assignments: true, transactions: true, posts: true } } },
      });
      if (!room) throw new Error("This room no longer exists.");
      if (room._count.assignments || room._count.transactions || room._count.posts) {
        return { success: false as const, message: "This room has assignment, post, or transaction history and cannot be deleted." };
      }
      await transaction.vipRoom.delete({ where: { id: roomId } });
      await transaction.vipAuditLog.create({
        data: { actorId: admin.id, action: "PLATFORM_ROOM_DELETED", subjectId: room.id, details: { slug: room.slug, name: room.name } },
      });
      return { success: true as const, slug: room.slug, name: room.name };
    });
    if (!result.success) return result;
    refreshRoomViews(result.slug);
    return { success: true, message: `${result.name} has been deleted.` };
  } catch (error) {
    return actionFailure(error, "The room could not be deleted. Try again.");
  }
}