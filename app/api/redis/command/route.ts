import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, executeCommand } from "@/lib/redis"

export async function POST(request: NextRequest) {
  try {
    const { connectionId, command } = await request.json()

    if (!connectionId || !command) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const client = getRedisClient(connectionId)
    if (!client) {
      return NextResponse.json({ error: "Redis connection not found" }, { status: 404 })
    }

    try {
      const result = await executeCommand(client, command)
      return NextResponse.json({ result })
    } catch (error: any) {
      console.error(`Error executing command ${command}:`, error)
      return NextResponse.json({ error: error.message || "Command execution failed" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error executing Redis command:", error)
    return NextResponse.json({ error: error.message || "Failed to execute Redis command" }, { status: 500 })
  }
}
