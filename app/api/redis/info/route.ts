import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, getServerInfo, getMemoryStats } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const connectionId = searchParams.get("connectionId")

    if (!connectionId) {
      return NextResponse.json({ error: "Missing connection ID" }, { status: 400 })
    }

    const client = getRedisClient(connectionId)
    if (!client) {
      return NextResponse.json({ error: "Redis connection not found" }, { status: 404 })
    }

    const [info, memory] = await Promise.all([getServerInfo(client), getMemoryStats(client)])

    // Extract and format relevant information
    const serverInfo = info.server || {}
    const clientsInfo = info.clients || {}
    const statsInfo = info.stats || {}
    const keyspaceInfo = info.keyspace || {}

    // Parse keyspace info
    const keyspace = Object.entries(keyspaceInfo).map(([db, value]) => {
      const dbInfo: Record<string, string> = {}
      ;(value as string).split(",").forEach((item) => {
        const [key, val] = item.split("=")
        if (key && val) {
          dbInfo[key] = val
        }
      })
      return {
        db,
        keys: Number.parseInt(dbInfo.keys || "0"),
        expires: Number.parseInt(dbInfo.expires || "0"),
        avgTtl: Number.parseInt(dbInfo.avg_ttl || "0"),
      }
    })

    // Format monitoring data
    const monitoringData = {
      memory,
      clients: {
        connected: Number.parseInt(clientsInfo.connected_clients || "0"),
        blocked: Number.parseInt(clientsInfo.blocked_clients || "0"),
        maxClients: Number.parseInt(clientsInfo.maxclients || "10000"),
      },
      stats: {
        totalConnections: Number.parseInt(statsInfo.total_connections_received || "0"),
        totalCommands: Number.parseInt(statsInfo.total_commands_processed || "0"),
        opsPerSec: Number.parseInt(statsInfo.instantaneous_ops_per_sec || "0"),
        hitRate: calculateHitRate(statsInfo),
        keyspace: keyspace.length > 0 ? keyspace[0] : { keys: 0, expires: 0, avgTtl: 0 },
      },
      server: {
        version: serverInfo.redis_version || "unknown",
        mode: serverInfo.redis_mode || "standalone",
        os: serverInfo.os || "unknown",
        uptime: Number.parseInt(serverInfo.uptime_in_seconds || "0"),
      },
    }

    return NextResponse.json(monitoringData)
  } catch (error: any) {
    console.error("Error fetching Redis info:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch Redis info" }, { status: 500 })
  }
}

// Calculate hit rate from keyspace hits and misses
function calculateHitRate(stats: Record<string, string>): number {
  const hits = Number.parseInt(stats.keyspace_hits || "0")
  const misses = Number.parseInt(stats.keyspace_misses || "0")

  if (hits + misses === 0) return 0

  return Math.round((hits / (hits + misses)) * 100)
}
