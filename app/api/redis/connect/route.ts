import { createRedisClient, type RedisConnectionConfig } from "@/lib/redis";
import { type NextRequest, NextResponse } from "next/server";

interface ConnectRequest {
  config?: RedisConnectionConfig;
  isEnvironmentConnection?: boolean;
  connectionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RedisConnectionConfig | ConnectRequest = await request.json();

    // Handle backward compatibility - if body has host/port directly, it's the old format
    let config: RedisConnectionConfig;
    let isEnvironmentConnection = false;

    if ("host" in body && "port" in body) {
      // Old format - direct RedisConnectionConfig
      config = body;
    } else {
      // New format - ConnectRequest wrapper
      const connectRequest = body as ConnectRequest;
      if (!connectRequest.config) {
        return NextResponse.json(
          { error: "Missing connection configuration" },
          { status: 400 }
        );
      }
      config = connectRequest.config;
      isEnvironmentConnection = connectRequest.isEnvironmentConnection || false;
    }

    if (!config.host || !config.port) {
      return NextResponse.json(
        { error: "Missing required connection parameters" },
        { status: 400 }
      );
    }

    console.log(
      `Connecting to Redis: ${
        config.name || config.host
      } (Environment: ${isEnvironmentConnection})`
    );

    // Try to connect to Redis
    const client = await createRedisClient(config);

    // Test the connection with a PING
    await client.ping();

    console.log(`✓ Successfully connected to ${config.name || config.host}`);

    return NextResponse.json({
      success: true,
      id: config.id,
      isEnvironmentConnection,
    });
  } catch (error: any) {
    console.error("Redis connection error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect to Redis" },
      { status: 500 }
    );
  }
}
