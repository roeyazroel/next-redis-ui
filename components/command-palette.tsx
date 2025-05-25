"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Command } from "cmdk"
import { Database, Search, Terminal, Activity, Server, Trash2, RefreshCw, Moon, Sun, X } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useConnection } from "@/components/connection-provider"

type CommandType = {
  id: string
  name: string
  shortcut?: string
  icon?: React.ReactNode
  section: string
  perform: () => void
}

type CommandPaletteProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function CommandPalette({ isOpen, setIsOpen, activeTab, setActiveTab }: CommandPaletteProps) {
  const { theme, setTheme } = useTheme()
  const { connections, activeConnection, connectToRedis, disconnectFromRedis, setActiveConnection } = useConnection()
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsOpen(!isOpen)
      }

      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [isOpen, setIsOpen])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSearch("")
    }
  }, [isOpen])

  const generateCommands = (): CommandType[] => {
    const commands: CommandType[] = [
      {
        id: "view-browser",
        name: "View Data Browser",
        shortcut: "1",
        icon: <Database className="h-4 w-4" />,
        section: "Navigation",
        perform: () => {
          setActiveTab("browser")
          setIsOpen(false)
        },
      },
      {
        id: "view-terminal",
        name: "View Terminal",
        shortcut: "2",
        icon: <Terminal className="h-4 w-4" />,
        section: "Navigation",
        perform: () => {
          setActiveTab("terminal")
          setIsOpen(false)
        },
      },
      {
        id: "view-monitoring",
        name: "View Monitoring",
        shortcut: "3",
        icon: <Activity className="h-4 w-4" />,
        section: "Navigation",
        perform: () => {
          setActiveTab("monitoring")
          setIsOpen(false)
        },
      },
      {
        id: "view-connections",
        name: "View Connections",
        shortcut: "4",
        icon: <Server className="h-4 w-4" />,
        section: "Navigation",
        perform: () => {
          setActiveTab("connections")
          setIsOpen(false)
        },
      },
      {
        id: "toggle-theme",
        name: theme === "dark" ? "Switch to Light Theme" : "Switch to Dark Theme",
        icon: theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
        section: "Preferences",
        perform: () => {
          setTheme(theme === "dark" ? "light" : "dark")
          setIsOpen(false)
        },
      },
    ]

    // Add connection-specific commands
    if (connections.length > 0) {
      commands.push({
        id: "refresh-data",
        name: "Refresh Data",
        shortcut: "R",
        icon: <RefreshCw className="h-4 w-4" />,
        section: "Actions",
        perform: () => {
          // This would trigger a refresh in a real implementation
          setIsOpen(false)
        },
      })
    }

    // Add commands for each connection
    connections.forEach((connection) => {
      commands.push({
        id: `select-connection-${connection.id}`,
        name: `Select ${connection.name}`,
        icon: <Server className="h-4 w-4" />,
        section: "Connections",
        perform: () => {
          setActiveConnection(connection.id)
          setIsOpen(false)
        },
      })

      if (connection.isConnected) {
        commands.push({
          id: `disconnect-${connection.id}`,
          name: `Disconnect from ${connection.name}`,
          icon: <Trash2 className="h-4 w-4" />,
          section: "Connections",
          perform: () => {
            disconnectFromRedis(connection.id)
            setIsOpen(false)
          },
        })
      } else {
        commands.push({
          id: `connect-${connection.id}`,
          name: `Connect to ${connection.name}`,
          icon: <Server className="h-4 w-4" />,
          section: "Connections",
          perform: () => {
            connectToRedis(connection.id)
            setIsOpen(false)
          },
        })
      }
    })

    // Add Redis commands if we have an active connection
    if (activeConnection?.isConnected) {
      const redisCommands = [
        {
          id: "redis-get",
          name: "GET <key>",
          icon: <Terminal className="h-4 w-4" />,
          section: "Redis Commands",
          perform: () => {
            setActiveTab("terminal")
            setIsOpen(false)
            // In a real implementation, we would pre-fill the terminal
          },
        },
        {
          id: "redis-set",
          name: "SET <key> <value>",
          icon: <Terminal className="h-4 w-4" />,
          section: "Redis Commands",
          perform: () => {
            setActiveTab("terminal")
            setIsOpen(false)
          },
        },
        {
          id: "redis-del",
          name: "DEL <key>",
          icon: <Terminal className="h-4 w-4" />,
          section: "Redis Commands",
          perform: () => {
            setActiveTab("terminal")
            setIsOpen(false)
          },
        },
        {
          id: "redis-keys",
          name: "KEYS <pattern>",
          icon: <Terminal className="h-4 w-4" />,
          section: "Redis Commands",
          perform: () => {
            setActiveTab("terminal")
            setIsOpen(false)
          },
        },
        {
          id: "redis-info",
          name: "INFO",
          icon: <Terminal className="h-4 w-4" />,
          section: "Redis Commands",
          perform: () => {
            setActiveTab("terminal")
            setIsOpen(false)
          },
        },
      ]
      commands.push(...redisCommands)
    }

    return commands
  }

  const commands = generateCommands()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed left-1/2 top-1/4 w-full max-w-2xl -translate-x-1/2 -translate-y-1/4">
        <div className="overflow-hidden rounded-lg border border-border bg-card shadow-lg">
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <div className="flex items-center border-b border-border px-3">
              <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
              <Command.Input
                ref={inputRef}
                value={search}
                onValueChange={setSearch}
                className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Type a command or search..."
              />
              <button
                onClick={() => setIsOpen(false)}
                className="ml-auto flex h-8 w-8 items-center justify-center rounded-md border border-border hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Command.List className="max-h-[500px] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No commands found.
              </Command.Empty>

              {search === "" && (
                <Command.Group heading="Quick Actions">
                  <div className="grid grid-cols-2 gap-2">
                    <Command.Item
                      onSelect={() => {
                        setActiveTab("browser")
                        setIsOpen(false)
                      }}
                      className="flex h-16 items-center justify-start rounded-md border border-border p-3 hover:bg-muted"
                    >
                      <Database className="mr-2 h-5 w-5 text-red-500" />
                      <span>Data Browser</span>
                    </Command.Item>
                    <Command.Item
                      onSelect={() => {
                        setActiveTab("terminal")
                        setIsOpen(false)
                      }}
                      className="flex h-16 items-center justify-start rounded-md border border-border p-3 hover:bg-muted"
                    >
                      <Terminal className="mr-2 h-5 w-5 text-red-500" />
                      <span>Terminal</span>
                    </Command.Item>
                    <Command.Item
                      onSelect={() => {
                        setActiveTab("monitoring")
                        setIsOpen(false)
                      }}
                      className="flex h-16 items-center justify-start rounded-md border border-border p-3 hover:bg-muted"
                    >
                      <Activity className="mr-2 h-5 w-5 text-red-500" />
                      <span>Monitoring</span>
                    </Command.Item>
                    <Command.Item
                      onSelect={() => {
                        setActiveTab("connections")
                        setIsOpen(false)
                      }}
                      className="flex h-16 items-center justify-start rounded-md border border-border p-3 hover:bg-muted"
                    >
                      <Server className="mr-2 h-5 w-5 text-red-500" />
                      <span>Connections</span>
                    </Command.Item>
                  </div>
                </Command.Group>
              )}

              {Object.entries(
                commands
                  .filter((command) => command.section !== "Navigation" || search !== "")
                  .reduce<Record<string, CommandType[]>>((acc, command) => {
                    if (!acc[command.section]) {
                      acc[command.section] = []
                    }
                    acc[command.section].push(command)
                    return acc
                  }, {}),
              ).map(([section, sectionCommands]) => (
                <Command.Group key={section} heading={section}>
                  {sectionCommands.map((command) => (
                    <Command.Item
                      key={command.id}
                      onSelect={() => command.perform()}
                      className="flex items-center justify-between px-2 py-1.5"
                    >
                      <div className="flex items-center">
                        {command.icon && <span className="mr-2 text-muted-foreground">{command.icon}</span>}
                        <span>{command.name}</span>
                      </div>
                      {command.shortcut && <span className="text-xs text-muted-foreground">{command.shortcut}</span>}
                    </Command.Item>
                  ))}
                </Command.Group>
              ))}
            </Command.List>
          </Command>
        </div>
      </div>
    </div>
  )
}
