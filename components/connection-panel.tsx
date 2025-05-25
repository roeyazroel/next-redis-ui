"use client"

import { useState } from "react"
import { useConnection } from "@/components/connection-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Trash2, Edit, Power, PowerOff, RefreshCw } from "lucide-react"

export function ConnectionPanel() {
  const { connections, addConnection, removeConnection, connectToRedis, disconnectFromRedis } = useConnection()
  const [isAddingConnection, setIsAddingConnection] = useState(false)
  const [newConnection, setNewConnection] = useState({
    name: "",
    host: "",
    port: 6379,
    username: "",
    password: "",
  })
  const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({})

  const handleAddConnection = async () => {
    try {
      await addConnection(newConnection)
      setNewConnection({
        name: "",
        host: "",
        port: 6379,
        username: "",
        password: "",
      })
      setIsAddingConnection(false)
    } catch (error) {
      console.error("Failed to add connection:", error)
    }
  }

  const handleToggleConnection = async (connectionId: string, isConnected: boolean) => {
    setIsConnecting((prev) => ({ ...prev, [connectionId]: true }))

    try {
      if (isConnected) {
        await disconnectFromRedis(connectionId)
      } else {
        await connectToRedis(connectionId)
      }
    } catch (error) {
      console.error("Connection toggle failed:", error)
    } finally {
      setIsConnecting((prev) => ({ ...prev, [connectionId]: false }))
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Redis Connections</h2>
        <Dialog open={isAddingConnection} onOpenChange={setIsAddingConnection}>
          <DialogTrigger asChild>
            <Button className="bg-red-500 hover:bg-red-600">
              <Plus className="h-4 w-4 mr-2" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Redis Connection</DialogTitle>
              <DialogDescription>Enter the details for your Redis server connection.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input
                  id="name"
                  placeholder="My Redis Server"
                  className="bg-input"
                  value={newConnection.name}
                  onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  placeholder="localhost or redis.example.com"
                  className="bg-input"
                  value={newConnection.host}
                  onChange={(e) => setNewConnection({ ...newConnection, host: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  placeholder="6379"
                  className="bg-input"
                  value={newConnection.port}
                  onChange={(e) => setNewConnection({ ...newConnection, port: Number.parseInt(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="username">Username (optional)</Label>
                <Input
                  id="username"
                  placeholder="Username"
                  className="bg-input"
                  value={newConnection.username}
                  onChange={(e) => setNewConnection({ ...newConnection, username: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  className="bg-input"
                  value={newConnection.password}
                  onChange={(e) => setNewConnection({ ...newConnection, password: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingConnection(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddConnection} className="bg-red-500 hover:bg-red-600">
                Add Connection
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Manage Connections</CardTitle>
          <CardDescription>Configure and manage your Redis server connections.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Host</TableHead>
                <TableHead className="text-muted-foreground">Port</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connections.map((connection) => (
                <TableRow key={connection.id} className="border-border">
                  <TableCell>{connection.name}</TableCell>
                  <TableCell>{connection.host}</TableCell>
                  <TableCell>{connection.port}</TableCell>
                  <TableCell>
                    {connection.isConnected ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Connected
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
                        Disconnected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleConnection(connection.id, connection.isConnected)}
                        className={connection.isConnected ? "text-green-500" : "text-gray-400"}
                        disabled={isConnecting[connection.id]}
                      >
                        {isConnecting[connection.id] ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : connection.isConnected ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeConnection(connection.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-muted-foreground">Connections are stored in your browser&apos;s local storage.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
