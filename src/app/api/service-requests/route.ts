import { NextResponse } from "next/server";
import {
  createIdCardRequest,
  listServiceRequests,
  recordServiceAction,
} from "@/lib/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ requests: listServiceRequests(), demo: true });
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (typeof payload !== "object" || payload === null || !("type" in payload) || !("reason" in payload)) {
    return NextResponse.json(
      { error: "Provide a request type and reason." },
      { status: 400 },
    );
  }

  if (payload.type !== "id-card" || typeof payload.reason !== "string") {
    return NextResponse.json(
      { error: "The supported request type is id-card." },
      { status: 400 },
    );
  }

  const reason = payload.reason.trim();
  if (reason.length < 10 || reason.length > 500) {
    return NextResponse.json(
      { error: "The reason must be between 10 and 500 characters." },
      { status: 400 },
    );
  }

  const serviceRequest = createIdCardRequest(reason);
  recordServiceAction("id-card-request");
  return NextResponse.json({ request: serviceRequest, demo: true }, { status: 201 });
}
