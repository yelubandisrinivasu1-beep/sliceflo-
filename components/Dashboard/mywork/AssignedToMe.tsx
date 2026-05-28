"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, Info, Plus, ChevronRight as ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/stores/projects-store";
import { useProfileStore } from "@/stores/profile-store";
import { PriorityBadge } from "./utils";

import { ScrollArea } from "@/components/ui/scroll-area";

export function AssignedToMe() {
  const { myWork } = useProfileStore();
  const allProjects = useProjectsStore((s) => s.projects);

  const dynamicStatuses = useMemo(() => {
    const seen = new Set<string>()
    const statuses: { value: string; label: string; color: string; isFinal: boolean }[] = []

    allProjects.forEach((p) => {
      (p.taskStatusConfig ?? []).forEach((s) => {
        if (!seen.has(s.value)) {
          seen.add(s.value)
          statuses.push({
            value: s.value,
            label: s.label,
            color: s.color,
            isFinal: s.isFinal ?? false,
          })
        }
      })
    })

    return statuses
  }, [allProjects])

  const myTasks = useMemo(() => {
    return (myWork?.tasks?.list || []).map((t) => ({
      ...t,
      name: t.title,
      endDate: t.endDate || t.dueDate,
    }))
  }, [myWork])

  const [open, setOpen] = useState<Record<string, boolean>>({})

  const isOpen = (key: string) => open[key] !== false

  const itemGroups = useMemo(() => {
    return dynamicStatuses
      .map((status) => {
        const items = myTasks.filter(
          (t) => (t.status ?? "").toLowerCase().trim() === status.value.toLowerCase().trim()
        )
        return { ...status, items, itemCount: items.length }
      })
      .filter((g) => g.itemCount > 0)
  }, [myTasks, dynamicStatuses])

  if (myTasks.length === 0) {
    return (
      <div className="flex flex-col gap-3 h-full overflow-hidden">
        <h2 className="text-sm font-semibold tracking-tight shrink-0">Assigned to me</h2>
        <div className="rounded-xl border border-dashed p-8 text-center flex-1">
          <p className="text-xs text-muted-foreground">No tasks assigned to you yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-sm font-semibold tracking-tight">Assigned to me</h2>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-muted-foreground">
          <Plus className="h-3.5 w-3.5" /> Add Task
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-3 pr-4 pb-4">
            {itemGroups.map((group) => (
              <div
                key={group.value}
                className="overflow-hidden rounded-xl border bg-background shadow-none"
                style={{ borderLeftWidth: 4, borderLeftColor: group.color }}
              >
                <button
                  onClick={() => setOpen((prev) => ({ ...prev, [group.value]: !isOpen(group.value) }))}
                  className="flex w-full items-center gap-2 bg-muted/30 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      !isOpen(group.value) && "-rotate-90"
                    )}
                    style={{ color: group.color }}
                  />
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <span className="text-sm font-semibold" style={{ color: group.color }}>
                    {group.label}
                  </span>
                  <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                    {group.itemCount} Items
                  </Badge>
                </button>

                {isOpen(group.value) && (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/10 hover:bg-muted/10">
                          <TableHead className="w-10 py-2 pl-4" />
                          <TableHead className="py-2 text-xs font-semibold text-muted-foreground">Item</TableHead>
                          <TableHead className="py-2 text-xs font-semibold text-muted-foreground">
                            <div className="flex items-center gap-1">
                              Due Date <Info className="h-3 w-3 opacity-50" />
                            </div>
                          </TableHead>
                          <TableHead className="py-2 text-xs font-semibold text-muted-foreground">Priority</TableHead>
                          <TableHead className="w-10 py-2">
                            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.items.map((item) => (
                          <TableRow key={item.id} className="hover:bg-muted/30">
                            <TableCell className="py-2.5 pl-4">
                              <Checkbox className="h-3.5 w-3.5" />
                            </TableCell>
                            <TableCell className="py-2.5">
                              <div className="flex items-center gap-2">
                                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="text-sm font-medium">{item.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-2.5 text-xs text-muted-foreground">
                              {item.endDate
                                ? new Date(item.endDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
                                : "No date"}
                            </TableCell>
                            <TableCell className="py-2.5">
                              <PriorityBadge priority={item.priority || "medium"} />
                            </TableCell>
                            <TableCell className="py-2.5" />
                          </TableRow>
                        ))}

                        <TableRow className="hover:bg-transparent">
                          <TableCell className="py-2 pl-4" colSpan={2}>
                            <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                              <Plus className="h-3.5 w-3.5" /> Add Task
                            </button>
                          </TableCell>
                          <TableCell colSpan={3} />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}