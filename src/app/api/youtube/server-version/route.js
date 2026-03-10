import { NextResponse } from "next/server";

export const REQUIRED_SERVER_VERSION = process.env.NEXT_PUBLIC_REQUIRED_SERVER_VERSION;

export async function GET() {
  return NextResponse.json({ requiredVersion: REQUIRED_SERVER_VERSION });
}
