"use client"

import { useState, useEffect } from "react"
import { useConnection } from "@/components/connection-provider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Plus, Trash2, Edit, Copy, Clock, Database, AlertCircle } from "lucide-react"
import { KeyValueEditor } from "@/components/key-value-editor"
import { JsonViewer } from "@/components/json-viewer"
import { EnhancedSearch } from "@/components/enhanced-search"
import { toast } from "@/components/ui/use-toast"

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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch keys when connection changes
  useEffect(() => {
    if (activeConnection?.isConnected) {
      fetchKeys()
    } else {
      setKeys([])
      setFilteredKeys([])
      setSelectedKey(null)
      setKeyData(null)
    }
  }, [activeConnection])

  // Fetch key data when selected key changes
  useEffect(() => {
    if (activeConnection?.isConnected && selectedKey) {
      fetchKeyData(selectedKey)
    }
  }, [activeConnection, selectedKey])

  const fetchKeys = async (pattern = "*") => {
    if (!activeConnection?.isConnected) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/redis/keys?connectionId=${activeConnection.id}&pattern=${encodeURIComponent(pattern)}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch keys")
      }

      const data = await response.json()
      setKeys(data.keys || [])
      applyFilters(data.keys || [], currentSearchTerm, currentFilters)
    } catch (err: any) {
      setError(err.message || "Failed to fetch keys")
      toast({
        title: "Error",
        description: err.message || "Failed to fetch keys",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchKeyData = async (key: string) => {
    if (!activeConnection?.isConnected) return

    setIsLoading(true)
    setError(null)

    try {
      const keyType = keys.find((k) => k.key === key)?.type
      const response = await fetch(
        `/api/redis/key?connectionId=${activeConnection.id}&key=${encodeURIComponent(key)}${keyType ? `&type=${keyType}` : ""}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch key data")
      }

      const data = await response.json()
      setKeyData(data.value)
    } catch (err: any) {
      setError(err.message || "Failed to fetch key data")
      toast({
        title: "Error",
        description: err.message || "Failed to fetch key data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeySelect = (key: string) => {
    setSelectedKey(key)
    setIsEditing(false)
  }

  const handleRefresh = () => {
    fetchKeys()
    if (selectedKey) {
      fetchKeyData(selectedKey)
    }
  }

  const handleSaveKey = async (data: any) => {
    if (!activeConnection?.isConnected || !selectedKey) return

    setIsLoading(true)
    setError(null)

    try {
      const keyType = keys.find((k) => k.key === selectedKey)?.type

      const response = await fetch("/api/redis/key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connectionId: activeConnection.id,
          key: selectedKey,
          value: data,
          type: keyType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save key")
      }

      setKeyData(data)
      setIsEditing(false)
      toast({
        title: "Success",
        description: "Key updated successfully",
      })
    } catch (err: any) {
      setError(err.message || "Failed to save key")
      toast({
        title: "Error",
        description: err.message || "Failed to save key",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteKey = async () => {
    if (!activeConnection?.isConnected || !selectedKey) return

    if (!confirm(`Are you sure you want to delete the key "${selectedKey}"?`)) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/redis/key?connectionId=${activeConnection.id}&key=${encodeURIComponent(selectedKey)}`,
        {
          method: "DELETE",
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete key")
      }

      // Remove from keys list
      const updatedKeys = keys.filter((k) => k.key !== selectedKey)
      setKeys(updatedKeys)
      applyFilters(updatedKeys, currentSearchTerm, currentFilters)

      // Clear selection
      setSelectedKey(null)
      setKeyData(null)

      toast({
        title: "Success",
        description: "Key deleted successfully",
      })
    } catch (err: any) {
      setError(err.message || "Failed to delete key")
      toast({
        title: "Error",
        description: err.message || "Failed to delete key",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
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
          <span className="text-xs font-medium text-muted-foreground px-2">
            {isLoading ? "Loading..." : `${filteredKeys.length} KEYS`}
          </span>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleRefresh} disabled={isLoading}>
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="p-4 text-sm text-red-500 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

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

          {!isLoading && filteredKeys.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">No keys found</div>
          )}
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      typeof keyData === "object" ? JSON.stringify(keyData) : String(keyData),
                    )
                    toast({
                      title: "Copied",
                      description: "Key value copied to clipboard",
                    })
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => setIsEditing(!isEditing)}
                  disabled={isLoading}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-red-500 hover:text-red-400"
                  onClick={handleDeleteKey}
                  disabled={isLoading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            {isLoading && (
              <div className="flex-1 flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isLoading && isEditing ? (
              <div className="flex-1 p-4">
                <KeyValueEditor data={keyData} onSave={handleSaveKey} onCancel={() => setIsEditing(false)} />
              </div>
            ) : (
              !isLoading && (
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
              )
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
