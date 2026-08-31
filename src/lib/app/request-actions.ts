// Shared helpers for reception request action APIs.
// Each helper performs a state transition, writes an event, AppNotification
// for the guest, and an audit log, inside a single transaction.

import { db } from "@/lib/db";

export interface TransitionInput {
  requestId: string;
  staffId: string;
  staffName: string;
  note?: string;
}

export interface TransitionResult {
  ok: boolean;
  error?: string;
  status?: number;
  request?: {
    id: string;
    requestNumber: number;
    guestId: string;
    stayId: string;
    title: string;
    fromStatus: string;
    toStatus: string;
  };
}

export async function notifyGuest(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  guestId: string,
  stayId: string,
  requestId: string,
  title: string,
  body: string,
  type: string,
): Promise<void> {
  await tx.appNotification.create({
    data: { recipientRole: "GUEST", recipientId: guestId, stayId, requestId, title, body, type },
  });
}

export async function loadRequestForTransition(requestId: string) {
  return db.guestRequest.findUnique({
    where: { id: requestId },
    include: { stay: { include: { guest: true } } },
  });
}

// Validates a state transition is allowed. Returns true if allowed, false otherwise.
export function isTransitionAllowed(from: string, to: string): boolean {
  const allowed: Record<string, string[]> = {
    NEW: ["ACKNOWLEDGED", "ASSIGNED", "IN_PROGRESS", "WAITING", "COMPLETED", "CANCELLED", "REJECTED"],
    ACKNOWLEDGED: ["ASSIGNED", "IN_PROGRESS", "WAITING", "COMPLETED", "CANCELLED", "REJECTED"],
    ASSIGNED: ["IN_PROGRESS", "WAITING", "COMPLETED", "CANCELLED", "REJECTED"],
    IN_PROGRESS: ["WAITING", "COMPLETED", "CANCELLED", "REJECTED"],
    WAITING: ["IN_PROGRESS", "COMPLETED", "CANCELLED", "REJECTED"],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: [],
  };
  return (allowed[from] || []).includes(to);
}
