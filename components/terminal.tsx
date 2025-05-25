"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useConnection } from "@/components/connection-provider"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Database, ArrowRight, Trash2 } from "lucide-react"

type CommandResult = {
  command: string
  result: any
  timestamp: Date
  error?: boolean
}

export function Terminal() {
  const { activeConnection } = useConnection()
  const [command, setCommand] = useState("")
  const [history, setHistory] = useState<CommandResult[]>([])
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const terminalEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [history])

  const executeCommand = async () => {
    if (!command.trim() || !activeConnection?.isConnected) return

    // Add to command history
    setCommandHistory([...commandHistory, command])
    setHistoryIndex(-1)

    setIsLoading(true)

    try {
      const response = await fetch("/api/redis/command", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionId: activeConnection.id,
          command: command.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setHistory([
          ...history,
          {
            command,
            result: data.error || "Command execution failed",
            timestamp: new Date(),
            error: true,
          },
        ])
      } else {
        setHistory([
          ...history,
          {
            command,
            result: data.result,
            timestamp: new Date(),
          },
        ])
      }
    } catch (error: any) {
      setHistory([
        ...history,
        {
          command,
          result: error.message || "Command execution failed",
          timestamp: new Date(),
          error: true,
        },
      ])
    } finally {
      setCommand("")
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand()
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setCommand(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setCommand("")
      }
    }
  }

  const clearTerminal = () => {
    setHistory([])
  }

  const formatResult = (result: any, isError = false) => {
    if (isError) {
      return <span className="text-red-500">(error) {String(result)}</span>
    }

    if (Array.isArray(result)) {
      return (
        <div className="pl-4">
          {result.map((item, index) => (
            <div key={index} className="text-green-400">
              {index + 1}) "{String(item)}"
            </div>
          ))}
        </div>
      )
    } else if (typeof result === "string" && result.includes("\n")) {
      return <pre className="whitespace-pre-wrap text-green-400 pl-4">{result}</pre>
    } else if (result === null) {
      return <span className="text-muted-foreground">(nil)</span>
    } else {
      return <span className="text-green-400">{JSON.stringify(result)}</span>
    }
  }

  if (!activeConnection?.isConnected) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-96 bg-card border-border">
          <div className="p-6 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">No Active Connection</h3>
            <p className="text-muted-foreground mb-4">Connect to a Redis server to use the terminal</p>
            <Button onClick={() => {}} className="bg-red-500 hover:bg-red-600">
              Connect to Redis
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Connected to {activeConnection.name} ({activeConnection.host}:{activeConnection.port})
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearTerminal}
          className="text-muted-foreground hover:text-foreground"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear
        </Button>
      </div>

      <div className="flex-1 overflow-auto font-mono text-sm">
        {history.length === 0 ? (
          <div className="text-muted-foreground mb-4">
            <p>Redis CLI</p>
            <p>Type HELP for available commands</p>
          </div>
        ) : (
          history.map((item, index) => (
            <div key={index} className="mb-4">
              <div className="flex items-center text-muted-foreground mb-1">
                <span className="text-xs opacity-50">{item.timestamp.toLocaleTimeString()}</span>
                <ArrowRight className="h-3 w-3 mx-2" />
                <span className="text-red-400">{item.command}</span>
              </div>
              <div className="pl-6">{formatResult(item.result, item.error)}</div>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>

      <div className="mt-4 flex items-center">
        <div className="text-red-500 mr-2">&gt;</div>
        <Input
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type Redis command..."
          className="flex-1 bg-input font-mono"
          disabled={isLoading}
          autoFocus
        />
        <Button
          onClick={executeCommand}
          className="ml-2 bg-red-500 hover:bg-red-600"
          disabled={isLoading || !command.trim()}
        >
          {isLoading ? "Executing..." : "Execute"}
        </Button>
      </div>
    </div>
  )
}
