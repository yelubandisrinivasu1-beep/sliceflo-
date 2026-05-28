"use client"

import { useState, useEffect } from "react";
import {
  Command,
  CommandInput,
  CommandList,
} from "@/components/ui/command";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useProfileStore } from "@/stores/profile-store";
import { ChevronDown, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectTaskPickerProps {
  onSelect: (projectId: string, taskId: string) => void;
}

export default function ProjectTaskPicker({ onSelect }: ProjectTaskPickerProps) {
  const { user } = useProfileStore();
  const { projects } = useProjectsStore();
  const { tasks } = useTasksStore();
  const fetchTasks = useTasksStore(state => state.fetchTasks);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch tasks for all projects on mount
  useEffect(() => {
    projects.forEach(project => {
      if (project.id) fetchTasks(project.id);
    });
  }, [projects, fetchTasks]);

  return (
    <Command className="overflow-hidden">
      {/* <div className="relative">
        <Search
          className="absolute right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8E93] pointer-events-none" />
        <CommandInput
          placeholder="Search"
          className="
            bg-[#F2F2F7]
            rounded-md
            h-10
            pl-3 pr-9
            
            text-sm
            placeholder:text-[#8E8E93]
            focus-visible:ring-2
            focus-visible:ring-[#001F3F]
            [&>svg]:!hidden
            [&>svg:first-child]:!hidden
            [data-slot='input-wrapper']>svg:!hidden
          "
        />
      </div> */}


      {/* <CommandList className="p-2 max-h-[300px] overflow-y-auto overscroll-contain"> */}
      {/* <ScrollArea className="h-[300px]"> */}
      <CommandList className="overflow-hidden">
        <ScrollArea
          className="h-[300px] p-3"
          onWheelCapture={(e) => {
            e.stopPropagation();
          }}
        >

          <Accordion type="single" collapsible className="space-y-2">
            {projects.map((project) => {
              const projectTasks = tasks.filter(t => t.projectId === project.id && (t.assignee === user?.id || (t as any).assigneeId === user?.id));

              return (
                <AccordionItem key={project.id} value={project.id!}>
                  <AccordionTrigger
                    onClick={() => setSelectedProjectId(project.id!)}
                    className="
                      flex items-center justify-between
                      rounded-xl bg-[#F2F2F7] px-4 py-3
                      hover:no-underline
                    "
                  >

                    {/* LEFT */}
                    <div className="flex items-center gap-2 ">
                      <div
                        className={`
                        h-4 w-4 rounded-full border-2 flex items-center justify-center
                        transition-colors
                        ${selectedProjectId === project.id
                            ? "border-primary"
                            : "border-muted-foreground"
                          }
                      `}
                      >
                        {selectedProjectId === project.id && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>

                      <span className="text-base">
                        {project.name}
                      </span>
                    </div>

                  </AccordionTrigger>
                  <AccordionContent className="pl-10 space-y-3 mt-2">
                    <RadioGroup
                      onValueChange={(taskId) => {
                        onSelect(project.id!, taskId);
                      }}
                    >
                      {projectTasks.map((task) => (
                        <label
                          key={task.id}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          {/* HIDDEN RADIO (for accessibility) */}
                          <RadioGroupItem
                            value={task.id}
                            className="sr-only"
                          />

                          {/* CUSTOM CIRCLE */}
                          <div
                            className={`
                              h-4 w-4 rounded-full border-2 flex items-center justify-center
                              transition-colors
                              ${selectedTaskId === task.id
                                ? "border-primary"
                                : "border-muted-foreground"
                              }
                            `}
                          >
                            {selectedTaskId === task.id && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <span className="text-sm text-[#757575]">
                            {task.name}
                          </span>


                        </label>
                      ))}

                    </RadioGroup>
                    {projectTasks.length === 0 && (
                      <div className="text-sm text-muted-foreground italic pl-1">
                        No tasks found
                      </div>
                    )}
                  </AccordionContent>

                </AccordionItem>
              );
            })}
          </Accordion>
        </ScrollArea>
      </CommandList>
    </Command>
  );
}
