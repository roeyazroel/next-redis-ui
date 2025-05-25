"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

type JsonViewerProps = {
  data: any
  level?: number
}

export function JsonViewer({ data, level = 0 }: JsonViewerProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggleExpand = (key: string) => {
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })
  }

  if (data === null) {
    return <span className="text-gray-400">null</span>
  }

  if (typeof data !== "object") {
    if (typeof data === "string") {
      return <span className="text-green-400">"{data}"</span>
    }
    if (typeof data === "number") {
      return <span className="text-blue-400">{data}</span>
    }
    if (typeof data === "boolean") {
      return <span className="text-yellow-400">{data ? "true" : "false"}</span>
    }
    return <span>{String(data)}</span>
  }

  const isArray = Array.isArray(data)
  const isEmpty = Object.keys(data).length === 0

  if (isEmpty) {
    return <span>{isArray ? "[]" : "{}"}</span>
  }

  return (
    <div className={cn("pl-4", level > 0 && "border-l border-border")}>
      {Object.entries(data).map(([key, value], index) => {
        const isObject = typeof value === "object" && value !== null
        const isExpanded = expanded[`${level}-${key}`]
        const hasChildren = isObject && Object.keys(value).length > 0

        return (
          <div key={`${key}-${index}`} className="py-1">
            <div className="flex items-center">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpand(`${level}-${key}`)}
                  className="mr-1 text-muted-foreground hover:text-foreground focus:outline-none"
                >
                  {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                </button>
              ) : (
                <span className="w-4 mr-1" />
              )}

              <span className="text-purple-400 font-mono">{isArray ? `[${key}]` : key}</span>
              <span className="mx-1 text-gray-400">:</span>

              {isObject ? (
                <>
                  <span className="text-gray-400">
                    {isArray ? "[" : "{"}
                    {!isExpanded && "..."}
                    {!isExpanded && (isArray ? "]" : "}")}
                  </span>
                </>
              ) : (
                <JsonViewer data={value} level={level + 1} />
              )}
            </div>

            {isObject && isExpanded && (
              <div className="ml-4 mt-1">
                <JsonViewer data={value} level={level + 1} />
                <div className="text-gray-400 mt-1">{isArray ? "]" : "}"}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
