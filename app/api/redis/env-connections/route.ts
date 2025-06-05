import { getEnvironmentConnectionConfigs } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get environment connection configurations
    const envConnections = getEnvironmentConnectionConfigs();

    console.log(
      `Serving ${envConnections.length} environment Redis connections`
    );

    return NextResponse.json(envConnections);
  } catch (error: any) {
    console.error("Error fetching environment connections:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch environment connections" },
      { status: 500 }
    );
  }
}
