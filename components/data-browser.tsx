"use client"

import { useState, useEffect } from "react"
import { useConnection } from "@/components/connection-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Plus, Trash2, Edit, Copy, Clock, Database } from "lucide-react"
import { KeyValueEditor } from "@/components/key-value-editor"
import { JsonViewer } from "@/components/json-viewer"
import { EnhancedSearch } from "@/components/enhanced-search"

// Mock data
const mockKeys = [
  { key: "user:1000", type: "hash", ttl: -1, size: "1.2 KB" },
  { key: "session:abc123", type: "string", ttl: 3600, size: "256 B" },
  { key: "products", type: "list", ttl: -1, size: "45.3 KB" },
  { key: "notifications:user:1000", type: "set", ttl: 86400, size: "512 B" },
  { key: "leaderboard:global", type: "zset", ttl: -1, size: "12.8 KB" },
  { key: "config:app", type: "hash", ttl: -1, size: "768 B" },
  { key: "cache:popular-posts", type: "json", ttl: 1800, size: "24.5 KB" },
  { key: "rate-limit:ip:192.168.1.1", type: "string", ttl: 60, size: "128 B" },
  { key: "user:1001", type: "hash", ttl: -1, size: "1.4 KB" },
  { key: "user:1002", type: "hash", ttl: -1, size: "1.1 KB" },
]

const mockKeyData = {
  "user:1000": {
    id: 1000,
    username: "johndoe",
    email: "john@example.com",
    created_at: "2023-05-15T10:30:00Z",
    last_login: "2023-06-10T14:22:15Z",
    preferences: {
      theme: "dark",
      notifications: true,
      language: "en-US",
    },
  },
  "session:abc123": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  products: ["product:1", "product:2", "product:3", "product:4", "product:5"],
  "notifications:user:1000": ["notification:1", "notification:2", "notification:3"],
  "leaderboard:global": [
    { member: "user:1000", score: 1250 },
    { member: "user:1042", score: 1100 },
    { member: "user:985", score: 950 },
  ],
  "config:app": {
    debug: false,
    cache_ttl: 3600,
    max_connections: 100,
    version: "1.2.3",
  },
  "cache:popular-posts": [
    { id: 1, title: "Getting Started with Redis", views: 1250 },
    { id: 2, title: "Advanced Redis Patterns", views: 980 },
    { id: 3, title: "Redis vs. MongoDB", views: 1420 },
  ],
  "rate-limit:ip:192.168.1.1": "5",
  "user:1001": {
    id: 1001,
    username: "janedoe",
    email: "jane@example.com",
    created_at: "2023-04-22T08:15:00Z",
    last_login: "2023-06-09T11:45:30Z",
    preferences: {
      theme: "light",
      notifications: false,
      language: "en-GB",
    },
  },
  "user:1002": {
    id: 1002,
    username: "bobsmith",
    email: "bob@example.com",
    created_at: "2023-05-30T16:20:00Z",
    last_login: "2023-06-08T09:10:45Z",
    preferences: {
      theme: "system",
      notifications: true,
      language: "fr-FR",
    },
  },
}

type KeyInfo = {
  key: string
  type: string
  ttl: number
  size: string
}

type SearchFilter = {
  type?: string
  ttl?: "all" | "with-expiry" | "no-expiry"
  pattern?: "exact" | "prefix" | "contains" | "regex"
}

