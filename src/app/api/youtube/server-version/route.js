import { NextResponse } from "next/server";

export const REQUIRED_SERVER_VERSION = "2.0.0";

export async function GET() {
  return NextResponse.json({ requiredVersion: REQUIRED_SERVER_VERSION });
}
