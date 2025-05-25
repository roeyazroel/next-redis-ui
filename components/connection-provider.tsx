"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Connection = {
  id: string
  name: string
  host: string
  port: number
  username?: string
  password?: string
  tls?: boolean
  isConnected: boolean
}

type ConnectionContextType = {
  connections: Connection[]
  activeConnection: Connection | null
  addConnection: (connection: Omit<Connection, "id" | "isConnected">) => Promise<void>
  removeConnection: (id: string) => Promise<void>
  connectToRedis: (id: string) => Promise<void>
  disconnectFromRedis: (id: string) => Promise<void>
  setActiveConnection: (id: string | null) => void
  isLoading: boolean
  error: string | null
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

// Load connections from localStorage
const loadConnections = (): Connection[] => {
  if (typeof window === "undefined") return []

  const saved = localStorage.getItem("redis-connections")
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch (e) {
      console.error("Failed to parse saved connections", e)
    }
  }
  return []
}

// Save connections to localStorage
const saveConnections = (connections: Connection[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem("redis-connections", JSON.stringify(connections))
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>([])
  const [activeConnection, setActiveConnectionState] = useState<Connection | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved connections on mount
  useEffect(() => {
    const savedConnections = loadConnections()
    setConnections(savedConnections)

    // Set active connection if there's a connected one
    const connected = savedConnections.find((conn) => conn.isConnected)
    if (connected) {
      setActiveConnectionState(connected)
    }
  }, [])

  const addConnection = async (connection: Omit<Connection, "id" | "isConnected">) => {
    setIsLoading(true)
    setError(null)

    try {
      const newConnection = {
        ...connection,
        id: Math.random().toString(36).substring(2, 9),
        isConnected: false,
      }

      const updatedConnections = [...connections, newConnection]
      setConnections(updatedConnections)
      saveConnections(updatedConnections)

      return
    } catch (err: any) {
      setError(err.message || "Failed to add connection")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const removeConnection = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Disconnect if connected
      if (connections.find((conn) => conn.id === id)?.isConnected) {
        await disconnectFromRedis(id)
      }

      const updatedConnections = connections.filter((conn) => conn.id !== id)
      setConnections(updatedConnections)
      saveConnections(updatedConnections)

      if (activeConnection?.id === id) {
        setActiveConnectionState(null)
      }
    } catch (err: any) {
      setError(err.message || "Failed to remove connection")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const connectToRedis = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const connection = connections.find((conn) => conn.id === id)
      if (!connection) {
        throw new Error("Connection not found")
      }

      // Call the API to establish connection
      const response = await fetch("/api/redis/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(connection),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to connect to Redis")
      }

      // Update connection status
      const updatedConnections = connections.map((conn) => (conn.id === id ? { ...conn, isConnected: true } : conn))

      setConnections(updatedConnections)
      saveConnections(updatedConnections)

      // Set as active connection
      const updatedConnection = updatedConnections.find((conn) => conn.id === id)!
      setActiveConnectionState(updatedConnection)
    } catch (err: any) {
      setError(err.message || "Failed to connect to Redis")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const disconnectFromRedis = async (id: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // Call the API to disconnect
      const response = await fetch("/api/redis/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to disconnect from Redis")
      }

      // Update connection status
      const updatedConnections = connections.map((conn) => (conn.id === id ? { ...conn, isConnected: false } : conn))

      setConnections(updatedConnections)
      saveConnections(updatedConnections)

      // Clear active connection if it was this one
      if (activeConnection?.id === id) {
        setActiveConnectionState(null)
      }
    } catch (err: any) {
      setError(err.message || "Failed to disconnect from Redis")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const setActiveConnection = (id: string | null) => {
    if (id === null) {
      setActiveConnectionState(null)
      return
    }

    const connection = connections.find((conn) => conn.id === id)
    if (connection) {
      setActiveConnectionState(connection)
    }
  }

  return (
    <ConnectionContext.Provider
      value={{
        connections,
        activeConnection,
        addConnection,
        removeConnection,
        connectToRedis,
        disconnectFromRedis,
        setActiveConnection,
        isLoading,
        error,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnection() {
  const context = useContext(ConnectionContext)
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider")
  }
  return context
}