export function DataBrowser() {
  const { activeConnection } = useConnection()
  const [keys, setKeys] = useState<KeyInfo[]>([])
  const [filteredKeys, setFilteredKeys] = useState<KeyInfo[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [keyData, setKeyData] = useState<any>(null)
  const [viewMode, setViewMode] = useState("table")
  const [isEditing, setIsEditing] = useState(false)
  const [currentSearchTerm, setCurrentSearchTerm] = useState("")
  const [currentFilters, setCurrentFilters] = useState<SearchFilter>({})

  // Load mock data
  useEffect(() => {
    if (activeConnection?.isConnected) {
      setKeys(mockKeys)
      applyFilters(mockKeys, currentSearchTerm, currentFilters)
      if (selectedKey) {
        setKeyData(mockKeyData[selectedKey])
      }
    } else {
      setKeys([])
      setFilteredKeys([])
      setSelectedKey(null)
      setKeyData(null)
    }
  }, [activeConnection, selectedKey])

  const handleKeySelect = (key: string) => {
    setSelectedKey(key)
    setKeyData(mockKeyData[key])
    setIsEditing(false)
  }

  const applyFilters = (allKeys: KeyInfo[], searchTerm: string, filters: SearchFilter) => {
    let result = [...allKeys]

    // Apply search term
    if (searchTerm) {
      const pattern = filters.pattern || "contains"

      if (pattern === "exact") {
        result = result.filter((k) => k.key === searchTerm)
      } else if (pattern === "prefix") {
        result = result.filter((k) => k.key.startsWith(searchTerm))
      } else if (pattern === "contains") {
        result = result.filter((k) => k.key.includes(searchTerm))
      } else if (pattern === "regex") {
        try {
          const regex = new RegExp(searchTerm)
          result = result.filter((k) => regex.test(k.key))
        } catch (e) {
          // Invalid regex, fall back to contains
          result = result.filter((k) => k.key.includes(searchTerm))
        }
      }
    }

    // Apply type filter
    if (filters.type) {
      result = result.filter((k) => k.type === filters.type)
    }

    // Apply TTL filter
    if (filters.ttl) {
      if (filters.ttl === "with-expiry") {
        result = result.filter((k) => k.ttl > 0)
      } else if (filters.ttl === "no-expiry") {
        result = result.filter((k) => k.ttl === -1)
      }
    }

    setFilteredKeys(result)
    setCurrentSearchTerm(searchTerm)
    setCurrentFilters(filters)
  }

  const handleSearch = (searchTerm: string, filters: SearchFilter) => {
    applyFilters(keys, searchTerm, filters)
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      string: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      hash: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      list: "bg-green-500/10 text-green-500 border-green-500/20",
      set: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      zset: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      json: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    }
    return colors[type] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
  }

  if (!activeConnection?.isConnected) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-96 bg-card border-border">
          <CardContent className="pt-6 text-center">
            <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-medium mb-2">No Active Connection</h3>
            <p className="text-muted-foreground mb-4">Connect to a Redis server to browse data</p>
            <Button onClick={() => {}} className="bg-red-500 hover:bg-red-600">
              Connect to Redis
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex">
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <EnhancedSearch onSearch={handleSearch} />
        </div>
        <div className="flex items-center justify-between p-2 border-b border-border">
          <span className="text-xs font-medium text-muted-foreground px-2">{filteredKeys.length} KEYS</span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {filteredKeys.map((key) => (
            <div
              key={key.key}
              className={`flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 ${
                selectedKey === key.key ? "bg-muted" : ""
              }`}
              onClick={() => handleKeySelect(key.key)}
            >
              <div className="overflow-hidden">
                <div className="font-mono text-sm truncate">{key.key}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getTypeColor(key.type)}>
                    {key.type}
                  </Badge>
                  {key.ttl > 0 && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {key.ttl}s
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">{key.size}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedKey ? (
          <>
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-mono text-sm">{selectedKey}</h3>
                <div className="flex items-center gap-2 mt-1">
                  {keys.find((k) => k.key === selectedKey)?.type && (
                    <Badge
                      variant="outline"
                      className={getTypeColor(keys.find((k) => k.key === selectedKey)?.type || "")}
                    >
                      {keys.find((k) => k.key === selectedKey)?.type}
                    </Badge>
                  )}
                  {(keys.find((k) => k.key === selectedKey)?.ttl || 0) > 0 && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      {keys.find((k) => k.key === selectedKey)?.ttl}s
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-8">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-8" onClick={() => setIsEditing(!isEditing)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {isEditing ? (
              <div className="flex-1 p-4">
                <KeyValueEditor
                  data={keyData}
                  onSave={(data) => {
                    console.log("Saving data:", data)
                    setKeyData(data)
                    setIsEditing(false)
                  }}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            ) : (
              <div className="flex-1 p-4">
                <Tabs value={viewMode} onValueChange={setViewMode} className="h-full flex flex-col">
                  <TabsList className="mb-4">
                    <TabsTrigger value="table">Table View</TabsTrigger>
                    <TabsTrigger value="json">JSON View</TabsTrigger>
                    <TabsTrigger value="text">Text View</TabsTrigger>
                  </TabsList>
                  <TabsContent value="table" className="flex-1 m-0">
                    <div className="border border-border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-border">
                            <TableHead className="text-muted-foreground">Key</TableHead>
                            <TableHead className="text-muted-foreground">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {typeof keyData === "object" && keyData !== null ? (
                            Object.entries(keyData).map(([key, value]) => (
                              <TableRow key={key} className="border-border">
                                <TableCell className="font-mono">{key}</TableCell>
                                <TableCell className="font-mono">
                                  {typeof value === "object"
                                    ? JSON.stringify(value).substring(0, 100) +
                                      (JSON.stringify(value).length > 100 ? "..." : "")
                                    : String(value)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow className="border-border">
                              <TableCell className="font-mono">value</TableCell>
                              <TableCell className="font-mono">{String(keyData)}</TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                  <TabsContent value="json" className="flex-1 m-0">
                    <JsonViewer data={keyData} />
                  </TabsContent>
                  <TabsContent value="text" className="flex-1 m-0">
                    <div className="bg-card border border-border rounded-md p-4 font-mono text-sm whitespace-pre-wrap h-full overflow-auto">
                      {typeof keyData === "object" ? JSON.stringify(keyData, null, 2) : String(keyData)}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-medium mb-2">No Key Selected</h3>
              <p>Select a key from the list to view its data</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
