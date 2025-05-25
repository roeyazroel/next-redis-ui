"use client"

import { useState, useEffect } from "react"
import { useConnection } from "@/components/connection-provider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Database, Activity, Server, MemoryStickIcon as Memory, HardDrive, RefreshCw } from "lucide-react"

// Mock monitoring data
const generateMockData = () => {
  return {
    memory: {
      used: Math.floor(Math.random() * 500) + 500, // 500-1000 MB
      peak: Math.floor(Math.random() * 600) + 600, // 600-1200 MB
      fragmentation: (Math.random() * 2 + 1).toFixed(2), // 1.00-3.00
      rss: Math.floor(Math.random() * 800) + 800, // 800-1600 MB
    },
    clients: {
      connected: Math.floor(Math.random() * 50) + 10, // 10-60
      blocked: Math.floor(Math.random() * 5), // 0-5
      maxClients: 10000,
    },
    stats: {
      totalConnections: Math.floor(Math.random() * 1000) + 5000, // 5000-6000
      totalCommands: Math.floor(Math.random() * 10000) + 50000, // 50000-60000
      opsPerSec: Math.floor(Math.random() * 1000) + 1000, // 1000-2000
      hitRate: Math.floor(Math.random() * 30) + 70, // 70-100%
      keyspace: {
        db0: {
          keys: Math.floor(Math.random() * 1000) + 5000, // 5000-6000
          expires: Math.floor(Math.random() * 500) + 1000, // 1000-1500
          avgTtl: Math.floor(Math.random() * 3600) + 3600, // 3600-7200
        },
      },
    },
    server: {
      version: "7.0.5",
      mode: "standalone",
      os: "Linux 5.15.0-56-generic x86_64",
      uptime: Math.floor(Math.random() * 86400) + 86400, // 1-2 days in seconds
    },
  }
}

export function Monitoring() {
  const { activeConnection } = useConnection()
  const [monitoringData, setMonitoringData] = useState(generateMockData())
  const [refreshInterval, setRefreshInterval] = useState<number | null>(5000)
  const [lastRefreshed, setLastRefreshed] = useState(new Date())

  useEffect(() => {
    if (!activeConnection?.isConnected || !refreshInterval) return

    const intervalId = setInterval(() => {
      setMonitoringData(generateMockData())
      setLastRefreshed(new Date())
    }, refreshInterval)

    return () => clearInterval(intervalId)
  }, [activeConnection, refreshInterval])

  const handleRefresh = () => {
    setMonitoringData(generateMockData())
    setLastRefreshed(new Date())
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
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

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
                <div className="text-2xl font-bold">{monitoringData.stats.keyspace.db0.keys.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Expires: {monitoringData.stats.keyspace.db0.expires.toLocaleString()}
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
                      <span className="text-gray-400">Used Memory</span>
                      <span>{monitoringData.memory.used} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Peak Memory</span>
                      <span>{monitoringData.memory.peak} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">RSS Memory</span>
                      <span>{monitoringData.memory.rss} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fragmentation Ratio</span>
                      <span>{monitoringData.memory.fragmentation}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Memory Consumers</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dataset</span>
                      <span>{Math.floor(monitoringData.memory.used * 0.7)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Lua Scripts</span>
                      <span>{Math.floor(monitoringData.memory.used * 0.05)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Connections</span>
                      <span>{Math.floor(monitoringData.memory.used * 0.1)} MB</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Overhead</span>
                      <span>{Math.floor(monitoringData.memory.used * 0.15)} MB</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Memory Allocation</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Allocator</span>
                      <span>jemalloc-5.2.1</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Allocator RSS Overhead</span>
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
                      <span className="text-gray-400">Connected Clients</span>
                      <span>{monitoringData.clients.connected}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Blocked Clients</span>
                      <span>{monitoringData.clients.blocked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Max Clients</span>
                      <span>{monitoringData.clients.maxClients.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Client Recent Max</span>
                      <span>{Math.max(monitoringData.clients.connected + 10, 50)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Client Types</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Normal Clients</span>
                      <span>{monitoringData.clients.connected - monitoringData.clients.blocked}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Replica Clients</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Pub/Sub Clients</span>
                      <span>{Math.floor(monitoringData.clients.connected * 0.2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Client Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Connections Received</span>
                      <span>{monitoringData.stats.totalConnections.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rejected Connections</span>
                      <span>{Math.floor(monitoringData.stats.totalConnections * 0.01)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Client Timeout</span>
                      <span>0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Net Input Bytes</span>
                      <span>{(monitoringData.stats.totalCommands * 50).toLocaleString()} B</span>
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
                      <span className="text-gray-400">Total Commands Processed</span>
                      <span>{monitoringData.stats.totalCommands.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Operations Per Second</span>
                      <span>{monitoringData.stats.opsPerSec}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Keyspace Hits</span>
                      <span>
                        {Math.floor(
                          (monitoringData.stats.totalCommands * monitoringData.stats.hitRate) / 100,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Keyspace Misses</span>
                      <span>
                        {Math.floor(
                          (monitoringData.stats.totalCommands * (100 - monitoringData.stats.hitRate)) / 100,
                        ).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Hit Rate</span>
                      <span>{monitoringData.stats.hitRate}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Keyspace Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Keys</span>
                      <span>{monitoringData.stats.keyspace.db0.keys.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Keys with Expiry</span>
                      <span>{monitoringData.stats.keyspace.db0.expires.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Average TTL</span>
                      <span>{monitoringData.stats.keyspace.db0.avgTtl} seconds</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Network Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Net Input</span>
                      <span>{(monitoringData.stats.totalCommands * 50).toLocaleString()} B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Net Output</span>
                      <span>{(monitoringData.stats.totalCommands * 100).toLocaleString()} B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Instantaneous Input</span>
                      <span>{monitoringData.stats.opsPerSec * 50} B/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Instantaneous Output</span>
                      <span>{monitoringData.stats.opsPerSec * 100} B/s</span>
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
                      <span className="text-gray-400">Redis Version</span>
                      <span>{monitoringData.server.version}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Redis Mode</span>
                      <span className="capitalize">{monitoringData.server.mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Process ID</span>
                      <span>{Math.floor(Math.random() * 10000) + 1000}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">TCP Port</span>
                      <span>{activeConnection.port}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Uptime</span>
                      <span>{formatUptime(monitoringData.server.uptime)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Operating System</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">OS</span>
                      <span>{monitoringData.server.os}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Architecture</span>
                      <span>x86_64</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Process Supervised</span>
                      <span>no</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">CPU</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used CPU Sys</span>
                      <span>{(Math.random() * 10).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used CPU User</span>
                      <span>{(Math.random() * 20).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used CPU Sys Children</span>
                      <span>0.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Used CPU User Children</span>
                      <span>0.00</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Cluster</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Cluster Enabled</span>
                      <span>No</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
