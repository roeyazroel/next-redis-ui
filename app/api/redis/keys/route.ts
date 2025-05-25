import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, getKeys, getKeyType, getKeyTTL, getKeyMemoryUsage } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const connectionId = searchParams.get("connectionId")
    const pattern = searchParams.get("pattern") || "*"

    if (!connectionId) {
      return NextResponse.json({ error: "Missing connection ID" }, { status: 400 })
    }

    const client = getRedisClient(connectionId)
    if (!client) {
      return NextResponse.json({ error: "Redis connection not found" }, { status: 404 })
    }

    // Get all keys matching the pattern
    const keys = await getKeys(client, pattern)

    // Get additional info for each key
    const keyInfoPromises = keys.map(async (key) => {
      const [type, ttl, memoryUsage] = await Promise.all([
        getKeyType(client!, key),
        getKeyTTL(client!, key),
        getKeyMemoryUsage(client!, key).catch(() => 0), // Memory usage might not be available
      ])

      // Format memory size
      let size = ""
      if (memoryUsage < 1024) {
        size = `${memoryUsage} B`
      } else if (memoryUsage < 1024 * 1024) {
        size = `${(memoryUsage / 1024).toFixed(1)} KB`
      } else {
        size = `${(memoryUsage / (1024 * 1024)).toFixed(1)} MB`
      }

      return { key, type, ttl, size }
    })

    const keyInfo = await Promise.all(keyInfoPromises)

    return NextResponse.json({ keys: keyInfo })
  } catch (error: any) {
    console.error("Error fetching Redis keys:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch Redis keys" }, { status: 500 })
  }
}
