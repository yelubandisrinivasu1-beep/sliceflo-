"use client";

import React from "react";
import { LayoutList } from "lucide-react";
import { TaskTable } from "@/components/projects/views/list-view/TaskTable";
import { Task } from "@/types/task.types";
import { useTasksStore } from "@/stores/tasks-store";

interface CyclePriorityTasksProps {
    isEmpty: boolean;
    projectId: string;
    tasks: Task[];
}

export function CyclePriorityTasks({ isEmpty, projectId, tasks }: CyclePriorityTasksProps) {
    const { columnConfigs } = useTasksStore();

    if (isEmpty) {
        return (
            <div className="flex flex-col space-y-2">
                <h3 className="text-sm font-semibold text-gray-900">Priority Tasks</h3>
                <div className="bg-[#F8F9FB] rounded-md p-2 flex flex-col min-h-[240px] border-b-4 border-gray-300 relative overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center text-center mt-4">
                        <div className="w-16 h-16 bg-white rounded-xl shadow-lg flex items-center justify-center mb-4">
                            <LayoutList className="h-8 w-8 text-gray-200" strokeWidth={1.5} />
                        </div>
                        <p className="text-gray-400 text-xs max-w-[280px]">
                            Add or mark tasks as priority to track them here.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Filter for Priority Tasks (e.g., non-low priority)
    const priorityTasks = tasks.filter(t =>
        t.priority?.toLowerCase() !== 'low'
    );

    return (
        <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Priority Tasks</h3>
                <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-full">
                    {priorityTasks.length} tasks
                </span>
            </div>
            <div className="flex-1 overflow-auto max-h-[500px] custom-scrollbar">
                <TaskTable
                    groupId="priority-tasks"
                    projectId={projectId}
                    filteredTasks={priorityTasks}
                    hideFields={[]}
                    columnConfigs={columnConfigs}
                    displayOptions={{
                        collapsedSubtasks: false,
                        closedTasks: false,
                        wrapText: false,
                        subtaskParentId: false
                    }}
                    groupName="Priority Tasks"
                    groupColor="#3B82F6"
                />
            </div>
        </div>
    );
}
