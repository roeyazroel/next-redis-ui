"use client"

import { useState, useEffect } from "react"
import { useConnection } from "@/components/connection-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Database, Activity, Server, MemoryStickIcon as Memory, HardDrive, RefreshCw, AlertCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

type MonitoringData = {
  memory: {
    used: number
    peak: number
    fragmentation: number
    rss: number
  }
  clients: {
    connected: number
    blocked: number
    maxClients: number
  }
  stats: {
    totalConnections: number
    totalCommands: number
    opsPerSec: number
    hitRate: number
    keyspace: {
      keys: number
      expires: number
      avgTtl: number
    }
  }
  server: {
    version: string
    mode: string
    os: string
    uptime: number
  }
}

export function Monitoring() {
  const { activeConnection } = useConnection()
  const [monitoringData, setMonitoringData] = useState<MonitoringData | null>(null)
  const [refreshInterval, setRefreshInterval] = useState<number | null>(5000)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch monitoring data when connection changes or on refresh
  useEffect(() => {
    if (activeConnection?.isConnected) {
      fetchMonitoringData()
    } else {
      setMonitoringData(null)
    }
  }, [activeConnection])

  // Set up refresh interval
  useEffect(() => {
    if (!activeConnection?.isConnected || !refreshInterval) return

    const intervalId = setInterval(() => {
      fetchMonitoringData()
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [activeConnection, refreshInterval])

  const fetchMonitoringData = async () => {
    if (!activeConnection?.isConnected) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/redis/info?connectionId=${activeConnection.id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch monitoring data")
      }

      const data = await response.json()
      setMonitoringData(data)
      setLastRefreshed(new Date())
    } catch (err: any) {
      setError(err.message || "Failed to fetch monitoring data")
      toast({
        title: "Error",
        description: err.message || "Failed to fetch monitoring data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = () => {
    fetchMonitoringData()
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${days}d ${hours}h ${minutes}m ${secs}s`
  }

  if (!activeConnection?.isConnected) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-96 bg-card border-border">
          <CardContent className="pt-6 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">No Active Connection</h3>
            <p className="text-muted-foreground mb-4">Connect to a Redis server to view monitoring data</p>
            <Button onClick={() => {}} className="bg-red-500 hover:bg-red-600">
              Connect to Redis
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading && !monitoringData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <h3 className="text-xl font-medium mb-2">Loading</h3>
          <p className="text-muted-foreground">Fetching Redis monitoring data...</p>
        </div>
      </div>
    )
  }

  if (error && !monitoringData) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-96 bg-card border-border">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-xl font-medium mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} className="bg-red-500 hover:bg-red-600">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full p-4 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold">Redis Monitoring</h2>
          <p className="text-sm text-muted-foreground">
            {activeConnection.name} ({activeConnection.host}:{activeConnection.port})
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">Last refreshed: {lastRefreshed.toLocaleTimeString()}</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRefreshInterval(refreshInterval ? null : 5000)}
              className={refreshInterval ? "bg-muted" : ""}
            >
              {refreshInterval ? "Auto-refresh: ON" : "Auto-refresh: OFF"}
            </Button>
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 border border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {monitoringData && (
        <Tabs defaultValue="overview">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="server">Server</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="m-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Memory className="h-4 w-4 text-red-400" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{monitoringData.memory.used} MB</div>
                  <p className="text-xs text-muted-foreground">Peak: {monitoringData.memory.peak} MB</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-400" />
                    Operations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{monitoringData.stats.opsPerSec}/sec</div>
                  <p className="text-xs text-muted-foreground">
                    Total: {monitoringData.stats.totalCommands.toLocaleString()}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Server className="h-4 w-4 text-blue-400" />
                    Connected Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{monitoringData.clients.connected}</div>
                  <p className="text-xs text-muted-foreground">Blocked: {monitoringData.clients.blocked}</p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-purple-400" />
                    Keys
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{monitoringData.stats.keyspace.keys.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Expires: {monitoringData.stats.keyspace.expires.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Server Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Redis Version</span>
                      <span>{monitoringData.server.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mode</span>
                      <span className="capitalize">{monitoringData.server.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">OS</span>
                      <span>{monitoringData.server.os}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime</span>
                      <span>{formatUptime(monitoringData.server.uptime)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Memory Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Used Memory</span>
                      <span>{monitoringData.memory.used} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Peak Memory</span>
                      <span>{monitoringData.memory.peak} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RSS Memory</span>
                      <span>{monitoringData.memory.rss} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fragmentation Ratio</span>
                      <span>{monitoringData.memory.fragmentation}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="memory" className="m-0">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Memory Overview</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Used Memory</span>
                        <span>{monitoringData.memory.used} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Peak Memory</span>
                        <span>{monitoringData.memory.peak} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RSS Memory</span>
                        <span>{monitoringData.memory.rss} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fragmentation Ratio</span>
                        <span>{monitoringData.memory.fragmentation}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Memory Consumers</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dataset</span>
                        <span>{Math.floor(monitoringData.memory.used * 0.7)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lua Scripts</span>
                        <span>{Math.floor(monitoringData.memory.used * 0.05)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connections</span>
                        <span>{Math.floor(monitoringData.memory.used * 0.1)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Overhead</span>
                        <span>{Math.floor(monitoringData.memory.used * 0.15)} MB</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Memory Allocation</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Allocator</span>
                        <span>jemalloc-5.2.1</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Allocator RSS Overhead</span>
                        <span>{monitoringData.memory.rss - monitoringData.memory.used} MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clients" className="m-0">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Client Connections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Client Overview</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Connected Clients</span>
                        <span>{monitoringData.clients.connected}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Blocked Clients</span>
                        <span>{monitoringData.clients.blocked}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Max Clients</span>
                        <span>{monitoringData.clients.maxClients.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Client Metrics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Connections Received</span>
                        <span>{monitoringData.stats.totalConnections.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="m-0">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Redis Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Command Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Commands Processed</span>
                        <span>{monitoringData.stats.totalCommands.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Operations Per Second</span>
                        <span>{monitoringData.stats.opsPerSec}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hit Rate</span>
                        <span>{monitoringData.stats.hitRate}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Keyspace Statistics</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Keys</span>
                        <span>{monitoringData.stats.keyspace.keys.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Keys with Expiry</span>
                        <span>{monitoringData.stats.keyspace.expires.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Average TTL</span>
                        <span>{monitoringData.stats.keyspace.avgTtl} seconds</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="server" className="m-0">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Server Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Redis Server</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Redis Version</span>
                        <span>{monitoringData.server.version}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Redis Mode</span>
                        <span className="capitalize">{monitoringData.server.mode}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">TCP Port</span>
                        <span>{activeConnection.port}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Uptime</span>
                        <span>{formatUptime(monitoringData.server.uptime)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Operating System</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">OS</span>
                        <span>{monitoringData.server.os}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
