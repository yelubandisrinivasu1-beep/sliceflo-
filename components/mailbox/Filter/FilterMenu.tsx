"use client";

import React, { useMemo, useState } from "react";
import Image from "next/image";
import { ListFilter, X } from "lucide-react";
import { ChevronRight } from "lucide-react";

// shadcn/ui components (adjust import paths to match your project)
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import NotificationTypeMenu from "./NotificationTypeMenu";
import Milestone from "./Milestone";
import User from "./User";
import { useProjectsStore } from "@/stores/projects-store";
import { useEmails } from "@/stores/mailbox-store";

interface FilterMenuProps {
    selectedFilters: string[];
    onChange: (filters: string[]) => void;
    iconColor?: string;
}

export default function FilterMenu({
    selectedFilters,
    onChange,
    iconColor = "#8E8E93",
}: FilterMenuProps) {
    const projects = useProjectsStore((state) => state.projects);
    const emails = useEmails();

    // controlled opens for each popover submenu
    const [openNotification, setOpenNotification] = useState(false);
    const [openBoard, setOpenBoard] = useState(false);
    const [openMilestone, setOpenMilestone] = useState(false);
    const [openPriority, setOpenPriority] = useState(false);
    const [openStatus, setOpenStatus] = useState(false);
    const [openUser, setOpenUser] = useState(false);
    const [openFrom, setOpenFrom] = useState(false);
    const [open, setOpen] = useState(false);
    // const [selected, setSelected] = useState<Record<string, boolean>>({});

    const [selected, setSelected] = useState<Record<string, boolean>>({
        Apps: false,
        assignments: false,
        comments: false,
        customer: false,
        document: false,
        mentions: false,
        pulse: false,
        reactions: false,
        reminders: false,
        reviews: false,
        status: false,
        subscriptions: false,
        system: false,
        triage: false,
        updates: false,
    });

    const [search, setSearch] = useState("");

    const toggleFilter = (value: string) => {
        const newFilters = selectedFilters.includes(value)
            ? selectedFilters.filter((f) => f !== value)
            : [...selectedFilters, value];
        onChange(newFilters);
    };

    const selectProject = (projectId: string) => {
        const filterKey = `project:${projectId}`;

        if (isChecked(filterKey)) {
            onChange([]); // deselect → clear everything
        } else {
            // ✅ Clear ALL other filters, keep only this project
            onChange([filterKey]);
        }
    }

    // Collect unique task priorities across all projects (deduplicated by value)
    const allTaskPriorities = useMemo(() => {
        const seen = new Set<string>();
        const result: { value: string; label: string; color: string }[] = [];

        projects.forEach((project) => {
            (project.taskPriorityConfig ?? []).forEach((p) => {
                if (!seen.has(p.value)) {
                    seen.add(p.value);
                    result.push({ value: p.value, label: p.label, color: p.color });
                }
            });
        });

        return result;
    }, [projects]);

    const selectPriority = (priorityValue: string) => {
        const filterKey = `priority:${priorityValue}`;

        if (isChecked(filterKey)) {
            onChange([]); // deselect → clear everything
        } else {
            // ✅ Clear ALL other filters, keep only this priority
            onChange([filterKey]);
        }
    };

    // Collect unique task types across all projects (deduplicated by value)
    const allTaskTypes = useMemo(() => {
        const seen = new Set<string>();
        const result: { value: string; label: string; color: string }[] = [];

        projects.forEach((project) => {
            (project.taskTypeConfig ?? []).forEach((t) => {
                if (!seen.has(t.value)) {
                    seen.add(t.value);
                    result.push({ value: t.value, label: t.label, color: t.color });
                }
            });
        });

        return result;
    }, [projects]);

    const selectTaskType = (typeValue: string) => {
        const filterKey = `taskType:${typeValue}`;

        if (isChecked(filterKey)) {
            onChange([]); // deselect → clear everything
        } else {
            // ✅ Clear ALL other filters, keep only this task type
            onChange([filterKey]);
        }
    };

    // Collect unique task statuses across all projects (deduplicated by value)
    const allTaskStatuses = useMemo(() => {
        const seen = new Set<string>();
        const result: { value: string; label: string; color: string }[] = [];

        projects.forEach((project) => {
            (project.taskStatusConfig ?? []).forEach((s) => {
                if (!seen.has(s.value)) {
                    seen.add(s.value);
                    result.push({ value: s.value, label: s.label, color: s.color });
                }
            });
        });

        return result;
    }, [projects]);

    const selectStatus = (statusValue: string) => {
        const filterKey = `status:${statusValue}`;

        if (isChecked(filterKey)) {
            onChange([]); // deselect → clear everything
        } else {
            // ✅ Clear ALL other filters, keep only this status
            onChange([filterKey]);
        }
    };

    const selectUser = (value: string) => {
        const filterKey = `user:${value}`;
        if (isChecked(filterKey)) {
            onChange([]); // deselect → clear everything
        } else {
            onChange([filterKey]); // ✅ clear all other filters, keep only this
        }
    };

    const allUpdatedByUsers = useMemo(() => {
        const seen = new Set<string>();
        const result: { id: string; name: string; email?: string; profilePictureUrl?: string }[] = [];

        emails.forEach((email) => {
            // Adjust to your actual shape:
            // either email.updatedBy or email.eventData?.updatedBy
            const u = email.eventData?.updatedBy ?? email.updatedBy;

            if (!u?.id) return;

            if (!seen.has(u.id)) {
                seen.add(u.id);
                result.push({
                    id: u.id,
                    name: u.name || u.username || u.email || "Unknown",
                    email: u.email,
                    profilePictureUrl: u.profilePictureUrl,
                });
            }
        });

        return result;
    }, [emails]);

    const selectFrom = (userId: string) => {
        const filterKey = `from:${userId}`;
        if (isChecked(filterKey)) {
            onChange([]); // deselect → clear everything
        } else {
            onChange([filterKey]); // ✅ clear all other filters, keep only this "From" user
        }
    };

    const isChecked = (value: string) => selectedFilters.includes(value);
    const isFilterActive = selectedFilters.length > 0;

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>           
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    title="Filter"
                    className={`relative h-8 w-8 rounded-md transition-all duration-200
                        ${isFilterActive
                            ? "bg-[#001F3F] text-white shadow-sm hover:bg-[#001F3F] hover:text-[#8E8E93]"
                            : "text-[#8E8E93] hover:bg-gray-100"
                        }
                    `}
                >
                    <ListFilter className="h-4 w-4" strokeWidth={2.5} />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                className="w-56 border-0 border-b-[5px] border-[#001F3F] rounded-lg shadow-xl shadow-[#001F3F]/20 mt-0"
                side="bottom"
                align="start"
            >            
                {/* Each item is a Popover trigger; popover opens to the right to mimic MUI nested menu */}
                <div className="flex flex-col">
                    <Popover open={openNotification} onOpenChange={setOpenNotification}>
                        <PopoverTrigger asChild>
                            <button className="flex items-center justify-between px-3 py-2 hover:bg-muted rounded-md">
                                <span className="text-xs font-medium text-[#001F3F] ml-0.5">Notification type</span>
                                <ChevronRight className="h-4 w-4 text-[#001F3F]" />
                            </button>
                        </PopoverTrigger>

                        <PopoverContent side="right" align="start" className="p-0 w-max rounded-lg border-0 border-b-[5px] border-[#001F3F]">
                            <NotificationTypeMenu
                                selected={selected}
                                // onToggle={(key, val) => {
                                //     //Updating local state
                                //     setSelected((prev) => ({
                                //         ...prev,
                                //         [key]: val,
                                //     }));

                                //     //Update selected filter so mailHeader knows something is selected
                                //     const filterName = `notification:${key}`;
                                //     onChange(
                                //         val
                                //             ? [...selectedFilters, filterName] //for adding
                                //             : selectedFilters.filter((f) => f !== filterName) //For removing
                                //     );
                                // }}
                                onToggle={(key, val) => {
                                    setSelected((prev) => ({
                                        ...prev,
                                        [key]: val,
                                    }));

                                    const filterName = `notification:${key}`;

                                    if (val) {
                                        // ✅ Clear ALL other filters (project, priority, status), keep only this notification
                                        const onlyNotifications = selectedFilters.filter((f) =>
                                            f.startsWith("notification:")
                                        );
                                        onChange([...onlyNotifications, filterName]);
                                    } else {
                                        onChange(selectedFilters.filter((f) => f !== filterName));
                                    }
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* Project */}
                    <Popover open={openBoard} onOpenChange={setOpenBoard}>
                        <PopoverTrigger asChild>
                            {/* <button className="w-full flex items-center justify-between px-3 py-2 text-xs rounded hover:bg-muted text-[#001F3F] font-medium"> */}
                            <button
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-none hover:bg-muted font-medium border-l-2 transition-colors ${selectedFilters.some((f) => f.startsWith("project:"))
                                    ? "border-l-[#001F3F] text-[#001F3F] bg-white"  // ✅ active: blue left border
                                    : "border-l-transparent text-[#001F3F]"          // ✅ inactive: no border
                                    }`}
                            >
                                Project
                                <ChevronRight className="h-4 w-4 text-[#001F3F]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="right"
                            align="start"
                            className="w-52 p-2 max-h-64 overflow-y-auto border-0 border-b-4 border-[#001F3F]"
                        >
                            {/* <p className="text-xs font-semibold text-muted-foreground px-2 pb-1">Projects</p> */}
                            {projects.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-2 py-1">No projects found</p>
                            ) : (
                                projects.map((project) => (
                                    <button
                                        key={project.id}
                                        onClick={() => {
                                            // toggleFilter(`project:${project.id}`); //More than one project we can select
                                            selectProject(project.id!);
                                            setOpenBoard(false);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center px-2 py-2 gap-2 text-xs rounded-none hover:bg-muted border-l-2 transition-colors ${isChecked(`project:${project.id}`)
                                            ? "border-l-[#001F3F] bg-white"   // ✅ selected: dark blue left border + subtle bg
                                            : "border-l-transparent"           // ✅ not selected: invisible border (keeps layout stable)
                                            }`}
                                    >
                                        {/* <ProjectAvatar project={project} /> */}
                                        <span className="truncate flex-1 text-left">{project.name}</span>
                                        {isChecked(`project:${project.id}`) && (
                                            // <Check className="h-3.5 w-3.5 text-[#001F3F] shrink-0" />
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="w-5 h-5 rounded-full ml-auto bg-gray-200 hover:bg-red-100 hover:text-red-600 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectProject(project.id!);
                                                }}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </button>
                                ))
                            )}
                        </PopoverContent>
                    </Popover>

                    {/* Task Type */}
                    <Popover open={openMilestone} onOpenChange={setOpenMilestone}>
                        <PopoverTrigger asChild>
                            <button
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-none hover:bg-muted font-medium border-l-2 transition-colors ${selectedFilters.some((f) => f.startsWith("taskType:"))
                                    ? "border-l-[#001F3F] text-[#001F3F] bg-white"
                                    : "border-l-transparent text-[#001F3F]"
                                    }`}
                            >
                                Task type
                                <ChevronRight className="h-4 w-4 text-[#001F3F]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="right"
                            align="start"
                            className="w-52 p-2 max-h-64 overflow-y-auto border-0 border-b-4 border-[#001F3F]"
                        >
                            {allTaskTypes.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-2 py-1">No task types found</p>
                            ) : (
                                allTaskTypes.map((taskType) => (
                                    <button
                                        key={taskType.value}
                                        onClick={() => {
                                            selectTaskType(taskType.value);
                                            setOpenMilestone(false);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center px-2 py-2 gap-2 text-xs rounded-none hover:bg-muted border-l-2 transition-colors ${isChecked(`taskType:${taskType.value}`)
                                            ? "border-l-[#001F3F] bg-white"
                                            : "border-l-transparent"
                                            }`}
                                    >
                                        <span
                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: taskType.color }}
                                        />
                                        <span className="truncate flex-1 text-left">{taskType.label}</span>
                                        {isChecked(`taskType:${taskType.value}`) && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="w-5 h-5 rounded-full ml-auto bg-gray-200 hover:bg-red-100 hover:text-red-600 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectTaskType(taskType.value);
                                                }}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </button>
                                ))
                            )}
                        </PopoverContent>
                    </Popover>

                    {/* Task Priority */}
                    <Popover open={openPriority} onOpenChange={setOpenPriority}>
                        <PopoverTrigger asChild>
                            <button
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-none hover:bg-muted font-medium border-l-2 transition-colors ${selectedFilters.some((f) => f.startsWith("priority:"))
                                    ? "border-l-[#001F3F] text-[#001F3F] bg-white"
                                    : "border-l-transparent text-[#001F3F]"
                                    }`}
                            >
                                Task priority
                                <ChevronRight className="h-4 w-4 text-[#001F3F]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="right"
                            align="start"
                            className="w-52 p-2 max-h-64 overflow-y-auto border-0 border-b-4 border-[#001F3F]"
                        >
                            {allTaskPriorities.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-2 py-1">No priorities found</p>
                            ) : (
                                allTaskPriorities.map((priority) => (
                                    <button
                                        key={priority.value}
                                        onClick={() => {
                                            // toggleFilter(`priority:${priority.value}`);
                                            selectPriority(priority.value); // ✅ replaces toggleFilter
                                            setOpenPriority(false);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center px-2 py-2 gap-2 text-xs rounded-none hover:bg-muted border-l-2 transition-colors ${isChecked(`priority:${priority.value}`)
                                            ? "border-l-[#001F3F] bg-white"
                                            : "border-l-transparent"
                                            }`}
                                    >
                                        {/* Color dot */}
                                        <span
                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: priority.color }}
                                        />
                                        <span className="truncate flex-1 text-left">{priority.label}</span>
                                        {isChecked(`priority:${priority.value}`) && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="w-5 h-5 rounded-full ml-auto bg-gray-200 hover:bg-red-100 hover:text-red-600 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // toggleFilter(`priority:${priority.value}`);
                                                    selectPriority(priority.value); // ✅ replaces toggleFilter
                                                }}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </button>
                                ))
                            )}
                        </PopoverContent>
                    </Popover>

                    {/* Task Status */}
                    <Popover open={openStatus} onOpenChange={setOpenStatus}>
                        <PopoverTrigger asChild>
                            <button
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-none hover:bg-muted font-medium border-l-2 transition-colors ${selectedFilters.some((f) => f.startsWith("status:"))
                                    ? "border-l-[#001F3F] text-[#001F3F] bg-white"
                                    : "border-l-transparent text-[#001F3F]"
                                    }`}
                            >
                                Task status
                                <ChevronRight className="h-4 w-4 text-[#001F3F]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="right"
                            align="start"
                            className="w-52 p-2 max-h-64 overflow-y-auto border-0 border-b-4 border-[#001F3F]"
                        >
                            {allTaskStatuses.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-2 py-1">No statuses found</p>
                            ) : (
                                allTaskStatuses.map((status) => (
                                    <button
                                        key={status.value}
                                        onClick={() => {
                                            selectStatus(status.value);
                                            setOpenStatus(false);
                                            setOpen(false);
                                        }}
                                        className={`w-full flex items-center px-2 py-2 gap-2 text-xs rounded-none hover:bg-muted border-l-2 transition-colors ${isChecked(`status:${status.value}`)
                                            ? "border-l-[#001F3F] bg-white"
                                            : "border-l-transparent"
                                            }`}
                                    >
                                        {/* Color dot */}
                                        <span
                                            className="h-2.5 w-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: status.color }}
                                        />
                                        <span className="truncate flex-1 text-left">{status.label}</span>
                                        {isChecked(`status:${status.value}`) && (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="w-5 h-5 rounded-full ml-auto bg-gray-200 hover:bg-red-100 hover:text-red-600 shrink-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectStatus(status.value);
                                                }}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        )}
                                    </button>
                                ))
                            )}
                        </PopoverContent>
                    </Popover>

                    {/* <DropdownMenuSeparator  /> */}
                    <div className="border-t border-gray-400 w-50 mx-auto" />

                    {/* User */}
                    <Popover open={openUser} onOpenChange={setOpenUser}>
                        <PopoverTrigger asChild>
                            <button
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-none hover:bg-muted font-medium border-l-2 transition-colors ${selectedFilters.some((f) => f.startsWith("user:"))
                                    ? "border-l-[#001F3F] text-[#001F3F] bg-white"  // ✅ active
                                    : "border-l-transparent text-[#001F3F]"          // ✅ inactive
                                    }`}
                            >
                                User
                                <ChevronRight className="h-4 w-4 text-[#001F3F]" />
                            </button>
                        </PopoverTrigger>

                        <PopoverContent side="right" align="start" className="p-0 w-max border-0 border-b-[5px] border-[#001F3F]">
                            <User
                                selectedFilters={selectedFilters}
                                onSelect={(value) => {
                                    selectUser(value);
                                    setOpenUser(false);  // close submenu
                                    setOpen(false);
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    {/* From */}
                    <Popover open={openFrom} onOpenChange={setOpenFrom}>
                        <PopoverTrigger asChild>
                            <button
                                className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-none hover:bg-muted font-medium border-l-2 transition-colors ${selectedFilters.some((f) => f.startsWith("from:"))
                                    ? "border-l-[#001F3F] text-[#001F3F] bg-white"  // ✅ active
                                    : "border-l-transparent text-[#001F3F]"         // ✅ inactive
                                    }`}
                            >
                                From
                                <ChevronRight className="h-4 w-4 text-[#001F3F]" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="right"
                            align="start"
                            className="w-52 p-2 max-h-64 overflow-y-auto border-0 border-b-4 border-[#001F3F]"
                        >
                            {allUpdatedByUsers.length === 0 ? (
                                <p className="text-xs text-muted-foreground px-2 py-1">No senders found</p>
                            ) : (
                                allUpdatedByUsers.map((user) => {
                                    const key = `from:${user.id}`;
                                    return (
                                        <button
                                            key={user.id}
                                            onClick={() => {
                                                selectFrom(user.id);
                                                setOpenFrom(false);
                                                setOpen(false);
                                            }}
                                            className={`w-full flex items-center px-2 py-2 gap-2 text-xs rounded-none hover:bg-muted border-l-2 transition-colors ${isChecked(key)
                                                ? "border-l-[#001F3F] bg-white"
                                                : "border-l-transparent"
                                                }`}
                                        >
                                            {/* ✅ Updated avatar with profile picture */}
                                            {user.profilePictureUrl ? (
                                                <Image
                                                    src={user.profilePictureUrl}
                                                    alt={user.name}
                                                    width={20}
                                                    height={20}
                                                    className="h-5 w-5 rounded-full object-cover shrink-0"
                                                />
                                            ) : (
                                                <span className="h-5 w-5 rounded-full bg-[#001F3F]/10 text-[10px] flex items-center justify-center font-semibold text-[#001F3F]">
                                                    {user.name?.[0]?.toUpperCase() ?? "U"}
                                                </span>
                                            )}

                                            <span className="truncate flex-1 text-left">
                                                {user.name}
                                                {/* {user.email ? (
                                                        <span className="block text-[10px] text-muted-foreground">
                                                            {user.email}
                                                        </span>
                                                    ) : null} */}
                                            </span>

                                            {isChecked(key) && (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="w-5 h-5 rounded-full ml-auto bg-gray-200 hover:bg-red-100 hover:text-red-600 shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        selectFrom(user.id);
                                                    }}
                                                >
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            )}
                                        </button>
                                    );
                                })
                            )}
                        </PopoverContent>
                    </Popover>

                    {/* Clear All Filters */}
                    {selectedFilters.length > 0 && (
                        <button
                            onClick={() => {
                                onChange([]);
                                setSelected(Object.fromEntries(Object.keys(selected).map((k) => [k, false])));
                                setOpen(false);
                            }}
                            className="w-full flex items-center justify-center px-3 py-2 mt-1 rounded-md bg-[#001F3F] hover:bg-[#003366] transition-colors"
                        >
                            <span className="text-xs font-medium text-white">Clear All Filters</span>
                        </button>
                    )}

                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function ProjectAvatar({ project }: { project: any }) {
    // Case 1: File-type icon with a presigned CDN URL
    if (project.icon?.type === "file" && project.icon?.presignedUrl) {
        return (
            <Image
                src={project.icon.presignedUrl}
                alt={project.name}
                width={20}
                height={20}
                className="rounded-sm object-cover shrink-0"
            />
        );
    }

    // Case 2: No icon — fallback to colored circle with first letter
    const bgColor = project.color || "#3B82F6";
    return (
        <span
            className="h-5 w-5 rounded-sm flex items-center justify-center text-white text-[10px] font-bold shrink-0"
            style={{ backgroundColor: bgColor }}
        >
            {project.name?.[0]?.toUpperCase() ?? "P"}
        </span>
    );
}