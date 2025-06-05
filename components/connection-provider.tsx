"use client";

import { toast } from "@/components/ui/use-toast";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Connection = {
  id: string;
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: boolean;
  isConnected: boolean;
  source?: "environment" | "user";
};

type ConnectionContextType = {
  connections: Connection[];
  activeConnection: Connection | null;
  addConnection: (
    connection: Omit<Connection, "id" | "isConnected">
  ) => Promise<void>;
  updateConnection: (
    id: string,
    connection: Omit<Connection, "id" | "isConnected">
  ) => Promise<void>;
  removeConnection: (id: string) => Promise<void>;
  connectToRedis: (id: string) => Promise<void>;
  disconnectFromRedis: (id: string) => Promise<void>;
  setActiveConnection: (id: string | null) => void;
  isLoading: boolean;
  error: string | null;
};

const ConnectionContext = createContext<ConnectionContextType | undefined>(
  undefined
);

// Load connections from localStorage
const loadConnections = (): Connection[] => {
  if (typeof window === "undefined") return [];

  const saved = localStorage.getItem("redis-connections");
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to parse saved connections", e);
    }
  }
  return [];
};

// Save connections to localStorage
const saveConnections = (connections: Connection[]) => {
  if (typeof window === "undefined") return;
  // Only save user connections, not environment ones
  const userConnections = connections.filter(
    (conn) => conn.source !== "environment"
  );
  localStorage.setItem("redis-connections", JSON.stringify(userConnections));
};

// Load environment connections from server
const loadEnvironmentConnections = async (): Promise<Connection[]> => {
  try {
    // Call our own API to get environment connection configs
    const response = await fetch("/api/redis/env-connections");
    if (!response.ok) {
      console.warn("No environment connections endpoint available");
      return [];
    }

    const envConfigs = await response.json();
    return envConfigs.map((config: any) => ({
      ...config,
      isConnected: false, // Will be updated after connection attempts
      source: "environment" as const,
    }));
  } catch (error) {
    console.warn("Failed to load environment connections:", error);
    return [];
  }
};

// Merge user and environment connections, giving precedence to environment
const mergeConnections = (
  userConnections: Connection[],
  envConnections: Connection[]
): Connection[] => {
  const merged = [...envConnections];

  // Add user connections that don't conflict with environment ones
  userConnections.forEach((userConn) => {
    const conflict = envConnections.find(
      (envConn) =>
        envConn.host === userConn.host && envConn.port === userConn.port
    );

    if (!conflict) {
      merged.push({ ...userConn, source: "user" });
    } else {
      console.log(
        `User connection ${userConn.name} conflicts with environment connection, using environment version`
      );
    }
  });

  return merged;
};

