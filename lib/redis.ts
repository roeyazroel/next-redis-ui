import { Redis } from "ioredis"

export type RedisConnectionConfig = {
  id: string
  name: string
  host: string
  port: number
  username?: string
  password?: string
  tls?: boolean
}

// Store active Redis client instances
const redisClients: Map<string, Redis> = new Map()

export async function createRedisClient(config: RedisConnectionConfig): Promise<Redis> {
  // Check if we already have a client for this connection
  if (redisClients.has(config.id)) {
    const existingClient = redisClients.get(config.id)!

    // Check if the client is still connected
    if (existingClient.status === "ready" || existingClient.status === "connect") {
      return existingClient
    }

    // If not connected, remove it and create a new one
    await disconnectRedisClient(config.id)
  }

  console.log(`Creating new Redis client for ${config.name} (${config.host}:${config.port})`)

  // Create new Redis client
  const client = new Redis({
    host: config.host,
    port: config.port,
    username: config.username || undefined,
    password: config.password || undefined,
    tls: config.tls ? {} : undefined,
    retryStrategy: (times) => {
      // Retry with exponential backoff
      const delay = Math.min(times * 50, 2000)
      console.log(`Redis connection retry attempt ${times}, delay: ${delay}ms`)
      return delay
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    connectTimeout: 10000,
  })

  // Set up event handlers
  client.on("error", (err) => {
    console.error(`Redis client error for ${config.name}:`, err)
  })

  client.on("connect", () => {
    console.log(`Redis client connected for ${config.name}`)
  })

  client.on("ready", () => {
    console.log(`Redis client ready for ${config.name}`)
  })

  client.on("close", () => {
    console.log(`Redis client closed for ${config.name}`)
  })

  client.on("reconnecting", () => {
    console.log(`Redis client reconnecting for ${config.name}`)
  })

  client.on("end", () => {
    console.log(`Redis client ended for ${config.name}`)
    // Remove from the map when the connection ends
    redisClients.delete(config.id)
  })

  // Store the client
  redisClients.set(config.id, client)

  return client
}

export function getRedisClient(connectionId: string): Redis | undefined {
  const client = redisClients.get(connectionId)

  if (!client) {
    console.warn(`Redis client not found for connection ID: ${connectionId}`)
    return undefined
  }

  // Check if the client is still connected
  if (client.status !== "ready" && client.status !== "connect") {
    console.warn(`Redis client for ${connectionId} is not ready (status: ${client.status})`)
  }

  return client
}

export async function disconnectRedisClient(connectionId: string): Promise<void> {
  const client = redisClients.get(connectionId)
  if (client) {
    console.log(`Disconnecting Redis client for ${connectionId}`)
    try {
      await client.quit()
    } catch (error) {
      console.error(`Error disconnecting Redis client for ${connectionId}:`, error)
      // Force disconnect if quit fails
      client.disconnect()
    }
    redisClients.delete(connectionId)
  }
}

export async function disconnectAllClients(): Promise<void> {
  console.log(`Disconnecting all Redis clients (${redisClients.size} clients)`)
  for (const [id, client] of redisClients.entries()) {
    await disconnectRedisClient(id)
  }
}

// Helper functions for common Redis operations
export async function getKeys(client: Redis, pattern = "*"): Promise<string[]> {
  try {
    return await client.keys(pattern)
  } catch (error) {
    console.error(`Error getting keys with pattern ${pattern}:`, error)
    throw error
  }
}

export async function getKeyType(client: Redis, key: string): Promise<string> {
  try {
    return await client.type(key)
  } catch (error) {
    console.error(`Error getting type for key ${key}:`, error)
    throw error
  }
}

export async function getKeyTTL(client: Redis, key: string): Promise<number> {
  try {
    return await client.ttl(key)
  } catch (error) {
    console.error(`Error getting TTL for key ${key}:`, error)
    throw error
  }
}

export async function getKeyMemoryUsage(client: Redis, key: string): Promise<number> {
  try {
    return await client.memory("USAGE", key)
  } catch (error) {
    console.error(`Error getting memory usage for key ${key}:`, error)
    // Return 0 if memory usage command is not supported
    return 0
  }
}

export async function getKeyValue(client: Redis, key: string, type?: string): Promise<any> {
  if (!type) {
    try {
      type = await client.type(key)
    } catch (error) {
      console.error(`Error getting type for key ${key}:`, error)
      throw new Error(`Failed to determine type for key ${key}`)
    }
  }

  try {
    switch (type.toLowerCase()) {
      case "string":
        return await client.get(key)
      case "hash":
        return await client.hgetall(key)
      case "list":
        return await client.lrange(key, 0, -1)
      case "set":
        return await client.smembers(key)
      case "zset":
        const result = await client.zrange(key, 0, -1, "WITHSCORES")
        // Convert flat array to array of objects with member and score
        const formattedResult = []
        for (let i = 0; i < result.length; i += 2) {
          formattedResult.push({
            member: result[i],
            score: Number.parseFloat(result[i + 1]),
          })
        }
        return formattedResult
      case "json":
        try {
          // Try to use RedisJSON module if available
          const jsonValue = await client.call("JSON.GET", key)
          return JSON.parse(jsonValue as string)
        } catch (error) {
          console.warn(`RedisJSON module not available, falling back to string parsing for key ${key}`)
          // Fallback to string and parse
          const stringValue = await client.get(key)
          try {
            return JSON.parse(stringValue || "")
          } catch (e) {
            return stringValue
          }
        }
      case "none":
        throw new Error(`Key ${key} does not exist`)
      default:
        console.warn(`Unsupported Redis data type: ${type} for key ${key}`)
        return null
    }
  } catch (error) {
    console.error(`Error getting value for key ${key} of type ${type}:`, error)
    throw error
  }
}

export async function setKeyValue(client: Redis, key: string, value: any, type: string): Promise<boolean> {
  try {
    switch (type.toLowerCase()) {
      case "string":
        if (typeof value === "object") {
          value = JSON.stringify(value)
        }
        await client.set(key, value)
        break
      case "hash":
        if (typeof value === "object") {
          const multi = client.multi()
          // Delete existing hash
          await client.del(key)
          // Set new hash values
          for (const [field, val] of Object.entries(value)) {
            multi.hset(key, field, String(val))
          }
          await multi.exec()
        }
        break
      case "list":
        if (Array.isArray(value)) {
          const multi = client.multi()
          // Delete existing list
          await client.del(key)
          // Push new values
          if (value.length > 0) {
            multi.rpush(key, ...value.map((v) => String(v)))
          }
          await multi.exec()
        }
        break
      case "set":
        if (Array.isArray(value)) {
          const multi = client.multi()
          // Delete existing set
          await client.del(key)
          // Add new members
          if (value.length > 0) {
            multi.sadd(key, ...value.map((v) => String(v)))
          }
          await multi.exec()
        }
        break
      case "zset":
        if (Array.isArray(value)) {
          const multi = client.multi()
          // Delete existing sorted set
          await client.del(key)
          // Add new members with scores
          for (const item of value) {
            if (item.member && item.score !== undefined) {
              multi.zadd(key, item.score, String(item.member))
            }
          }
          await multi.exec()
        }
        break
      case "json":
        try {
          // Try to use RedisJSON module if available
          await client.call("JSON.SET", key, ".", JSON.stringify(value))
        } catch (error) {
          console.warn(`RedisJSON module not available, falling back to string storage for key ${key}`)
          // Fallback to string
          await client.set(key, JSON.stringify(value))
        }
        break
      default:
        console.warn(`Unsupported Redis data type: ${type} for key ${key}`)
        return false
    }
    return true
  } catch (error) {
    console.error(`Error setting value for key ${key} of type ${type}:`, error)
    throw error
  }
}

export async function deleteKey(client: Redis, key: string): Promise<boolean> {
  try {
    await client.del(key)
    return true
  } catch (error) {
    console.error(`Error deleting key ${key}:`, error)
    throw error
  }
}

export async function executeCommand(client: Redis, command: string): Promise<any> {
  try {
    const parts = command.trim().split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    console.log(`Executing Redis command: ${cmd} ${args.join(" ")}`)

    // Execute the command
    return await client.call(cmd, ...args)
  } catch (error) {
    console.error(`Error executing command: ${command}`, error)
    throw error
  }
}

export async function getServerInfo(client: Redis): Promise<any> {
  try {
    const info = await client.info()
    const sections: Record<string, Record<string, string>> = {}

    let currentSection = ""

    // Parse INFO command output
    info.split("\n").forEach((line) => {
      if (line.startsWith("#")) {
        currentSection = line.substring(2).trim().toLowerCase()
        sections[currentSection] = {}
      } else if (line.includes(":")) {
        const [key, value] = line.split(":")
        if (currentSection && key && value !== undefined) {
          sections[currentSection][key.trim()] = value.trim()
        }
      }
    })

    return sections
  } catch (error) {
    console.error("Error getting server info:", error)
    throw error
  }
}

export async function getMemoryStats(client: Redis): Promise<any> {
  try {
    const info = await client.info("memory")
    const memory: Record<string, string> = {}

    // Parse memory section
    info.split("\n").forEach((line) => {
      if (line.includes(":")) {
        const [key, value] = line.split(":")
        if (key && value !== undefined) {
          memory[key.trim()] = value.trim()
        }
      }
    })

    return {
      used: parseMemoryValue(memory["used_memory_human"]),
      peak: parseMemoryValue(memory["used_memory_peak_human"]),
      rss: parseMemoryValue(memory["used_memory_rss_human"]),
      fragmentation: Number.parseFloat(memory["mem_fragmentation_ratio"] || "0"),
    }
  } catch (error) {
    console.error("Error getting memory stats:", error)
    throw error
  }
}

// Helper to parse memory values like "1.05M" to MB
function parseMemoryValue(value = "0"): number {
  if (!value) return 0

  const unit = value.slice(-1).toUpperCase()
  const number = Number.parseFloat(value.slice(0, -1))

  switch (unit) {
    case "K":
      return number / 1024
    case "M":
      return number
    case "G":
      return number * 1024
    default:
      return Number.parseFloat(value) / (1024 * 1024) // Convert bytes to MB
  }
}
