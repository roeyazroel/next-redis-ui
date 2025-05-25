import { type NextRequest, NextResponse } from "next/server"
import { getRedisClient, getKeyValue, setKeyValue, deleteKey } from "@/lib/redis"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const connectionId = searchParams.get("connectionId")
    const key = searchParams.get("key")
    const type = searchParams.get("type") || undefined

    if (!connectionId || !key) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const client = getRedisClient(connectionId)
    if (!client) {
      return NextResponse.json({ error: "Redis connection not found" }, { status: 404 })
    }

    try {
      const value = await getKeyValue(client, key, type || undefined)
      return NextResponse.json({ value })
    } catch (error: any) {
      console.error(`Error getting value for key ${key}:`, error)
      return NextResponse.json({ error: error.message || `Failed to get value for key ${key}` }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error fetching Redis key value:", error)
    return NextResponse.json({ error: error.message || "Failed to fetch Redis key value" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { connectionId, key, value, type } = await request.json()

    if (!connectionId || !key || value === undefined || !type) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const client = getRedisClient(connectionId)
    if (!client) {
      return NextResponse.json({ error: "Redis connection not found" }, { status: 404 })
    }

    const success = await setKeyValue(client, key, value, type)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to set key value" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error setting Redis key value:", error)
    return NextResponse.json({ error: error.message || "Failed to set Redis key value" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const connectionId = searchParams.get("connectionId")
    const key = searchParams.get("key")

    if (!connectionId || !key) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    const client = getRedisClient(connectionId)
    if (!client) {
      return NextResponse.json({ error: "Redis connection not found" }, { status: 404 })
    }

    const success = await deleteKey(client, key)

    if (success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "Failed to delete key" }, { status: 500 })
    }
  } catch (error: any) {
    console.error("Error deleting Redis key:", error)
    return NextResponse.json({ error: error.message || "Failed to delete Redis key" }, { status: 500 })
  }
}