// Mark connections as environment-sourced
const markEnvironmentConnections = (
  connections: Connection[]
): Connection[] => {
  return connections.map((conn) => ({
    ...conn,
    source: conn.source || "user",
  }));
};

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnectionState] =
    useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved connections on mount
  useEffect(() => {
    const initializeConnections = async () => {
      setIsLoading(true);

      try {
        // Load user connections from localStorage
        const savedConnections = loadConnections();

        // Load environment connections from server
        const envConnections = await loadEnvironmentConnections();

        // Merge connections with environment taking precedence
        const mergedConnections = mergeConnections(
          savedConnections,
          envConnections
        );

        console.log(
          `Loaded ${savedConnections.length} user connections and ${envConnections.length} environment connections`
        );

        setConnections(mergedConnections);

        // Set active connection if there's a connected one
        const connected = mergedConnections.find((conn) => conn.isConnected);
        if (connected) {
          setActiveConnectionState(connected);
          // Verify the connection is still active
          verifyConnection(connected.id);
        }

        // Auto-connect to environment connections
        for (const envConn of envConnections) {
          try {
            console.log(
              `Auto-connecting to environment Redis: ${envConn.name}`
            );

            // Call the API to establish connection
            const response = await fetch("/api/redis/connect", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                config: envConn,
                isEnvironmentConnection: true,
              }),
            });

            if (response.ok) {
              // Update the connection state locally
              envConn.isConnected = true;
              console.log(`✓ Successfully auto-connected to ${envConn.name}`);

              // Set as active connection if it's the first one
              if (!connected) {
                setActiveConnectionState(envConn);
              }
            } else {
              console.warn(`Failed to auto-connect to ${envConn.name}`);
            }
          } catch (error) {
            console.warn(`Failed to auto-connect to ${envConn.name}:`, error);
          }
        }

        // Update connections with final state
        setConnections([...mergedConnections]);
      } catch (error) {
        console.error("Failed to initialize connections:", error);
        // Fallback to just user connections
        const savedConnections = loadConnections();
        setConnections(markEnvironmentConnections(savedConnections));
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnections();
  }, []);

  // Verify a connection is still active
  const verifyConnection = async (id: string) => {
    try {
      const connection = connections.find((conn) => conn.id === id);
      if (!connection) return;

      // Try to fetch keys as a connection test
      const response = await fetch(
        `/api/redis/keys?connectionId=${id}&pattern=*`
      );

      if (!response.ok) {
        // If connection failed, update the connection status
        console.warn(`Connection ${connection.name} is no longer active`);
        const updatedConnections = connections.map((conn) =>
          conn.id === id ? { ...conn, isConnected: false } : conn
        );
        setConnections(updatedConnections);
        saveConnections(updatedConnections);

        if (activeConnection?.id === id) {
          setActiveConnectionState(null);
        }
      }
    } catch (error) {
      console.error(`Error verifying connection ${id}:`, error);
    }
  };

  const addConnection = async (
    connection: Omit<Connection, "id" | "isConnected">
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const newConnection = {
        ...connection,
        id: Math.random().toString(36).substring(2, 9),
        isConnected: false,
      };

      const updatedConnections = [...connections, newConnection];
      setConnections(updatedConnections);
      saveConnections(updatedConnections);

      toast({
        title: "Connection Added",
        description: `${newConnection.name} has been added successfully`,
      });

      // Automatically connect to the new connection
      await connectToRedis(newConnection.id);

      return;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to add connection";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateConnection = async (
    id: string,
    connection: Omit<Connection, "id" | "isConnected">
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const existingConnection = connections.find((conn) => conn.id === id);
      if (!existingConnection) {
        throw new Error("Connection not found");
      }

      const wasConnected = existingConnection.isConnected;

      // Disconnect if currently connected
      if (wasConnected) {
        await disconnectFromRedis(id);
      }

      // Update the connection
      const updatedConnection = {
        ...connection,
        id,
        isConnected: false,
      };

      const updatedConnections = connections.map((conn) =>
        conn.id === id ? updatedConnection : conn
      );
      setConnections(updatedConnections);
      saveConnections(updatedConnections);

      // Update active connection if it was this one
      if (activeConnection?.id === id) {
        setActiveConnectionState(updatedConnection);
      }

      toast({
        title: "Connection Updated",
        description: `${updatedConnection.name} has been updated successfully`,
      });

      // Reconnect if it was previously connected
      if (wasConnected) {
        await connectToRedis(id);
      }
    } catch (err: any) {
      const errorMsg = err.message || "Failed to update connection";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const removeConnection = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Disconnect if connected
      if (connections.find((conn) => conn.id === id)?.isConnected) {
        await disconnectFromRedis(id);
      }

      const updatedConnections = connections.filter((conn) => conn.id !== id);
      setConnections(updatedConnections);
      saveConnections(updatedConnections);

      if (activeConnection?.id === id) {
        setActiveConnectionState(null);
      }

      toast({
        title: "Connection Removed",
        description: "The connection has been removed successfully",
      });
    } catch (err: any) {
      const errorMsg = err.message || "Failed to remove connection";
      setError(errorMsg);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const connectToRedis = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const connection = connections.find((conn) => conn.id === id);
      if (!connection) {
        throw new Error("Connection not found");
      }

      // Call the API to establish connection
      const response = await fetch("/api/redis/connect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(connection),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to connect to Redis");
      }

      // Update connection status
      const updatedConnections = connections.map((conn) =>
        conn.id === id ? { ...conn, isConnected: true } : conn
      );

      setConnections(updatedConnections);
      saveConnections(updatedConnections);

      // Set as active connection
      const updatedConnection = updatedConnections.find(
        (conn) => conn.id === id
      )!;
      setActiveConnectionState(updatedConnection);

      toast({
        title: "Connected",
        description: `Successfully connected to ${connection.name}`,
      });
    } catch (err: any) {
      const errorMsg = err.message || "Failed to connect to Redis";
      setError(errorMsg);
      toast({
        title: "Connection Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectFromRedis = async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Call the API to disconnect
      const response = await fetch("/api/redis/disconnect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to disconnect from Redis");
      }

      // Update connection status
      const updatedConnections = connections.map((conn) =>
        conn.id === id ? { ...conn, isConnected: false } : conn
      );

      setConnections(updatedConnections);
      saveConnections(updatedConnections);

      // Clear active connection if it was this one
      if (activeConnection?.id === id) {
        setActiveConnectionState(null);
      }

      toast({
        title: "Disconnected",
        description: "Successfully disconnected from Redis",
      });
    } catch (err: any) {
      const errorMsg = err.message || "Failed to disconnect from Redis";
      setError(errorMsg);
      toast({
        title: "Disconnection Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const setActiveConnection = (id: string | null) => {
    if (id === null) {
      setActiveConnectionState(null);
      return;
    }

    const connection = connections.find((conn) => conn.id === id);
    if (connection) {
      setActiveConnectionState(connection);

      // If the connection is not connected, try to connect
      if (!connection.isConnected) {
        connectToRedis(id).catch((err) => {
          console.error("Failed to auto-connect:", err);
        });
      }
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        connections,
        activeConnection,
        addConnection,
        updateConnection,
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
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
}
