import { type NextRequest, NextResponse } from "next/server"
import { createRedisClient, type RedisConnectionConfig } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const config: RedisConnectionConfig = await request.json()

    if (!config.host || !config.port) {
      return NextResponse.json({ error: "Missing required connection parameters" }, { status: 400 })
    }

    // Try to connect to Redis
    const client = await createRedisClient(config)

    // Test the connection with a PING
    await client.ping()

    return NextResponse.json({ success: true, id: config.id })
  } catch (error: any) {
    console.error("Redis connection error:", error)
    return NextResponse.json({ error: error.message || "Failed to connect to Redis" }, { status: 500 })
  }
}
