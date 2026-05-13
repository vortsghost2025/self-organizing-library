import { NextResponse } from "next/server";
import { getSystemPulseData } from "@/lib/system-pulse-public";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getSystemPulseData());
}
