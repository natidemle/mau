import { NextResponse } from "next/server";
import { getDashboardFromDatabase } from "@/lib/database";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({ ...getDashboardFromDatabase(), demo: true });
}
