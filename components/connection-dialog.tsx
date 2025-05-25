"use client";

import { useConnection } from "@/components/connection-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";

type Connection = {
  id: string;
  name: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls?: boolean;
  isConnected: boolean;
};

interface ConnectionDialogProps {
  mode: "create" | "edit";
  connection?: Connection;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ConnectionFormState {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  tls: boolean;
}

interface FormErrors {
  name?: string;
  host?: string;
  port?: string;
}

export function ConnectionDialog({
  mode,
  connection,
  open,
  onOpenChange,
}: ConnectionDialogProps) {
  const { addConnection, updateConnection, isLoading } = useConnection();

  const [formState, setFormState] = useState<ConnectionFormState>({
    name: "",
    host: "",
    port: 6379,
    username: "",
    password: "",
    tls: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && connection) {
      setFormState({
        name: connection.name,
        host: connection.host,
        port: connection.port,
        username: connection.username || "",
        password: connection.password || "",
        tls: connection.tls || false,
      });
    } else if (mode === "create") {
      setFormState({
        name: "",
        host: "",
        port: 6379,
        username: "",
        password: "",
        tls: false,
      });
    }
    setErrors({});
  }, [mode, connection, open]);

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formState.name.trim()) {
      newErrors.name = "Connection name is required";
    }

    if (!formState.host.trim()) {
      newErrors.host = "Host is required";
    } else {
      // Basic host validation (allow IP addresses and hostnames)
      const hostPattern = /^[a-zA-Z0-9.-]+$/;
      if (!hostPattern.test(formState.host)) {
        newErrors.host = "Invalid host format";
      }
    }

    if (formState.port < 1 || formState.port > 65535) {
      newErrors.port = "Port must be between 1 and 65535";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const connectionData = {
        name: formState.name.trim(),
        host: formState.host.trim(),
        port: formState.port,
        username: formState.username.trim() || undefined,
        password: formState.password || undefined,
        tls: formState.tls,
      };

      if (mode === "create") {
        await addConnection(connectionData);
      } else if (mode === "edit" && connection) {
        await updateConnection(connection.id, connectionData);
      }

      onOpenChange(false);
    } catch (error) {
      console.error(`Failed to ${mode} connection:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const updateFormField = <K extends keyof ConnectionFormState>(
    field: K,
    value: ConnectionFormState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? "Add Redis Connection"
              : "Edit Redis Connection"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Enter the details for your Redis server connection."
              : "Update the details for your Redis server connection."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              placeholder="My Redis Server"
              className="bg-input"
              value={formState.name}
              onChange={(e) => updateFormField("name", e.target.value)}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              placeholder="localhost or redis.example.com"
              className="bg-input"
              value={formState.host}
              onChange={(e) => updateFormField("host", e.target.value)}
            />
            {errors.host && (
              <p className="text-sm text-red-500">{errors.host}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="number"
              placeholder="6379"
              className="bg-input"
              value={formState.port}
              onChange={(e) =>
                updateFormField("port", Number.parseInt(e.target.value) || 6379)
              }
            />
            {errors.port && (
              <p className="text-sm text-red-500">{errors.port}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username (optional)</Label>
            <Input
              id="username"
              placeholder="Username"
              className="bg-input"
              value={formState.username}
              onChange={(e) => updateFormField("username", e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password (optional)</Label>
            <Input
              id="password"
              type="password"
              placeholder="Password"
              className="bg-input"
              value={formState.password}
              onChange={(e) => updateFormField("password", e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="tls"
              checked={formState.tls}
              onCheckedChange={(checked) => updateFormField("tls", checked)}
            />
            <Label htmlFor="tls">Use TLS/SSL</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-red-500 hover:bg-red-600"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting
              ? mode === "create"
                ? "Adding..."
                : "Updating..."
              : mode === "create"
              ? "Add Connection"
              : "Update Connection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
