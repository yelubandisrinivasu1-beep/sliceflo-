


"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { StatusBadge } from "./utils";
import { ALL_PORTFOLIO_FIELDS } from "@/components/portfolios/views/list-view/common/PortfolioFieldVisibilityPopup";

const PAGE_SIZE = 8

// Priority badge

// function PriorityBadge({
//   priority,
//   configs,
// }: {
//   priority: string
//   configs: { value: string; label: string; color: string }[]
// }) {
//   const match = configs.find((c) => c.value.toLowerCase() === priority?.toLowerCase())

//   return (
//     <span
//       className="text-[10px] font-medium px-2 py-0.5 rounded-full"
//       style={{
//         backgroundColor: match?.color ? `${match.color}22` : "#f3f4f6",
//         color: match?.color ?? "#6B7280",
//       }}
//     >
//       {match?.label ?? priority ?? "—"}
//     </span>
//   )
// }

// Format date nicely
function formatDate(date: string | null | undefined) {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

export function RecentProjectsTable() {
  const { projects } = useProjectsStore()
  const tasks = useTasksStore((s) => s.tasks)

  const [filter, setFilter] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(0)
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(ALL_PORTFOLIO_FIELDS.map(f => f.id)))

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageData = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
  const isAllSelected = pageData.length > 0 && pageData.every((p) => selected.has(p.id!))

  const priorityConfigs = useMemo(() => {
    const seen = new Set<string>()
    const configs: { value: string; label: string; color: string }[] = []
    for (const project of projects) {
      for (const cfg of project.projectPriorityConfig ?? []) {
        if (!seen.has(cfg.value)) {
          seen.add(cfg.value)
          configs.push({ value: cfg.value, label: cfg.label, color: cfg.color })
        }
      }
    }
    return configs
  }, [projects])

  const toggleAll = () => {
    const next = new Set(selected)
    if (isAllSelected) pageData.forEach((p) => next.delete(p.id!))
    else pageData.forEach((p) => next.add(p.id!))
    setSelected(next)
  }
  const toggleRow = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const toggleCol = (col: string) => {
    const field = ALL_PORTFOLIO_FIELDS.find(f => f.id === col);
    if (field?.required) return;

    const next = new Set(visibleCols)
    next.has(col) ? next.delete(col) : next.add(col)
    setVisibleCols(next)
  }

  // Calculate real progress per project from tasks
  const getProgress = (projectId: string, project: typeof projects[0]) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId)
    if (projectTasks.length === 0) return 0

    const finalStatuses = new Set(
      project.taskStatusConfig?.filter((s) => s.isFinal).map((s) => s.value.toLowerCase()) ?? []
    )
    const done = projectTasks.filter((t) =>
      finalStatuses.has(t.status?.toLowerCase().trim() ?? "") || t.completed === true
    ).length

    return Math.round((done / projectTasks.length) * 100)
  }

  return (
    <Card className="rounded-2xl border bg-background shadow-none">
      <CardContent className="p-5">
        <p className="text-sm font-bold mb-4">Recent Projects</p>

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <Input
            placeholder="Filter projects..."
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(0) }}
            className="h-9 w-[280px] text-sm"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-9 gap-1.5 text-sm font-medium">
                Columns <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {ALL_PORTFOLIO_FIELDS.map((field) => (
                <DropdownMenuCheckboxItem
                  key={field.id}
                  checked={visibleCols.has(field.id)}
                  onCheckedChange={() => toggleCol(field.id)}
                  disabled={field.required}
                  className="text-sm"
                >
                  {field.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-muted/20">
                <TableHead className="w-12 pl-4">
                  <Checkbox checked={isAllSelected} onCheckedChange={toggleAll} className="h-4 w-4" />
                </TableHead>
                {ALL_PORTFOLIO_FIELDS.map(field =>
                  visibleCols.has(field.id) && (
                    <TableHead key={field.id} className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {field.label}
                    </TableHead>
                  )
                )}
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={ALL_PORTFOLIO_FIELDS.length + 2} className="text-center text-xs text-muted-foreground py-10">
                    No projects found.
                  </TableCell>
                </TableRow>
              ) : (
                pageData.map((p) => {
                  const isSelected = selected.has(p.id!)
                  const progress = getProgress(p.id!, p)

                  return (
                    <TableRow
                      key={p.id}
                      className={cn("hover:bg-muted/40 transition-colors", isSelected && "bg-muted/30")}
                    >
                      {/* Checkbox */}
                      <TableCell className="pl-4 py-3.5">
                        <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(p.id!)} className="h-4 w-4" />
                      </TableCell>

                      {ALL_PORTFOLIO_FIELDS.map(field => {
                        if (!visibleCols.has(field.id)) return null;

                        switch (field.id) {
                          case "id":
                            return (
                              <TableCell key={field.id} className="py-3.5">
                                <span className="text-xs text-muted-foreground font-mono">{p.id?.slice(-6).toUpperCase() ?? "—"}</span>
                              </TableCell>
                            );
                          case "name":
                            return (
                              <TableCell key={field.id} className="py-3.5">
                                <div className="flex items-center gap-2">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: p.color ?? "#6B7280" }}
                                  />
                                  <span className="text-sm font-medium whitespace-nowrap">{p.name}</span>
                                </div>
                              </TableCell>
                            );
                          case "phase":
                            return (
                              <TableCell key={field.id} className="py-3.5">
                                <span className="text-xs capitalize text-muted-foreground">{p.phase || "—"}</span>
                              </TableCell>
                            );
                          case "status":
                            return (
                              <TableCell key={field.id} className="py-3.5">
                                <StatusBadge status={p.status ?? "active"} />
                              </TableCell>
                            );
                          case "leader":
                            return (
                              <TableCell key={field.id} className="py-3.5">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {(p.leaders ?? []).length > 0 ? `${(p.leaders ?? []).length} leader(s)` : "—"}
                                </span>
                              </TableCell>
                            );
                          case "members":
                            return (
                              <TableCell key={field.id} className="py-3.5">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {(p.members ?? []).length > 0 ? `${(p.members ?? []).length} member(s)` : "—"}
                                </span>
                              </TableCell>
                            );
                          case "viewers":
                            return (
                              <TableCell key={field.id} className="py-3.5">
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  {(p.viewers ?? []).length > 0 ? `${(p.viewers ?? []).length} viewer(s)` : "—"}
                                </span>
                              </TableCell>
                            );
                          case "priority":
                            return (
                              <TableCell key={field.id} className="py-3.5">
                                <span className="text-xs capitalize text-muted-foreground">{p.priority || "—"}</span>
                              </TableCell>
                            );
                          case "startDate":
                            return (
                              <TableCell key={field.id} className="text-sm text-muted-foreground py-3.5 whitespace-nowrap">
                                {formatDate(p.startDate ?? p.createdAt)}
                              </TableCell>
                            );
                          case "endDate":
                            return (
                              <TableCell key={field.id} className="text-sm text-muted-foreground py-3.5 whitespace-nowrap">
                                {formatDate(p.endDate)}
                              </TableCell>
                            );
                          case "progress":
                            return (
                              <TableCell key={field.id} className="py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <Progress value={progress} className="h-1.5 w-28" />
                                  <span className="text-xs text-muted-foreground w-8">
                                    {progress}%
                                  </span>
                                </div>
                              </TableCell>
                            );
                          default:
                            return null;
                        }
                      })}

                      {/* Actions */}
                      <TableCell className="py-3.5 pr-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">
            {selected.size} of {filtered.length} row(s) selected.
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground px-2">
              {page + 1} / {Math.max(1, totalPages)}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}