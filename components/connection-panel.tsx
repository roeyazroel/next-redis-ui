"use client";

import { ConnectionDialog } from "@/components/connection-dialog";
import { useConnection } from "@/components/connection-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Plus, Power, PowerOff, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";

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

export function ConnectionPanel() {
  const { connections, removeConnection, connectToRedis, disconnectFromRedis } =
    useConnection();
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<
    Connection | undefined
  >();
  const [isConnecting, setIsConnecting] = useState<Record<string, boolean>>({});

  const handleEditConnection = (connection: Connection) => {
    setSelectedConnection(connection);
    setDialogMode("edit");
  };

  const handleCreateConnection = () => {
    setSelectedConnection(undefined);
    setDialogMode("create");
  };

  const handleCloseDialog = () => {
    setDialogMode(null);
    setSelectedConnection(undefined);
  };

  const handleToggleConnection = async (
    connectionId: string,
    isConnected: boolean
  ) => {
    setIsConnecting((prev) => ({ ...prev, [connectionId]: true }));

    try {
      if (isConnected) {
        await disconnectFromRedis(connectionId);
      } else {
        await connectToRedis(connectionId);
      }
    } catch (error) {
      console.error("Connection toggle failed:", error);
    } finally {
      setIsConnecting((prev) => ({ ...prev, [connectionId]: false }));
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Redis Connections</h2>
        <Button
          onClick={handleCreateConnection}
          className="bg-red-500 hover:bg-red-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Connection
        </Button>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle>Manage Connections</CardTitle>
          <CardDescription>
            Configure and manage your Redis server connections.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">Host</TableHead>
                <TableHead className="text-muted-foreground">Port</TableHead>
                <TableHead className="text-muted-foreground">Source</TableHead>
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
                    <Badge
                      variant="outline"
                      className={
                        connection.source === "environment"
                          ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      }
                    >
                      {connection.source === "environment"
                        ? "Environment"
                        : "User"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {connection.isConnected ? (
                      <Badge
                        variant="outline"
                        className="bg-green-500/10 text-green-500 border-green-500/20"
                      >
                        Connected
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-500/10 text-gray-400 border-gray-500/20"
                      >
                        Disconnected
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleToggleConnection(
                            connection.id,
                            connection.isConnected
                          )
                        }
                        className={
                          connection.isConnected
                            ? "text-green-500"
                            : "text-gray-400"
                        }
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditConnection(connection)}
                        className="text-gray-400 hover:text-white"
                        disabled={connection.source === "environment"}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeConnection(connection.id)}
                        className="text-gray-400 hover:text-red-500"
                        disabled={connection.source === "environment"}
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
          <p className="text-xs text-muted-foreground">
            User connections are stored in your browser&apos;s local storage.
            Environment connections are configured via environment variables.
          </p>
        </CardFooter>
      </Card>

      <ConnectionDialog
        mode={dialogMode || "create"}
        connection={selectedConnection}
        open={dialogMode !== null}
        onOpenChange={handleCloseDialog}
      />
    </div>
  );
}
