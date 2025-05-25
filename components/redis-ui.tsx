"use client"

import { useState } from "react"
import { ConnectionPanel } from "@/components/connection-panel"
import { DataBrowser } from "@/components/data-browser"
import { Sidebar } from "@/components/sidebar"
import { Terminal } from "@/components/terminal"
import { Monitoring } from "@/components/monitoring"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConnectionProvider } from "@/components/connection-provider"
import { CommandPalette } from "@/components/command-palette"
import { Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RedisUI() {
  const [activeTab, setActiveTab] = useState("browser")
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  return (
    <ConnectionProvider>
      <div className="flex h-screen overflow-hidden text-foreground">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b border-border px-4 flex items-center justify-between">
              <TabsList className="bg-transparent h-14">
                <TabsTrigger value="browser" className="data-[state=active]:bg-muted">
                  Data Browser
                </TabsTrigger>
                <TabsTrigger value="terminal" className="data-[state=active]:bg-muted">
                  Terminal
                </TabsTrigger>
                <TabsTrigger value="monitoring" className="data-[state=active]:bg-muted">
                  Monitoring
                </TabsTrigger>
                <TabsTrigger value="connections" className="data-[state=active]:bg-muted">
                  Connections
                </TabsTrigger>
              </TabsList>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setCommandPaletteOpen(true)}
              >
                <Keyboard className="h-3.5 w-3.5" />
                <span className="text-xs">Command Palette</span>
                <kbd className="ml-1 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </div>
            <TabsContent value="browser" className="flex-1 p-0 m-0">
              <DataBrowser />
            </TabsContent>
            <TabsContent value="terminal" className="flex-1 p-0 m-0">
              <Terminal />
            </TabsContent>
            <TabsContent value="monitoring" className="flex-1 p-0 m-0">
              <Monitoring />
            </TabsContent>
            <TabsContent value="connections" className="flex-1 p-0 m-0">
              <ConnectionPanel />
            </TabsContent>
          </Tabs>
        </div>
        <CommandPalette
          isOpen={commandPaletteOpen}
          setIsOpen={setCommandPaletteOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </ConnectionProvider>
  )
}
