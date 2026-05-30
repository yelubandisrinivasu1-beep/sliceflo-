"use client"

import * as React from "react"
import { FileSpreadsheet, FileText, Plus, LayoutGrid, Table2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useProjectsStore } from "@/stores/projects-store"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { useImpler } from "@impler/react"
import { useTasksStore } from "@/stores/tasks-store"
import toast from "react-hot-toast"
import { useCallback } from "react"

interface CreateProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// ─── Spreadsheet Helpers ────────────────────────────────────────────────────
const mapImportedRowToProjectFields = (row: Record<string, any>) => {
  const rawName = row.name || row.Name || row["Project Name"] || row["project"] || `Project-${Date.now()}`;
  return {
    name: rawName,
    description: row.description || row.Description || row["Project Description"] || "",
    status: (row.status || "planning").toLowerCase() as "active" | "planning" | "completed" | "on-hold",
    priority: (row.priority || "medium").toLowerCase(),
    slug: rawName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").slice(0, 50),
    startDate: row.startDate || row["Start Date"] || row.date || row.Date || undefined,
    endDate: row.endDate || row["End Date"] || row.dueDate || row["Due Date"] || undefined,
  };
};

const mapImportedRowToTaskPayload = (row: Record<string, any>, projectId: string) => {
  const title = row.task || row.Task || row["Work Update"] || row["workUpdate"] || row.title || row.Title || "Untitled Task";
  const assignee = row.assignee || row.Assignee || row.employee || row.Employee || row.owner || row.Owner || "";
  const priority = (row.priority || row.Priority || "medium").toLowerCase();
  const status = row.status || row.Status || "todo";
  const startDate = row.startDate || row["Start Date"] || undefined;
  const endDate = row.endDate || row["End Date"] || row.date || row.Date || undefined;
  const description = row.description || row.Description || "";

  // Dynamic custom fields mapping (anything not standard)
  const customFieldValues: Record<string, any> = {};
  for (const [key, val] of Object.entries(row)) {
    if (
      !["task", "work update", "workupdate", "title", "assignee", "employee", "owner", 
        "priority", "status", "start date", "due date", "end date", "date", "description", "name", "project name"].includes(key.toLowerCase())
    ) {
      customFieldValues[key] = val;
    }
  }

  return {
    name: title,
    description,
    projectId,
    assignee,
    status,
    priority,
    startDate,
    endDate,
    customFieldValues,
    attachmentIds: [],
    labelIds: [],
    relationships: [],
    subtasks: [],
    completed: false,
    order: 0,
  };
};

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const { addProject, projects, attachUploadsToProject, updateProjectCustomFieldValue } = useProjectsStore()
  const { addTask } = useTasksStore()
  const router = useRouter()

  const handleCreateEmptyBoard = () => {
    // const newProject = {
    //   id: `project-${Date.now()}`,
    //   name: "New Project",
    //   status: "planning" as const,
    //   description: "A new project",
    //   icon: "📋",
    //   color: "#3B82F6",
    // }
      
    // addProject(newProject)
      onOpenChange(false)
      
    // Navigate to the new project if needed
    router.push(`/project`)
  }

  const importProjectSpreadsheetData = useCallback(async (rows: Record<string, any>[], uploadId: string) => {
    toast.loading("Processing spreadsheet import...", { id: "import-toast" });

    try {
      // Group rows by Project Name
      const projectsToCreate: Record<string, Record<string, any>[]> = {};
      for (const row of rows) {
        const projectName = row["Project Name"] || row["project"] || row["Project"] || "Default Project";
        if (!projectsToCreate[projectName]) {
          projectsToCreate[projectName] = [];
        }
        projectsToCreate[projectName].push(row);
      }

      for (const [projName, projRows] of Object.entries(projectsToCreate)) {
        // Find existing project by name or create a new one
        const existingProject = projects.find(
          p => p.name.toLowerCase() === projName.toLowerCase()
        );

        let activeProjectId = existingProject?.id;

        if (!activeProjectId) {
          const firstRow = projRows[0];
          const projectFields = mapImportedRowToProjectFields(firstRow);
          projectFields.name = projName;
          
          activeProjectId = await addProject(projectFields as any);
        }

        // Attach original uploaded file to this project
        if (activeProjectId && uploadId) {
          try {
            await attachUploadsToProject(activeProjectId, [uploadId]);
          } catch (err) {
            console.error("Failed to attach upload to project:", err);
          }
        }

        // Store project-level custom metadata & structured day-by-day task rows
        for (const row of projRows) {
          // Project custom field mapping if prefixed with proj_ or project_
          for (const [key, val] of Object.entries(row)) {
            if (key.toLowerCase().startsWith("proj_") || key.toLowerCase().startsWith("project_")) {
              const cleanFieldName = key.replace(/^(proj_|project_)/i, "");
              if (activeProjectId) {
                await updateProjectCustomFieldValue(activeProjectId, key, cleanFieldName, val);
              }
            }
          }

          // Create structured day-by-day task/work entries under the project
          if (activeProjectId) {
            const taskPayload = mapImportedRowToTaskPayload(row, activeProjectId);
            await addTask(taskPayload as any);
          }
        }
      }

      toast.success("Spreadsheet data imported successfully!", { id: "import-toast" });
      onOpenChange(false);
    } catch (err: any) {
      console.error("Error during spreadsheet processing:", err);
      toast.error(err.message || "Failed to process imported rows.", { id: "import-toast" });
    }
  }, [projects, addProject, attachUploadsToProject, updateProjectCustomFieldValue, addTask, onOpenChange]);

  const onDataImported = useCallback(async (uploadData: any) => {
    const uploadId = uploadData?._id ?? uploadData?.id;
    const validRecords = uploadData?.validRecords ?? 0;

    if (!uploadId || validRecords === 0) {
      toast.error("No valid records found in the upload!");
      return;
    }

    try {
      const response = await fetch(
        `https://api.impler.io/v1/upload/${uploadId}/rows?limit=1000&page=1`,
        {
          headers: {
            "x-access-token": "08d5c9662f940c967daaa3167630b32d",
          },
        }
      );
      const result = await response.json();
      const rows: Record<string, any>[] = result?.data ?? result?.records ?? result ?? [];
      
      if (!rows.length) {
        toast.error("No import rows could be fetched.");
        return;
      }

      await importProjectSpreadsheetData(rows, uploadId);
    } catch (err) {
      console.error("Impler API row fetch error:", err);
      toast.error("Failed to read imported rows from Impler.");
    }
  }, [importProjectSpreadsheetData]);

  // ── Impler Hook ────────────────────────────────────────────────────────────
  const { showWidget, isImplerInitiated } = useImpler({
    projectId: "69a7d77ce7922340d1c6f217",
    templateId: "69a7d7a5e7922340d1c6f220",
    accessToken: "08d5c9662f940c967daaa3167630b32d",
    onUploadComplete: onDataImported,
    onWidgetClose: () => console.log("Impler widget closed"),
  });

  const handleImportFromSpreadsheet = () => {
    if (isImplerInitiated) {
      showWidget({});
    } else {
      toast.error("Impler importer is initiating. Please try again in a moment.");
    }
  }

  const handleUseTemplates = () => {
    // Implement templates logic
    console.log("Use templates")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl p-8 gap-0 bg-[#f8f9fa] dark:bg-background border-none rounded-[32px] shadow-lg">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-2xl font-bold text-center text-[#0b213e] dark:text-foreground">
            Create a new Project?
          </DialogTitle>
          <p className="text-center text-muted-foreground text-sm font-medium mt-1">
            How would you like to start?
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 px-6 mb-6 mt-2">
          {/* Left Column - Import & Templates Stack */}
          <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[24px] shadow-sm p-4 flex flex-col justify-center gap-4 transition-all duration-300">
            {/* Import from Spreadsheet */}
            <button
              onClick={handleImportFromSpreadsheet}
              className="w-full flex items-center p-4 rounded-[20px] bg-[#f1f3f5] dark:bg-muted/50 hover:bg-gray-200/50 dark:hover:bg-muted transition-all duration-300 cursor-pointer gap-4 text-left outline-none group"
            >
              <div className="w-16 h-16 bg-white dark:bg-background rounded-[16px] flex items-center justify-center shadow-sm shrink-0 border border-gray-50 dark:border-border overflow-hidden">
                <Image
                  alt="spreadsheet"
                  width={48}
                  height={48}
                  src="/images/projects/Spreadsheet.svg"
                  className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-[15px] font-bold text-[#0b213e] dark:text-foreground">
                Import from Spreadsheet
              </span>
            </button>

            {/* Use Templates */}
            <button
              onClick={handleUseTemplates}
              className="w-full flex items-center p-4 rounded-[20px] bg-[#f1f3f5] dark:bg-muted/50 hover:bg-gray-200/50 dark:hover:bg-muted transition-all duration-300 cursor-pointer gap-4 text-left outline-none group"
            >
              <div className="w-16 h-16 bg-white dark:bg-background rounded-[16px] flex items-center justify-center shadow-sm shrink-0 border border-gray-50 dark:border-border overflow-hidden">
                <Image
                  alt="spreadsheet"
                  width={48}
                  height={48}
                  src="/images/projects/Template.svg"
                  className="object-contain p-1 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <span className="text-[15px] font-bold text-[#0b213e] dark:text-foreground">
                Use templates
              </span>
            </button>
          </div>

          {/* Right Column - Create Empty Project */}
          <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-[24px] shadow-sm p-4 flex flex-col justify-center transition-all duration-300">
            <button
              onClick={handleCreateEmptyBoard}
              className="w-full h-full flex flex-col items-center justify-center p-6 rounded-[20px] bg-white dark:bg-card hover:bg-gray-50/50 dark:hover:bg-muted/20 transition-all duration-300 cursor-pointer gap-6 outline-none group"
            >
              <div className="w-28 h-28 rounded-full bg-[#f1f4f9] dark:bg-muted flex items-center justify-center group-hover:scale-105 transition-transform duration-300 relative shadow-inner">
                <LayoutGrid className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                <div className="absolute top-0 right-0 w-8 h-8 bg-white dark:bg-card rounded-full flex items-center justify-center border border-gray-100 dark:border-border shadow-md -mr-1.5 -mt-1.5">
                  <Plus className="w-4 h-4 text-[#0b213e] dark:text-foreground stroke-[3px]" />
                </div>
              </div>
              <span className="text-[15px] font-bold text-[#0b213e] dark:text-foreground">
                Create empty project
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
