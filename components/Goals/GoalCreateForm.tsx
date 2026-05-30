"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Settings,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronRight,
  ChevronDown,
  Lock,
  Users,
  Network,
  Search,
  X,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ColorIconPicker from "@/components/ColorIconPicker";
import { useRouter } from "next/navigation";
import { useGoalsStore } from "@/stores/goals-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { GoalFormData, GoalFormVisibility } from "@/types/goal.types";

// ==========================================
// Types & Interface Definitions
// ==========================================

const THEME_COLORS = [
  { name: "Indigo", hex: "#6366F1" },
  { name: "Emerald", hex: "#10B981" },
  { name: "Rose", hex: "#F43F5E" },
  { name: "Amber", hex: "#F59E0B" },
  { name: "Sky", hex: "#0EA5E9" },
  { name: "Violet", hex: "#8B5CF6" },
  { name: "Teal", hex: "#14B8A6" },
  { name: "Orange", hex: "#F97316" },
  { name: "Slate", hex: "#64748B" },
  { name: "Crimson", hex: "#DC2626" },
];

type VisibilityType = "private" | "teams" | "workspace";

export function GoalCreateForm({ teamId }: { teamId?: string }) {
  const router = useRouter();

  // Core API store selectors
  const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
  const { createGoal } = useGoalsStore();
  const { user } = useProfileStore();

  // ==========================================
  // Component Interactive States
  // ==========================================
  const [goalName, setGoalName] = useState("");
  const [goalColor, setGoalColor] = useState("#6366F1"); // Default Indigo
  const [goalDate, setGoalDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState<any>(null);
  const [visibility, setVisibility] = useState<VisibilityType>(teamId ? "teams" : "private");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Workspace Visibility Selection States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWorkspaceMembers, setSelectedWorkspaceMembers] = useState<string[]>([]);
  const [showWorkspaceMembersPanel, setShowWorkspaceMembersPanel] = useState(true);

  // Auto-initialize selectedWorkspaceMembers with all loaded members
  React.useEffect(() => {
    if (workspaceMembers.length > 0 && selectedWorkspaceMembers.length === 0) {
      setSelectedWorkspaceMembers(workspaceMembers.map((m) => m.userId));
    }
  }, [workspaceMembers]);

  // Fetch actual workspace members dynamically
  React.useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id]);

  // Default select currently logged-in user as active Goal Owner
  React.useEffect(() => {
    if (user && workspaceMembers.length > 0) {
      const currentUserId = (user as any).id || (user as any)._id;
      const matched = workspaceMembers.find((m) => m.userId === currentUserId);
      if (matched) {
        setOwner(matched);
      } else {
        setOwner(workspaceMembers[0]);
      }
    }
  }, [user, workspaceMembers]);

  // Popover controls
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  // Editor styling states
  const [activeFormats, setActiveFormats] = useState<string[]>([]);
  const [activeAlign, setActiveAlign] = useState<string>("left");
  const [headingText, setHeadingText] = useState("Normal text");

  const getActiveColorName = (hex: string) => {
    const match = THEME_COLORS.find((c) => c.hex.toLowerCase() === hex.toLowerCase());
    if (match) return match.name;

    const pickerColors: Record<string, string> = {
      "#ff3b30": "Red",
      "#ff9500": "Orange",
      "#34c759": "Green",
      "#ffcc00": "Yellow",
      "#00c7be": "Teal",
      "#007aff": "Blue",
      "#5856d6": "Purple",
      "#af52de": "Violet",
      "#ff2d55": "Pink",
      "#001f3f": "Navy",
      "#a2845e": "Brown",
      "transparent": "Transparent",
    };
    return pickerColors[hex.toLowerCase()] || hex;
  };

  // Helper formatting toggles
  const toggleFormat = (format: string) => {
    if (activeFormats.includes(format)) {
      setActiveFormats(activeFormats.filter((f) => f !== format));
    } else {
      setActiveFormats([...activeFormats, format]);
    }
  };

  const isFormatActive = (format: string) => activeFormats.includes(format);

  // Submit to Backend API Store
  const handleSubmit = async () => {
    if (!goalName.trim()) {
      toast.error("Please enter a Goal name.");
      return;
    }

    const workspaceId = currentWorkspace?.id || "";
    if (!workspaceId) {
      toast.error("No active workspace found.");
      return;
    }

    const payload: GoalFormData = {
      title: goalName,
      description: description,
      color: goalColor,
      startDate: goalDate ? format(goalDate, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd"),
      endDate: null,
      owner: owner?.userId || "",
      visibility: (visibility === "private" ? "private" : visibility === "teams" ? "team" : "organization") as GoalFormVisibility,
      assignedTo: owner?.userId ? [owner.userId] : [],
      assignedTeams: teamId ? [teamId] : [],
      icon: null,
    };

    setIsSubmitting(true);
    try {
      await createGoal(payload, workspaceId);
      toast.success("Goal created successfully!", {
        description: `Goal "${goalName}" has been successfully initialized in your workspace.`,
      });
      router.push("/goals");
    } catch (error: any) {
      console.error("Error creating goal:", error);
      toast.error(error.message || "Failed to create goal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    toast.info("Goal creation cancelled.");
    router.push("/goals");
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] py-4 px-4 md:px-6 lg:px-8 border-l border-gray-100 flex flex-col font-sans antialiased">
      <div className="w-full max-w-[1240px] mx-auto flex flex-col space-y-4">
        
        {/* Top Breadcrumb Header */}
        <nav className="flex items-center space-x-1 text-[11px] text-[#94A3B8] font-medium tracking-wide select-none self-start">
          <span className="hover:text-gray-600 cursor-pointer transition-colors">vasu</span>
          <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
          <span className="hover:text-gray-600 cursor-pointer transition-colors">Goals</span>
          <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
          <span className="text-gray-600 font-semibold">Create</span>
        </nav>

        {/* 1. Goal Details Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
            
            {/* Goal Name Field */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2 block">
                Goal name
              </label>
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="e.g. Goal name 1"
                className="flex h-9.5 w-full rounded-lg border border-[#E5E7EB] bg-transparent px-3 py-1 text-[13px] text-gray-800 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gray-400 focus-visible:border-gray-400 transition-all font-medium"
              />
            </div>

            {/* Goal Color Field */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2 block">
                Goal color
              </label>
              <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9.5 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-3 py-1 text-[13px] text-gray-800 hover:bg-gray-50 transition-all focus:outline-none focus:ring-1 focus:ring-gray-400 font-medium"
                  >
                    <div className="flex items-center space-x-2">
                      <span
                        className="h-5 w-5 rounded-full border border-black/10 shadow-sm shrink-0 transition-transform"
                        style={{ backgroundColor: goalColor }}
                      />
                      <span className="text-gray-700 font-medium">{getActiveColorName(goalColor)}</span>
                    </div>
                    <Settings className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-0 border border-[#E5E7EB] bg-white shadow-md rounded-xl z-50 overflow-hidden">
                  <ColorIconPicker
                    isOpen={colorPopoverOpen}
                    onClose={() => setColorPopoverOpen(false)}
                    currentColor={goalColor}
                    onSelect={(iconData) => {
                      setGoalColor(iconData.color);
                      setColorPopoverOpen(false);
                    }}
                    mode="color"
                    isInline={true}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Goal Date Field */}
            <div className="flex flex-col">
              <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider mb-2 block">
                Goal date
              </label>
              <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="flex h-9.5 w-full items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-3 py-1 text-[13px] text-left font-medium focus:outline-none focus:ring-1 focus:ring-gray-400 hover:bg-gray-50 transition-all text-gray-800"
                  >
                    {goalDate ? (
                      <span className="font-semibold text-gray-800">{format(goalDate, "PPP")}</span>
                    ) : (
                      <span className="text-gray-400 font-normal">Set a Goal date</span>
                    )}
                    <CalendarIcon className="h-4 w-4 text-gray-400" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-fit p-0 bg-white border border-[#E5E7EB] shadow-md rounded-xl z-50">
                  <Calendar
                    mode="single"
                    selected={goalDate}
                    onSelect={(date) => {
                      setGoalDate(date);
                      setDatePopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        {/* 2. Goal Description Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs w-full">
          <div className="flex flex-col space-y-2">
            <label className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">
              Goal Description
            </label>

            <div className="border border-[#E5E7EB] rounded-lg overflow-hidden flex flex-col bg-white">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between px-3 py-1 border-b border-gray-100 bg-[#FAFAFA] min-h-[36px]">
                <div className="flex flex-wrap items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => toggleFormat("bold")}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      isFormatActive("bold") ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFormat("italic")}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      isFormatActive("italic") ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFormat("underline")}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      isFormatActive("underline") ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <Underline className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFormat("strike")}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      isFormatActive("strike") ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <Strikethrough className="h-3.5 w-3.5" />
                  </button>

                  <span className="h-4 w-[1px] bg-gray-200 mx-1" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-gray-200/60 text-[11px] text-gray-600 transition-colors focus:outline-none font-medium"
                      >
                        <span>{headingText}</span>
                        <ChevronDown className="h-3 w-3 text-gray-400" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-36 bg-white border border-[#E5E7EB] shadow-md rounded-lg p-1 z-50">
                      <DropdownMenuItem
                        onClick={() => setHeadingText("Normal text")}
                        className="text-xs text-gray-700 py-1.5 px-2 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        Normal text
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setHeadingText("Heading 1")}
                        className="text-xs text-gray-950 font-bold py-1.5 px-2 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        Heading 1
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setHeadingText("Heading 2")}
                        className="text-xs text-gray-950 font-semibold py-1.5 px-2 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        Heading 2
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setHeadingText("Heading 3")}
                        className="text-xs text-gray-950 font-medium py-1.5 px-2 hover:bg-gray-50 cursor-pointer rounded"
                      >
                        Heading 3
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <span className="h-4 w-[1px] bg-gray-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => toggleFormat("bullet")}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      isFormatActive("bullet") ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFormat("number")}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      isFormatActive("number") ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = window.prompt("Enter URL:");
                      if (url) toggleFormat("link");
                    }}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      isFormatActive("link") ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setActiveAlign("left")}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      activeAlign === "left" ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <AlignLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAlign("center")}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      activeAlign === "center" ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <AlignCenter className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAlign("right")}
                    className={`p-1.5 rounded hover:bg-gray-200/60 transition-colors ${
                      activeAlign === "right" ? "bg-gray-200/80 text-gray-900" : "text-gray-500"
                    }`}
                  >
                    <AlignRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your goal in detail..."
                rows={10}
                className={`w-full p-4 text-[13px] text-gray-800 placeholder:text-gray-400 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none min-h-[220px] ${
                  isFormatActive("bold") ? "font-bold" : ""
                } ${isFormatActive("italic") ? "italic" : ""} ${
                  isFormatActive("underline") ? "underline" : ""
                } ${isFormatActive("strike") ? "line-through" : ""} ${
                  activeAlign === "center"
                    ? "text-center"
                    : activeAlign === "right"
                    ? "text-right"
                    : "text-left"
                }`}
              />
            </div>
          </div>
        </div>

        {/* 3. Goal Owner Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-gray-900 leading-tight">Goal owner</h3>
            <p className="text-xs text-gray-400 mt-0.5 font-medium">Select an owner for the goal</p>
          </div>

          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center space-x-3 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:bg-gray-50 transition-all text-left focus:outline-none focus:ring-1 focus:ring-gray-400 min-w-[240px] justify-between shadow-2xs"
                >
                  {owner ? (
                    <div className="flex items-center space-x-2.5">
                      <Avatar className="h-6 w-6">
                        {owner.profilePicture && <AvatarImage src={owner.profilePicture} alt={owner.name} />}
                        <AvatarFallback className="text-[10px] font-bold bg-orange-500 text-white">
                          {owner.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-gray-800 leading-none">{owner.name}</span>
                        <span className="text-[10px] text-gray-400 font-normal leading-none mt-1 truncate max-w-[150px]">
                          {owner.email}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">Loading members...</span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0 ml-2" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[260px] bg-white border border-[#E5E7EB] shadow-md rounded-xl p-1 z-50">
                <div className="text-[9px] font-bold text-[#64748B] uppercase tracking-wider px-2.5 py-1.5">
                  Select team member
                </div>
                {workspaceMembers.map((member) => (
                  <DropdownMenuItem
                    key={member.userId}
                    onClick={() => setOwner(member)}
                    className="flex items-center space-x-2.5 p-2 hover:bg-gray-50 cursor-pointer rounded-lg transition-colors focus:bg-gray-50 focus:text-inherit"
                  >
                    <Avatar className="h-6 w-6">
                      {member.profilePicture && (
                        <AvatarImage src={member.profilePicture} alt={member.name} />
                      )}
                      <AvatarFallback className="text-[10px] font-bold bg-orange-500 text-white">
                        {member.name?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-semibold text-gray-800 leading-none">{member.name}</span>
                      <span className="text-[10px] text-gray-400 font-normal mt-1 leading-none">{member.email}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 4. Goal Visibility Card */}
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 shadow-xs w-full space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 leading-tight">Goal visibility</h3>
              <p className="text-xs text-gray-400 mt-0.5 font-medium">
                Who’s accountable and who can view this goal?
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setVisibility("private")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  visibility === "private"
                    ? "bg-white text-gray-950 border-gray-200 border-b-2 border-b-gray-900 shadow-2xs"
                    : "bg-white text-gray-400 border-gray-200 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Lock className="h-3.5 w-3.5" />
                Private
              </button>
              <button
                type="button"
                onClick={() => setVisibility("teams")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  visibility === "teams"
                    ? "bg-white text-gray-950 border-gray-200 border-b-2 border-b-gray-900 shadow-2xs"
                    : "bg-white text-gray-400 border-gray-200 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                Teams
              </button>
              <button
                type="button"
                onClick={() => {
                  setVisibility("workspace");
                  setShowWorkspaceMembersPanel(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  visibility === "workspace"
                    ? "bg-white text-gray-950 border-gray-200 border-b-2 border-b-gray-900 shadow-2xs"
                    : "bg-white text-gray-400 border-gray-200 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Network className="h-3.5 w-3.5" />
                Workspace
              </button>
            </div>
          </div>

          {visibility !== "workspace" && (
            <div className="bg-[#FFF8F3] border border-[#FFE5D3]/60 rounded-lg p-3.5 flex items-center justify-between transition-all">
              {owner ? (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-7.5 w-7.5 ring-2 ring-orange-100 ring-offset-1">
                    {owner.profilePicture && (
                      <AvatarImage src={owner.profilePicture} alt={owner.name} />
                    )}
                    <AvatarFallback className="bg-orange-500 text-white font-bold text-xs">
                      {owner.name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-gray-800 leading-none">{owner.name}</span>
                    <span className="text-[10px] text-gray-400 font-normal mt-1 leading-none">{owner.email}</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-gray-400">Loading accountability...</span>
              )}

              <span className="text-[9px] font-bold text-orange-600 bg-orange-100/60 border border-orange-200/20 px-2 py-0.5 rounded-md uppercase tracking-wider">
                Owner
              </span>
            </div>
          )}

          {visibility === "workspace" && (
            <div className="flex flex-col md:flex-row justify-between items-start gap-4 pt-1 transition-all">
              <div className="flex flex-col space-y-2 mt-1">
                <span className="text-xs text-gray-500 font-medium">Only visible to</span>
                {selectedWorkspaceMembers.length > 0 && (
                  <div className="flex -space-x-1.5 overflow-hidden py-1">
                    {workspaceMembers
                      .filter((m) => selectedWorkspaceMembers.includes(m.userId))
                      .slice(0, 5)
                      .map((member) => (
                        <Avatar key={member.userId} className="h-6 w-6 border border-white shadow-2xs">
                          {member.profilePicture && (
                            <AvatarImage src={member.profilePicture} alt={member.name} />
                          )}
                          <AvatarFallback className="text-[9px] font-bold bg-orange-500 text-white">
                            {member.name?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    {selectedWorkspaceMembers.length > 5 && (
                      <div className="flex items-center justify-center h-6 w-6 rounded-full border border-white bg-gray-100 text-[9px] font-bold text-gray-500 shadow-2xs select-none">
                        +{selectedWorkspaceMembers.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {showWorkspaceMembersPanel && (
                <div className="w-full md:w-[320px] bg-white border border-[#E5E7EB] rounded-xl shadow-xs p-4 space-y-3 self-end md:self-auto relative animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between pb-1">
                    <span className="text-xs font-semibold text-gray-800">Workspace Members</span>
                    <button
                      type="button"
                      onClick={() => setShowWorkspaceMembersPanel(false)}
                      className="p-1 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-8.5 bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-gray-400 transition-all font-medium"
                    />
                    <Search className="h-3.5 w-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>

                  <div className="max-h-[180px] overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                    {workspaceMembers.filter((m) =>
                      (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (m.email || "").toLowerCase().includes(searchQuery.toLowerCase())
                    ).length > 0 ? (
                      workspaceMembers
                        .filter((m) =>
                          (m.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (m.email || "").toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((member) => {
                          const isChecked = selectedWorkspaceMembers.includes(member.userId);
                          const initials = member.name
                            ? member.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .toUpperCase()
                                .slice(0, 2)
                            : "M";
                          const backgroundColors = [
                            "bg-orange-50 text-orange-600 border border-orange-100",
                            "bg-blue-50 text-blue-600 border border-blue-100",
                            "bg-emerald-50 text-emerald-600 border border-emerald-100",
                            "bg-rose-50 text-rose-600 border border-rose-100",
                            "bg-violet-50 text-violet-600 border border-violet-100",
                          ];
                          const bgClass =
                            backgroundColors[member.userId.charCodeAt(0) % backgroundColors.length] ||
                            "bg-orange-50 text-orange-600 border border-orange-100";

                          return (
                            <div
                              key={member.userId}
                              onClick={() => {
                                setSelectedWorkspaceMembers((prev) =>
                                  prev.includes(member.userId)
                                    ? prev.filter((id) => id !== member.userId)
                                    : [...prev, member.userId]
                                );
                              }}
                              className="flex items-center justify-between p-1 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                            >
                              <div className="flex items-center space-x-2.5">
                                <Avatar className="h-7 w-7">
                                  {member.profilePicture ? (
                                    <AvatarImage src={member.profilePicture} alt={member.name} />
                                  ) : (
                                    <AvatarFallback className={`text-[10px] font-bold ${bgClass}`}>
                                      {initials}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-[12px] font-semibold text-gray-800 leading-none">
                                    {member.name}
                                  </span>
                                  <span className="text-[9px] text-gray-400 font-normal leading-none mt-1 truncate max-w-[150px]">
                                    {member.email}
                                  </span>
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}} // click handler handles it
                                className="h-3.5 w-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer accent-gray-900"
                              />
                            </div>
                          );
                        })
                    ) : (
                      <div className="text-[11px] text-gray-400 text-center py-4">
                        No members found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Footer Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 pb-8 w-full">
          <Button
            type="button"
            onClick={handleCancel}
            className="bg-white hover:bg-gray-50 border border-[#E5E7EB] text-gray-600 hover:text-gray-800 text-xs font-semibold px-4.5 py-2 h-9 rounded-lg transition-all shadow-2xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-gray-950 hover:bg-gray-800 disabled:bg-gray-800 text-white text-xs font-semibold px-5 py-2 h-9 rounded-lg transition-all shadow-sm shrink-0"
          >
            {isSubmitting ? "Creating..." : "Create Goal"}
          </Button>
        </div>

      </div>
    </div>
  );
}
