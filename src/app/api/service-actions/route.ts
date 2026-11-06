import { NextResponse } from "next/server";
import type { ServiceAction } from "@/lib/dashboard-data";
import { getLatestServiceRequest, recordServiceAction } from "@/lib/database";

export const runtime = "nodejs";

const actionMessages: Record<Exclude<ServiceAction, "id-card-request">, string> = {
  "meal-scan":
    "Your demo meal pass is ready. Show your student QR code at the cafeteria.",
  "library-search":
    "The library catalogue demo is ready. You currently have 2 books checked out.",
  "clearance-details":
    "Your demo clearance is 75% complete. Finance Office is the next pending step.",
};

const validActions = new Set<string>([
  "meal-scan",
  "library-search",
  "clearance-details",
  "id-card-request",
]);

function isServiceAction(action: unknown): action is ServiceAction {
  return typeof action === "string" && validActions.has(action);
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null || !("action" in payload)) {
    return NextResponse.json({ error: "Choose a supported service action." }, { status: 400 });
  }

  const action = payload.action;
  if (!isServiceAction(action)) {
    return NextResponse.json({ error: "Choose a supported service action." }, { status: 400 });
  }

  recordServiceAction(action);
  let message: string;
  if (action === "id-card-request") {
    const latestRequest = getLatestServiceRequest();
    message = latestRequest
      ? `Your ID card request is ${latestRequest.status}.`
      : "There is no ID card request on file.";
  } else {
    message = actionMessages[action];
  }

  return NextResponse.json({
    message,
    demo: true,
  });
}
