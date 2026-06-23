import { NextResponse } from "next/server";
import { swaggerSpec } from "@/swagger/swaggerSpec";

export async function GET() {
  return NextResponse.json(swaggerSpec);
}