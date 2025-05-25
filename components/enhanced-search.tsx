"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Search, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type SearchFilter = {
  type?: string
  ttl?: "all" | "with-expiry" | "no-expiry"
  pattern?: "exact" | "prefix" | "contains" | "regex"
}

type EnhancedSearchProps = {
  onSearch: (term: string, filters: SearchFilter) => void
  className?: string
}

export function EnhancedSearch({ onSearch, className }: EnhancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState<SearchFilter>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const historyRef = useRef<HTMLDivElement>(null)

  // Handle outside clicks for history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setShowHistory(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSearch = () => {
    if (searchTerm.trim()) {
      onSearch(searchTerm, filters)

      // Add to search history if not already present
      if (!searchHistory.includes(searchTerm)) {
        const newHistory = [searchTerm, ...searchHistory].slice(0, 10) // Keep last 10 searches
        setSearchHistory(newHistory)
        // Save to localStorage in a real implementation
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "ArrowDown" && searchHistory.length > 0) {
      setShowHistory(true)
    }
  }

  const clearSearch = () => {
    setSearchTerm("")
    setFilters({})
    onSearch("", {})
    searchInputRef.current?.focus()
  }

  const selectHistoryItem = (item: string) => {
    setSearchTerm(item)
    setShowHistory(false)
    searchInputRef.current?.focus()
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(Boolean).length
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className={cn("relative", className)}>
      <div className="relative flex items-center">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder="Search keys..."
          className="pl-9 pr-20 bg-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchHistory.length > 0 && setShowHistory(true)}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {searchTerm && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={clearSearch}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-6 w-6", activeFilterCount > 0 && "text-red-500")}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-3.5 w-3.5" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <h4 className="mb-2 text-sm font-medium">Data Type</h4>
                <div className="flex flex-wrap gap-1 mb-3">
                  {["string", "hash", "list", "set", "zset", "json"].map((type) => (
                    <Badge
                      key={type}
                      variant="outline"
                      className={cn(
                        "cursor-pointer capitalize",
                        filters.type === type && "bg-red-500/10 text-red-500 border-red-500/20",
                      )}
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          type: prev.type === type ? undefined : type,
                        }))
                      }}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>

                <h4 className="mb-2 text-sm font-medium">Expiration</h4>
                <div className="flex flex-wrap gap-1 mb-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "cursor-pointer",
                      filters.ttl === "with-expiry" && "bg-red-500/10 text-red-500 border-red-500/20",
                    )}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        ttl: prev.ttl === "with-expiry" ? undefined : "with-expiry",
                      }))
                    }}
                  >
                    With expiry
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "cursor-pointer",
                      filters.ttl === "no-expiry" && "bg-red-500/10 text-red-500 border-red-500/20",
                    )}
                    onClick={() => {
                      setFilters((prev) => ({
                        ...prev,
                        ttl: prev.ttl === "no-expiry" ? undefined : "no-expiry",
                      }))
                    }}
                  >
                    No expiry
                  </Badge>
                </div>

                <h4 className="mb-2 text-sm font-medium">Pattern Matching</h4>
                <div className="flex flex-wrap gap-1">
                  {["exact", "prefix", "contains", "regex"].map((pattern) => (
                    <Badge
                      key={pattern}
                      variant="outline"
                      className={cn(
                        "cursor-pointer capitalize",
                        filters.pattern === pattern && "bg-red-500/10 text-red-500 border-red-500/20",
                      )}
                      onClick={() => {
                        setFilters((prev) => ({
                          ...prev,
                          pattern: prev.pattern === pattern ? undefined : (pattern as any),
                        }))
                      }}
                    >
                      {pattern}
                    </Badge>
                  ))}
                </div>

                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-xs"
                    onClick={() => {
                      setFilters({})
                    }}
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>

      {/* Search history dropdown */}
      {showHistory && searchHistory.length > 0 && (
        <div
          ref={historyRef}
          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-md z-10"
        >
          <div className="flex items-center justify-between p-2 border-b border-border">
            <span className="text-xs font-medium">Recent Searches</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => {
                setSearchHistory([])
                setShowHistory(false)
              }}
            >
              Clear History
            </Button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {searchHistory.map((item, index) => (
              <div
                key={index}
                className="flex items-center px-3 py-2 hover:bg-muted cursor-pointer"
                onClick={() => selectHistoryItem(item)}
              >
                <Search className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
