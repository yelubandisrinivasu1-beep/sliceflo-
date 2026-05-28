

"use client"
import { useState, useMemo } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Search, Star, MoreHorizontal, Flag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useProjectsStore } from "@/stores/projects-store"
import { useProfileStore } from "@/stores/profile-store"

import { ScrollArea } from "@/components/ui/scroll-area"

export function MyWorkPanel() {
  const projects = useProjectsStore((s) => s.projects)
  const { myWork } = useProfileStore()
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})

  // Collect all taskPriorityConfigs across all projects (deduplicated by value)
  const allPriorityConfigs = useMemo(() => {
    const seen = new Set<string>()
    const configs: { value: string; color?: string }[] = []
    for (const project of projects) {
      for (const cfg of project.taskPriorityConfig ?? []) {
        if (!seen.has(cfg.value)) {
          seen.add(cfg.value)
          configs.push({ value: cfg.value, color: cfg.color })
        }
      }
    }
    return configs
  }, [projects])

  const allItems = useMemo(() => {
    return (myWork?.tasks?.list || [])
      .map((t) => ({
        ...t,
        name: t.title,
        type: "task" as const
      }))
  }, [myWork])

  // First filter by search
  const searchFiltered = useMemo(
    () => allItems.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [allItems, search]
  )

  // Then filter by priority tab
  const filteredItems = useMemo(() => {
    if (priorityFilter === "all") return searchFiltered
    if (priorityFilter === "none") return searchFiltered.filter((t) => !t.priority)
    return searchFiltered.filter(
      (t) => t.priority?.toLowerCase() === priorityFilter.toLowerCase()
    )
  }, [searchFiltered, priorityFilter])

  // Group by status
  // Replace groupedItems
  const groupedItems = useMemo(() => {
    const priorityGroups: Record<string, typeof filteredItems> = {}

    // One group per priority config
    for (const cfg of allPriorityConfigs) {
      priorityGroups[cfg.value] = filteredItems.filter(
        (t) => t.priority?.toLowerCase() === cfg.value.toLowerCase()
      )
    }

    // "No Priority" group for tasks with no priority set
    priorityGroups["none"] = filteredItems.filter((t) => !t.priority)

    return priorityGroups
  }, [filteredItems, allPriorityConfigs])

  const handleShowMore = (key: string) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [key]: (prev[key] || 10) + 10,
    }))
  }

  const renderItemList = (list: typeof filteredItems, groupKey: string) => {
    const limit = visibleCounts[groupKey] || 10
    const visibleList = list.slice(0, limit)
    const hasMore = list.length > limit

    return (
      <div className="flex flex-col gap-1 mt-2">
        {visibleList.map((item) => (
          <div
            key={item.id}
            className="group flex items-center justify-between p-2 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-border cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-4 w-4 rounded border border-muted-foreground/30 flex items-center justify-center group-hover:border-blue-500 transition-colors">
                <div className="h-2 w-2 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium truncate">{item.name}</span>
                {/* Show priority badge inline if "all" tab selected */}
                {priorityFilter === "all" && item.priority && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    {(() => {
                      const cfg = allPriorityConfigs.find(
                        (c) => c.value?.toLowerCase() === item.priority?.toLowerCase()
                      )
                      return cfg?.color ? (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                      ) : null
                    })()}
                    {item.priority}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-yellow-500">
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleShowMore(groupKey)}
            className="w-full text-xs mt-2 text-muted-foreground"
          >
            Show more
          </Button>
        )}
        {list.length === 0 && (
          <div className="py-8 text-center border border-dashed rounded-xl">
            <p className="text-xs text-muted-foreground">No items in this category.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-bold tracking-tight">My Work</h2>
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search work..."
            className="pl-8 h-8 text-xs bg-muted/30 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <Tabs defaultValue={allPriorityConfigs[0]?.value ?? "none"} className="w-full flex-1 flex flex-col overflow-hidden">
        <TabsList
          className="h-9 p-1 bg-muted/30 rounded-xl flex shrink-0"
          style={{ gridTemplateColumns: `repeat(${allPriorityConfigs.length + 1}, 1fr)` }}
        >
          {allPriorityConfigs.map((cfg) => (
            <TabsTrigger
              key={cfg.value}
              value={cfg.value}
              className="text-[11px] rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm flex items-center gap-1"
            >
              {cfg.color && (
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.color }} />
              )}
              {cfg.value}
              <span className="ml-1 text-[10px] opacity-60">
                {groupedItems[cfg.value]?.length ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="flex-1 overflow-hidden">
          {allPriorityConfigs.map((cfg) => (
            <TabsContent key={cfg.value} value={cfg.value} className="h-full mt-0 data-[state=active]:block">
              <ScrollArea className="h-full">
                {renderItemList(groupedItems[cfg.value] ?? [], cfg.value)}
              </ScrollArea>
            </TabsContent>
          ))}

          <TabsContent value="none" className="h-full mt-0 data-[state=active]:block">
            <ScrollArea className="h-full">
              {renderItemList(groupedItems["none"] ?? [], "none")}
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>

    </div>
  )
}