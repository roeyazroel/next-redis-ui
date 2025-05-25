import { type NextRequest, NextResponse } from "next/server"
import { disconnectRedisClient } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "Missing connection ID" }, { status: 400 })
    }

    await disconnectRedisClient(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Redis disconnect error:", error)
    return NextResponse.json({ error: error.message || "Failed to disconnect from Redis" }, { status: 500 })
  }
}
