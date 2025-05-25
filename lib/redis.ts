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
    return redisClients.get(config.id)!
  }

  // Create new Redis client
  const client = new Redis({
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    tls: config.tls ? {} : undefined,
    retryStrategy: (times) => {
      // Retry with exponential backoff
      return Math.min(times * 50, 2000)
    },
  })

  // Store the client
  redisClients.set(config.id, client)

  return client
}

export function getRedisClient(connectionId: string): Redis | undefined {
  return redisClients.get(connectionId)
}

export async function disconnectRedisClient(connectionId: string): Promise<void> {
  const client = redisClients.get(connectionId)
  if (client) {
    await client.quit()
    redisClients.delete(connectionId)
  }
}

export async function disconnectAllClients(): Promise<void> {
  for (const [id, client] of redisClients.entries()) {
    await client.quit()
    redisClients.delete(id)
  }
}

// Helper functions for common Redis operations
export async function getKeys(client: Redis, pattern = "*"): Promise<string[]> {
  return client.keys(pattern)
}

export async function getKeyType(client: Redis, key: string): Promise<string> {
  return client.type(key)
}

export async function getKeyTTL(client: Redis, key: string): Promise<number> {
  return client.ttl(key)
}

export async function getKeyMemoryUsage(client: Redis, key: string): Promise<number> {
  return client.memory("USAGE", key)
}

export async function getKeyValue(client: Redis, key: string, type?: string): Promise<any> {
  if (!type) {
    type = await client.type(key)
  }

  switch (type.toLowerCase()) {
    case "string":
      return client.get(key)
    case "hash":
      return client.hgetall(key)
    case "list":
      return client.lrange(key, 0, -1)
    case "set":
      return client.smembers(key)
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
        // Fallback to string and parse
        const stringValue = await client.get(key)
        try {
          return JSON.parse(stringValue || "")
        } catch (e) {
          return stringValue
        }
      }
    default:
      return null
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
          // Fallback to string
          await client.set(key, JSON.stringify(value))
        }
        break
      default:
        return false
    }
    return true
  } catch (error) {
    console.error("Error setting key value:", error)
    return false
  }
}

export async function deleteKey(client: Redis, key: string): Promise<boolean> {
  try {
    await client.del(key)
    return true
  } catch (error) {
    console.error("Error deleting key:", error)
    return false
  }
}

export async function executeCommand(client: Redis, command: string): Promise<any> {
  try {
    const parts = command.trim().split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    // Execute the command
    return await client.call(cmd, ...args)
  } catch (error) {
    console.error("Error executing command:", error)
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
