"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Trash2, Save, X } from "lucide-react"

type KeyValueEditorProps = {
  data: any
  onSave: (data: any) => void
  onCancel: () => void
}

export function KeyValueEditor({ data, onSave, onCancel }: KeyValueEditorProps) {
  const [editedData, setEditedData] = useState<any>(data)

  const handleStringChange = (value: string) => {
    setEditedData(value)
  }

  const handleObjectChange = (key: string, value: string) => {
    setEditedData({
      ...editedData,
      [key]: value,
    })
  }

  const handleAddField = () => {
    setEditedData({
      ...editedData,
      "": "",
    })
  }

  const handleRemoveField = (keyToRemove: string) => {
    const newData = { ...editedData }
    delete newData[keyToRemove]
    setEditedData(newData)
  }

  const handleKeyChange = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return

    const newData: Record<string, any> = {}
    Object.entries(editedData).forEach(([key, value]) => {
      if (key === oldKey) {
        newData[newKey] = value
      } else {
        newData[key] = value
      }
    })

    setEditedData(newData)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        {typeof editedData === "object" && editedData !== null ? (
          <div className="space-y-2">
            {Object.entries(editedData).map(([key, value]) => (
              <div key={key} className="flex gap-2">
                <Input
                  value={key}
                  onChange={(e) => handleKeyChange(key, e.target.value)}
                  className="w-1/3 bg-input"
                  placeholder="Key"
                />
                <Input
                  value={typeof value === "object" ? JSON.stringify(value) : String(value)}
                  onChange={(e) => handleObjectChange(key, e.target.value)}
                  className="flex-1 bg-input"
                  placeholder="Value"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveField(key)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <Textarea
            value={String(editedData)}
            onChange={(e) => handleStringChange(e.target.value)}
            className="h-full min-h-[300px] bg-input font-mono"
          />
        )}
      </div>

      {typeof editedData === "object" && editedData !== null && (
        <Button
          variant="outline"
          className="mt-4 w-full border-dashed border-border text-muted-foreground"
          onClick={handleAddField}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button onClick={() => onSave(editedData)} className="bg-red-500 hover:bg-red-600">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
