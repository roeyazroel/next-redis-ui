"use client"

import { useConnection } from "@/components/connection-provider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Server, Terminal, Activity, Plus, Power, PowerOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

type SidebarProps = {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { connections, activeConnection, setActiveConnection, connectToRedis, disconnectFromRedis } = useConnection()

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Database className="h-5 w-5 text-red-500" />
          <span className="bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">RedisUI</span>
        </h1>
      </div>

      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-gray-400">CONNECTIONS</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white"
            onClick={() => setActiveTab("connections")}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {connections.map((connection) => (
            <div
              key={connection.id}
              className={cn(
                "flex items-center justify-between p-2 rounded-md cursor-pointer",
                activeConnection?.id === connection.id ? "bg-muted" : "hover:bg-muted/50",
              )}
              onClick={() => setActiveConnection(connection.id)}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm truncate">{connection.name}</span>
              </div>
              <div className="flex items-center">
                {connection.isConnected ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
                    Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-muted text-muted-foreground border-muted text-xs">
                    Offline
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (connection.isConnected) {
                      disconnectFromRedis(connection.id)
                    } else {
                      connectToRedis(connection.id)
                    }
                  }}
                >
                  {connection.isConnected ? <PowerOff className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <nav className="p-2 flex-1">
        <Button
          variant="ghost"
          className={cn("w-full justify-start mb-1", activeTab === "browser" && "bg-muted")}
          onClick={() => setActiveTab("browser")}
        >
          <Database className="mr-2 h-4 w-4" />
          Data Browser
        </Button>
        <Button
          variant="ghost"
          className={cn("w-full justify-start mb-1", activeTab === "terminal" && "bg-muted")}
          onClick={() => setActiveTab("terminal")}
        >
          <Terminal className="mr-2 h-4 w-4" />
          Terminal
        </Button>
        <Button
          variant="ghost"
          className={cn("w-full justify-start mb-1", activeTab === "monitoring" && "bg-muted")}
          onClick={() => setActiveTab("monitoring")}
        >
          <Activity className="mr-2 h-4 w-4" />
          Monitoring
        </Button>
      </nav>

      <div className="p-4 border-t border-border flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {activeConnection ? (
            <div>
              <div className="font-medium text-foreground">{activeConnection.name}</div>
              <div>
                {activeConnection.host}:{activeConnection.port}
              </div>
            </div>
          ) : (
            <div>No active connection</div>
          )}
        </div>
        <ThemeToggle />
      </div>
    </div>
  )
}
