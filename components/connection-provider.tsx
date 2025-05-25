"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

type Connection = {
  id: string
  name: string
  host: string
  port: number
  username?: string
  password?: string
  isConnected: boolean
}

type ConnectionContextType = {
  connections: Connection[]
  activeConnection: Connection | null
  addConnection: (connection: Omit<Connection, "id" | "isConnected">) => void
  removeConnection: (id: string) => void
  connectToRedis: (id: string) => void
  disconnectFromRedis: (id: string) => void
  setActiveConnection: (id: string | null) => void
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined)

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>([
    {
      id: "1",
      name: "Local Redis",
      host: "localhost",
      port: 6379,
      isConnected: true,
    },
    {
      id: "2",
      name: "Production Redis",
      host: "redis.example.com",
      port: 6379,
      username: "admin",
      isConnected: false,
    },
  ])

  const [activeConnection, setActiveConnectionState] = useState<Connection | null>(connections[0])

  const addConnection = (connection: Omit<Connection, "id" | "isConnected">) => {
    const newConnection = {
      ...connection,
      id: Math.random().toString(36).substring(2, 9),
      isConnected: false,
    }
    setConnections([...connections, newConnection])
  }

  const removeConnection = (id: string) => {
    setConnections(connections.filter((conn) => conn.id !== id))
    if (activeConnection?.id === id) {
      setActiveConnectionState(null)
    }
  }

  const connectToRedis = (id: string) => {
    setConnections(connections.map((conn) => (conn.id === id ? { ...conn, isConnected: true } : conn)))
  }

  const disconnectFromRedis = (id: string) => {
    setConnections(connections.map((conn) => (conn.id === id ? { ...conn, isConnected: false } : conn)))
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
