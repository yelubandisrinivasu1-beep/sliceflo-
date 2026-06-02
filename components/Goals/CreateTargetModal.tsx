"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  X,
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  Hash,
  ToggleLeft,
  DollarSign,
  Briefcase,
  Plus,
  Minus,
  Search,
  Check,
  Folder,
  Loader2
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";

import { useGoalsStore } from "@/stores/goals-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { TARGET_TYPE_COLORS, TargetType } from "@/types/goal.types";
import { toast } from "sonner";

interface CreateTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  goalTitle: string;
}

const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

export function CreateTargetModal({ isOpen, onClose, goalId, goalTitle }: CreateTargetModalProps) {
  // Store actions and data
  const { createTarget } = useGoalsStore();
  const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
  const { user } = useProfileStore();
  const { projects, fetchProjects } = useProjectsStore();
  const { tasks, fetchTasks } = useTasksStore();

  // Core Form States
  const [label, setLabel] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState<any>(null);
  const [targetType, setTargetType] = useState<TargetType>("number");
  
  // Number inputs
  const [numberStart, setNumberStart] = useState<number>(0);
  const [numberEnd, setNumberEnd] = useState<number>(100);

  // Currency inputs
  const [currencyStart, setCurrencyStart] = useState<number>(0);
  const [currencyEnd, setCurrencyEnd] = useState<number>(1000);
  const [currencyUnit, setCurrencyUnit] = useState<string>("INR");

  // Project (tasks) checklist inputs
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  // UI Interactive States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [currencyPopoverOpen, setCurrencyPopoverOpen] = useState(false);

  // Map workspace members to mentionable members for ProseMirrorEditor
  const mentionableMembers = workspaceMembers.map((m: any) => ({
    id: m.userId || m.id || m._id || "",
    name: m.name || "Unknown",
    avatar: m.profilePicture || m.avatar || undefined,
  }));

  // Trigger projects fetch on mount/load
  useEffect(() => {
    if (isOpen) {
      fetchProjects().catch(console.error);
      if (currentWorkspace?.id) {
        fetchWorkspaceMembers(currentWorkspace.id).catch(console.error);
      }
    }
  }, [isOpen, currentWorkspace?.id, fetchProjects, fetchWorkspaceMembers]);

  // Set default owner to logged in user if available
  useEffect(() => {
    if (isOpen && user && workspaceMembers.length > 0) {
      const currentUserId = (user as any).id || (user as any)._id;
      const matched = workspaceMembers.find((m) => m.userId === currentUserId);
      if (matched) {
        setOwner(matched);
      } else {
        setOwner(workspaceMembers[0]);
      }
    }
  }, [isOpen, user, workspaceMembers]);

  // Handle Project Expansion for Task Loading
  const toggleProjectExpand = async (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });

    try {
      await fetchTasks(projectId);
    } catch (err) {
      console.error("Failed to load project tasks:", err);
    }
  };

  const handleToggleTaskSelect = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId);
      } else {
        return [...prev, taskId];
      }
    });
  };

  const handleSelectAllProjectTasks = async (projectId: string, tasksToSelect: any[], selectAll: boolean) => {
    const taskIds = tasksToSelect.map(t => t.id).filter(Boolean);
    setSelectedTaskIds((prev) => {
      if (selectAll) {
        return [...new Set([...prev, ...taskIds])];
      } else {
        return prev.filter(id => !taskIds.includes(id));
      }
    });
  };

  // Submission handler
  const handleSubmit = async () => {
    if (!label.trim()) {
      toast.error("Please enter a Target name");
      return;
    }

    setIsSubmitting(true);
    try {
      let valuePayload: any = null;
      let targetUnit = "";

      if (targetType === "number") {
        valuePayload = {
          start: numberStart,
          end: numberEnd,
          current: numberStart
        };
      } else if (targetType === "currency") {
        valuePayload = {
          start: currencyStart,
          end: currencyEnd,
          current: currencyStart,
          currencyType: currencyUnit
        };
        targetUnit = currencyUnit;
      } else if (targetType === "boolean") {
        valuePayload = false;
      } else if (targetType === "task") {
        valuePayload = {
          start: 0,
          end: selectedTaskIds.length || 1,
          current: 0
        };
      }

      const bodyPayload = {
        label: label.trim(),
        type: targetType,
        description: description,
        unit: targetUnit || undefined,
        value: valuePayload,
        status: "not started" as const,
        linkedTaskIds: targetType === "task" ? selectedTaskIds : [],
        color: TARGET_TYPE_COLORS[targetType] || "#9BB2DC",
        assignedTo: owner ? [owner.userId || owner.id || owner._id] : [],
        startDate: new Date().toISOString(),
        endDate: endDate ? endDate.toISOString() : undefined,
      };

      const result = await createTarget(goalId, bodyPayload, currentWorkspace?.id);
      if (result) {
        toast.success("Target created successfully!");
        onClose();
        // Reset states
        setLabel("");
        setEndDate(undefined);
        setDescription("");
        setTargetType("number");
        setNumberStart(0);
        setNumberEnd(100);
        setCurrencyStart(0);
        setCurrencyEnd(1000);
        setSelectedTaskIds([]);
      } else {
        toast.error("Failed to create target. Please try again.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create target");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = label.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-4xl w-full p-0 overflow-hidden bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col">
        {/* ==========================================
            Header Panel (Sleek and clean exactly like image)
            ========================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center space-x-3.5">
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-bold text-[#001F3F] tracking-tight truncate max-w-[500px]">
              {goalTitle}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* ==========================================
            Main Scrollable Body
            ========================================== */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAFBFC] space-y-5 max-h-[72vh] scrollbar-thin">
          
          {/* 1. Target Name & Date Picker Row Box (Sleek gray background container) */}
          <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-5 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Target name input */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-[#64748B] select-none">
                  Target name
                </label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. Target name 1"
                  className="h-10 bg-white border-[#E2E8F0] hover:border-slate-350 focus:border-[#001F3F] text-[13px] text-slate-800 rounded-xl transition-all"
                />
              </div>

              {/* Target End Date Picker */}
              <div className="flex flex-col space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-[#64748B] select-none">
                  Target End Date
                </label>
                <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 bg-white border-[#E2E8F0] hover:bg-slate-50 text-left text-[13px] text-slate-700 hover:text-slate-900 rounded-xl flex items-center justify-between font-normal shadow-2xs px-3.5 transition-all"
                    >
                      <div className="flex items-center space-x-2">
                        <CalendarIcon className="h-4 w-4 text-slate-400 shrink-0" />
                        <span className={endDate ? "text-slate-800 font-medium" : "text-slate-400"}>
                          {endDate ? format(endDate, "PPP") : "Set a Target Date"}
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="p-0 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-50">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setDatePopoverOpen(false);
                      }}
                      initialFocus
                      className="rounded-2xl border-0 p-3 bg-white text-slate-900"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* 2. Target Description (Thick navy vertical accent bar left side) */}
          <div className="border border-[#E5E7EB] border-l-4 border-l-[#001F3F] bg-white rounded-r-2xl rounded-l-none p-5 shadow-2xs">
            <div className="flex flex-col space-y-2.5">
              <label className="text-sm font-semibold text-slate-900 leading-none">
                Target description
              </label>
              
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col bg-white min-h-[160px] transition-all">
                <ProseMirrorEditor
                  initialContent={description}
                  mentionableMembers={mentionableMembers}
                  placeholder="Add description..."
                  className="w-full h-full min-h-[110px]"
                  editable={true}
                  onBlur={(newDesc: string) => {
                    setDescription(newDesc);
                  }}
                />
              </div>
            </div>
          </div>

          {/* 3. Target Owner (Thick navy vertical accent bar left side) */}
          <div className="border border-[#E5E7EB] border-l-4 border-l-[#001F3F] bg-white rounded-r-2xl rounded-l-none p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-slate-900 leading-tight">Target owner</h3>
              <p className="text-xs text-slate-400 mt-0.5">Select an owner for the target</p>
            </div>

            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center space-x-3 px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-white hover:bg-slate-50 transition-all text-left focus:outline-none min-w-[240px] justify-between shadow-2xs"
                  >
                    {owner ? (
                      <div className="flex items-center space-x-2.5">
                        <Avatar className="h-6.5 w-6.5">
                          {owner.profilePicture && (
                            <AvatarImage src={owner.profilePicture} alt={owner.name} />
                          )}
                          <AvatarFallback className="text-[10px] font-bold bg-[#001F3F] text-white">
                            {owner.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-semibold text-slate-800 leading-none">{owner.name}</span>
                          <span className="text-[10px] text-slate-400 font-normal leading-none mt-1 truncate max-w-[140px]">
                            {owner.email}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-slate-400 text-xs">
                        <div className="w-6.5 h-6.5 rounded-full border border-dashed border-slate-300 flex items-center justify-center">
                          <span className="text-[10px] font-bold">?</span>
                        </div>
                        <span>Select Owner</span>
                      </div>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-2" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[260px] bg-white border border-[#E5E7EB] shadow-lg rounded-2xl p-1.5 z-50">
                  <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider px-2.5 py-2 select-none">
                    Select team member
                  </div>
                  <div className="max-h-[220px] overflow-y-auto">
                    {workspaceMembers.map((member) => (
                      <DropdownMenuItem
                        key={member.userId}
                        onClick={() => setOwner(member)}
                        className="flex items-center space-x-2.5 p-2 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors focus:bg-slate-50 focus:text-inherit"
                      >
                        <Avatar className="h-6.5 w-6.5">
                          {member.profilePicture && (
                            <AvatarImage src={member.profilePicture} alt={member.name} />
                          )}
                          <AvatarFallback className="text-[10px] font-bold bg-[#001F3F] text-white">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-[12.5px] font-semibold text-slate-800 leading-none">{member.name}</span>
                          <span className="text-[9.5px] text-slate-400 font-normal mt-0.5 leading-none">{member.email}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    {workspaceMembers.length === 0 && (
                      <div className="text-xs text-slate-400 italic text-center py-4">No workspace members found</div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 4. Type of Target Panel (Thick navy vertical accent bar left side + Colorful Cards + Dynamic Subpanels) */}
          <div className="border border-[#E5E7EB] border-l-4 border-l-[#001F3F] bg-white rounded-r-2xl rounded-l-none p-5 shadow-2xs space-y-5">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-slate-900 leading-tight font-sans">Type of Target</h3>
              <p className="text-xs text-slate-400 mt-0.5">How do you want to measure this result?</p>
            </div>

            {/* Target Type Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Number */}
              <button
                type="button"
                onClick={() => setTargetType("number")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  targetType === "number"
                    ? "bg-[#EBF3FF] border-[#9BB2DC] shadow-3xs"
                    : "bg-white border-[#E5E7EB] hover:bg-slate-50"
                }`}
              >
                <div className={`p-2 rounded-lg mb-2.5 transition-colors ${
                  targetType === "number" ? "bg-[#9BB2DC]/20 text-[#2F68C4]" : "bg-slate-100 text-slate-400"
                }`}>
                  <Hash className="h-5 w-5" />
                </div>
                <span className={`text-[12.5px] font-bold leading-none ${
                  targetType === "number" ? "text-[#2F68C4]" : "text-slate-800"
                }`}>
                  Number
                </span>
                <span className={`text-[10px] mt-1.5 leading-tight ${
                  targetType === "number" ? "text-[#2F68C4]/80 font-medium" : "text-slate-400"
                }`}>
                  Any Number like 1 or 2
                </span>
              </button>

              {/* Card 2: True / False */}
              <button
                type="button"
                onClick={() => setTargetType("boolean")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  targetType === "boolean"
                    ? "bg-[#FFF4EC] border-[#FF9500] shadow-3xs"
                    : "bg-white border-[#E5E7EB] hover:bg-slate-50"
                }`}
              >
                <div className={`p-2 rounded-lg mb-2.5 transition-colors ${
                  targetType === "boolean" ? "bg-[#FF9500]/15 text-[#D86C00]" : "bg-slate-100 text-slate-400"
                }`}>
                  <ToggleLeft className="h-5 w-5" />
                </div>
                <span className={`text-[12.5px] font-bold leading-none ${
                  targetType === "boolean" ? "text-[#D86C00]" : "text-slate-800"
                }`}>
                  True / False
                </span>
                <span className={`text-[10px] mt-1.5 leading-tight ${
                  targetType === "boolean" ? "text-[#D86C00]/85 font-medium" : "text-slate-400"
                }`}>
                  Done or Not Done
                </span>
              </button>

              {/* Card 3: Currency */}
              <button
                type="button"
                onClick={() => setTargetType("currency")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  targetType === "currency"
                    ? "bg-[#EEFBF0] border-[#34C759] shadow-3xs"
                    : "bg-white border-[#E5E7EB] hover:bg-slate-50"
                }`}
              >
                <div className={`p-2 rounded-lg mb-2.5 transition-colors ${
                  targetType === "currency" ? "bg-[#34C759]/15 text-[#1E8A37]" : "bg-slate-100 text-slate-400"
                }`}>
                  <DollarSign className="h-5 w-5" />
                </div>
                <span className={`text-[12.5px] font-bold leading-none ${
                  targetType === "currency" ? "text-[#1E8A37]" : "text-slate-800"
                }`}>
                  Currency
                </span>
                <span className={`text-[10px] mt-1.5 leading-tight ${
                  targetType === "currency" ? "text-[#1E8A37]/85 font-medium" : "text-slate-400"
                }`}>
                  Show me the Money
                </span>
              </button>

              {/* Card 4: Projects (task) */}
              <button
                type="button"
                onClick={() => setTargetType("task")}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                  targetType === "task"
                    ? "bg-[#FAF5EF] border-[#A2845E] shadow-3xs"
                    : "bg-white border-[#E5E7EB] hover:bg-slate-50"
                }`}
              >
                <div className={`p-2 rounded-lg mb-2.5 transition-colors ${
                  targetType === "task" ? "bg-[#A2845E]/15 text-[#6E5336]" : "bg-slate-100 text-slate-400"
                }`}>
                  <Briefcase className="h-5 w-5" />
                </div>
                <span className={`text-[12.5px] font-bold leading-none ${
                  targetType === "task" ? "text-[#6E5336]" : "text-slate-800"
                }`}>
                  Projects
                </span>
                <span className={`text-[10px] mt-1.5 leading-tight ${
                  targetType === "task" ? "text-[#6E5336]/85 font-medium" : "text-slate-400"
                }`}>
                  Track Completion of Tasks
                </span>
              </button>
            </div>

            {/* Dynamic Type-specific Sub-panels */}
            <div className="pt-2 border-t border-slate-100">
              
              {/* SUBPANEL 1: NUMBER TYPE */}
              {targetType === "number" && (
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Configure Number Parameters
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-150">
                    {/* Start Number value */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                        Starting Number
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNumberStart(prev => Math.max(0, prev - 1))}
                          className="h-9 w-9 bg-white border-[#E2E8F0] hover:bg-slate-100 text-slate-600 rounded-lg shadow-3xs"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <Input
                          type="number"
                          value={numberStart}
                          onChange={(e) => setNumberStart(parseInt(e.target.value) || 0)}
                          className="h-9 text-center bg-white border-[#E2E8F0] text-sm text-slate-800 font-bold rounded-lg focus:border-[#9BB2DC]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNumberStart(prev => prev + 1)}
                          className="h-9 w-9 bg-white border-[#E2E8F0] hover:bg-slate-100 text-slate-600 rounded-lg shadow-3xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Target/End Number value */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                        Target/End Number
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNumberEnd(prev => Math.max(numberStart, prev - 1))}
                          className="h-9 w-9 bg-white border-[#E2E8F0] hover:bg-slate-100 text-slate-600 rounded-lg shadow-3xs"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <Input
                          type="number"
                          value={numberEnd}
                          onChange={(e) => setNumberEnd(parseInt(e.target.value) || 0)}
                          className="h-9 text-center bg-white border-[#E2E8F0] text-sm text-slate-800 font-bold rounded-lg focus:border-[#9BB2DC]"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setNumberEnd(prev => prev + 1)}
                          className="h-9 w-9 bg-white border-[#E2E8F0] hover:bg-slate-100 text-slate-600 rounded-lg shadow-3xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-[11px] font-medium text-slate-400 select-none">
                    Target range: <span className="text-slate-700 font-bold">{numberStart}</span> to{" "}
                    <span className="text-slate-700 font-bold">{numberEnd}</span> (Increment/Decrement steps of 1)
                  </div>
                </div>
              )}

              {/* SUBPANEL 2: CURRENCY TYPE */}
              {targetType === "currency" && (
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Configure Currency Parameters
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
                    {/* Currency Unit Selection */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                        Currency Unit
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="h-9 bg-white border-[#E2E8F0] hover:bg-slate-100 text-[12.5px] text-slate-800 font-bold rounded-lg flex items-center justify-between shadow-3xs"
                          >
                            <span>
                              {CURRENCIES.find(c => c.code === currencyUnit)?.symbol} ({currencyUnit})
                            </span>
                            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1.5 shrink-0" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[180px] bg-white border border-[#E5E7EB] rounded-2xl p-1.5 z-50">
                          {CURRENCIES.map((curr) => (
                            <DropdownMenuItem
                              key={curr.code}
                              onClick={() => setCurrencyUnit(curr.code)}
                              className="text-[12px] p-2 hover:bg-slate-50 rounded-xl font-medium cursor-pointer"
                            >
                              <span className="font-bold text-slate-800 mr-1.5">{curr.symbol}</span>
                              <span className="text-slate-600">{curr.code}</span>
                              <span className="text-slate-400 text-[10px] ml-auto">{curr.name}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Start Currency Value */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                        Starting Value
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-xs font-bold text-slate-400 select-none">
                          {CURRENCIES.find(c => c.code === currencyUnit)?.symbol}
                        </span>
                        <Input
                          type="number"
                          value={currencyStart}
                          onChange={(e) => setCurrencyStart(parseInt(e.target.value) || 0)}
                          className="h-9 pl-6 bg-white border-[#E2E8F0] text-xs font-bold text-slate-800 rounded-lg focus:border-[#34C759]"
                        />
                      </div>
                    </div>

                    {/* End Currency Value */}
                    <div className="flex flex-col space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                        Target/End Value
                      </span>
                      <div className="relative">
                        <span className="absolute left-2.5 top-2.5 text-xs font-bold text-slate-400 select-none">
                          {CURRENCIES.find(c => c.code === currencyUnit)?.symbol}
                        </span>
                        <Input
                          type="number"
                          value={currencyEnd}
                          onChange={(e) => setCurrencyEnd(parseInt(e.target.value) || 0)}
                          className="h-9 pl-6 bg-white border-[#E2E8F0] text-xs font-bold text-slate-800 rounded-lg focus:border-[#34C759]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-slate-400 select-none">
                    Target range: <span className="text-slate-700 font-bold">{CURRENCIES.find(c => c.code === currencyUnit)?.symbol}{currencyStart}</span> to{" "}
                    <span className="text-slate-700 font-bold">{CURRENCIES.find(c => c.code === currencyUnit)?.symbol}{currencyEnd}</span> in{" "}
                    <span className="text-slate-700 font-semibold">{CURRENCIES.find(c => c.code === currencyUnit)?.name}</span>.
                  </div>
                </div>
              )}

              {/* SUBPANEL 3: TRUE / FALSE TYPE */}
              {targetType === "boolean" && (
                <div className="space-y-2 bg-[#FAFCFE] p-4 rounded-xl border border-sky-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700 leading-none">Binary Status Tracking</span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      No numeric configuration needed. Target progress completes when status changes to completed/finished.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 bg-[#FF9500]/10 text-[#FF9500] rounded-md select-none uppercase tracking-wide">
                    TRUE/FALSE
                  </span>
                </div>
              )}

              {/* SUBPANEL 4: PROJECTS / TASKS SELECTOR TYPE */}
              {targetType === "task" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Select Tasks to Link to Target
                    </div>
                    
                    {/* Search Field */}
                    <div className="relative w-48.5">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <Input
                        value={taskSearchQuery}
                        onChange={(e) => setTaskSearchQuery(e.target.value)}
                        placeholder="Search tasks..."
                        className="h-8.5 pl-8 bg-white border-[#E2E8F0] text-xs rounded-lg w-full"
                      />
                    </div>
                  </div>

                  {/* Projects checklist */}
                  <div className="max-h-[300px] overflow-y-auto border border-[#E2E8F0] rounded-xl p-3 bg-[#FCFDFE] space-y-2.5 scrollbar-thin">
                    {projects.map((project) => {
                      const projectTasks = tasks.filter(
                        (t) => t.projectId === project.id && 
                        t.name.toLowerCase().includes(taskSearchQuery.toLowerCase())
                      );
                      const isExpanded = expandedProjects.has(project.id || "");
                      const selectedCount = projectTasks.filter((t) => selectedTaskIds.includes(t.id)).length;
                      
                      const isAllSelected = projectTasks.length > 0 && selectedCount === projectTasks.length;
                      const isPartiallySelected = selectedCount > 0 && !isAllSelected;

                      return (
                        <div key={project.id} className="border border-slate-100 rounded-lg bg-white shadow-3xs overflow-hidden">
                          {/* Project Header Item */}
                          <div className="flex items-center justify-between p-2.5 bg-slate-50/50 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                               onClick={() => toggleProjectExpand(project.id || "")}>
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <ChevronRight className={`h-4 w-4 text-slate-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                              <Folder className="h-4 w-4 text-[#A2845E] shrink-0" />
                              <span className="text-[12.5px] font-semibold text-slate-800 truncate">{project.name}</span>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full select-none shrink-0">
                                {projectTasks.length} tasks
                              </span>
                            </div>
                            
                            {/* Project-level select all checkbox */}
                            {projectTasks.length > 0 && (
                              <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[9.5px] font-bold text-slate-400 select-none uppercase tracking-wide mr-1">
                                  {isAllSelected ? "Deselect" : "Select All"}
                                </span>
                                <Checkbox
                                  checked={isAllSelected}
                                  className="h-4 w-4 data-[state=checked]:bg-[#A2845E] data-[state=checked]:border-[#A2845E]"
                                  ref={(ref) => {
                                    if (ref) {
                                      (ref as any).indeterminate = isPartiallySelected;
                                    }
                                  }}
                                  onCheckedChange={(checked) => {
                                    handleSelectAllProjectTasks(project.id || "", projectTasks, !!checked);
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Project tasks list */}
                          {isExpanded && (
                            <div className="p-2 space-y-1.5 pl-6 bg-white border-t border-slate-50">
                              {projectTasks.map((task) => {
                                const isLinked = selectedTaskIds.includes(task.id);
                                return (
                                  <div
                                    key={task.id}
                                    onClick={() => handleToggleTaskSelect(task.id)}
                                    className="flex items-center justify-between p-1.8 hover:bg-slate-50/70 rounded-lg cursor-pointer transition-colors"
                                  >
                                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                                        task.status === "completed" ? "bg-emerald-500" : "bg-slate-300"
                                      }`} />
                                      <span className="text-xs text-slate-700 truncate">{task.name}</span>
                                    </div>
                                    <Checkbox
                                      checked={isLinked}
                                      className="h-4 w-4 data-[state=checked]:bg-[#A2845E] data-[state=checked]:border-[#A2845E]"
                                      onCheckedChange={() => handleToggleTaskSelect(task.id)}
                                    />
                                  </div>
                                );
                              })}
                              {projectTasks.length === 0 && (
                                <div className="text-[11px] text-slate-450 italic py-2">No tasks available matching search</div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {projects.length === 0 && (
                      <div className="text-xs text-slate-400 italic text-center py-6">No projects found in this workspace</div>
                    )}
                  </div>
                  
                  <div className="text-xs font-semibold text-[#A2845E] select-none flex items-center space-x-1">
                    <Check className="h-3.5 w-3.5 shrink-0" />
                    <span>{selectedTaskIds.length} tasks selected to link to this target.</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==========================================
            Bottom Actions panel (Visuals matched exactly)
            ========================================== */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-white gap-3 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 px-5 bg-white border-[#E2E8F0] hover:bg-slate-50 text-[12.5px] font-semibold text-slate-700 rounded-xl transition-all shadow-3xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`h-9 px-5 text-[12.5px] font-bold rounded-xl transition-all shadow-3xs flex items-center justify-center space-x-1.5 ${
              isFormValid && !isSubmitting
                ? "bg-[#0A172F] hover:bg-[#122342] text-white active:scale-98"
                : "bg-slate-100 text-slate-400 border-0 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1 shrink-0" />
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Target</span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
