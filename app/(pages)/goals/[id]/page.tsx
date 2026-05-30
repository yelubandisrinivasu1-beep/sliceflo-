"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ChevronRight,
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
  Star,
  Share2,
  MoreHorizontal,
  Table,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useGoalsStore } from "@/stores/goals-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { format } from "date-fns";

// Define our stepper checklist items exactly as shown in the screenshot
interface SetupStep {
  id: string;
  label: string;
  completed: boolean;
  color: string;
}

export default function GoalDetailPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params?.id as string;

  // Retrieve stores
  const { currentGoal, getGoalById, updateGoal, toggleFavorite } = useGoalsStore();
  const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
  const { user } = useProfileStore();

  // Dynamic States initialized to screenshot placeholders
  const [goalTitle, setGoalTitle] = useState("hjgfjhgfyhj");
  const [description, setDescription] = useState("");
  const [createdDateStr, setCreatedDateStr] = useState("MAY 29, 2026");
  const [endDateStr, setEndDateStr] = useState("NOT SET");
  const [isFavorited, setIsFavorited] = useState(false);

  // Stepper checklist items state
  const [checklist, setChecklist] = useState<SetupStep[]>([
    { id: "name-desc", label: "Goal Name & Description", completed: true, color: "#4ADE80" },
    { id: "owner", label: "Assign Owner", completed: true, color: "#4ADE80" },
    { id: "access", label: "Give Access to Goal", completed: true, color: "#4ADE80" },
    { id: "end-date", label: "Goal End Date", completed: false, color: "#F97316" }, // Orange active
  ]);

  // Fetch workspace members if current workspace is set
  useEffect(() => {
    if (currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id);
    }
  }, [currentWorkspace?.id, fetchWorkspaceMembers]);

  // Sync state with retrieved dynamic Goal API details
  useEffect(() => {
    if (goalId) {
      getGoalById(goalId).then((goal) => {
        if (goal) {
          setGoalTitle(goal.title || goal.name || "hjgfjhgfyhj");
          setDescription(goal.description || "");
          setIsFavorited(!!goal.isFavorite);

          if (goal.createdAt) {
            try {
              setCreatedDateStr(format(new Date(goal.createdAt), "MMMM d, yyyy").toUpperCase());
            } catch (e) {
              setCreatedDateStr("MAY 29, 2026");
            }
          }

          if (goal.endDate) {
            try {
              setEndDateStr(format(new Date(goal.endDate), "PPP").toUpperCase());
            } catch (e) {
              setEndDateStr("NOT SET");
            }
          } else {
            setEndDateStr("NOT SET");
          }

          // Map the actual checklist step completions dynamically
          setChecklist([
            {
              id: "name-desc",
              label: "Goal Name & Description",
              completed: !!(goal.title && goal.description),
              color: "#4ADE80",
            },
            {
              id: "owner",
              label: "Assign Owner",
              completed: !!(goal.owners && goal.owners.length > 0),
              color: "#4ADE80",
            },
            {
              id: "access",
              label: "Give Access to Goal",
              completed: goal.visibility !== "private",
              color: "#4ADE80",
            },
            {
              id: "end-date",
              label: "Goal End Date",
              completed: !!goal.endDate,
              color: "#F97316",
            },
          ]);
        }
      });
    }
  }, [goalId, getGoalById]);

  // Dynamic progress value based on checked steps
  const completedSteps = checklist.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedSteps / checklist.length) * 100);

  // Toggle step handler to update backend API store
  const toggleStep = async (stepId: string) => {
    if (!goalId || !currentGoal) {
      // In static preview mode, just toggle the local state
      const updated = checklist.map((step) => {
        if (step.id === stepId) {
          const nextState = !step.completed;
          toast.success(`"${step.label}" marked as ${nextState ? "Completed" : "Active"}`);
          return { ...step, completed: nextState };
        }
        return step;
      });
      setChecklist(updated);
      return;
    }

    const targetStep = checklist.find((s) => s.id === stepId);
    if (!targetStep) return;

    const nextCompleted = !targetStep.completed;

    // Optimistically update checklist state
    setChecklist((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, completed: nextCompleted } : s))
    );

    try {
      if (stepId === "name-desc") {
        const newDesc = nextCompleted ? (description || "Goal description added.") : "";
        setDescription(newDesc);
        await updateGoal(goalId, { description: newDesc });
        toast.success(nextCompleted ? "Description added!" : "Description cleared!");
      } else if (stepId === "owner") {
        const currentUserId = (user as any)?.id || (user as any)?._id || "";
        const newOwners = nextCompleted ? [currentUserId] : [];
        await updateGoal(goalId, { owners: newOwners });
        toast.success(nextCompleted ? "Owner assigned!" : "Owner removed!");
      } else if (stepId === "access") {
        const newVisibility = nextCompleted ? "organization" : "private";
        await updateGoal(goalId, { visibility: newVisibility });
        toast.success(`Access updated to ${newVisibility}!`);
      } else if (stepId === "end-date") {
        const newEndDate = nextCompleted ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null;
        setEndDateStr(newEndDate ? format(new Date(newEndDate), "PPP").toUpperCase() : "NOT SET");
        await updateGoal(goalId, { endDate: newEndDate });
        toast.success(nextCompleted ? "End date established!" : "End date cleared!");
      }
    } catch (e) {
      console.error("Failed to sync step state:", e);
      toast.error("Failed to update goal on server.");
      // Revert checklist state
      setChecklist((prev) =>
        prev.map((s) => (s.id === stepId ? { ...s, completed: !nextCompleted } : s))
      );
    }
  };

  // Toggle favorite helper
  const handleFavoriteToggle = async () => {
    if (!goalId) {
      setIsFavorited(!isFavorited);
      toast(isFavorited ? "Removed from Favorites" : "Added to Favorites");
      return;
    }
    const nextFav = !isFavorited;
    setIsFavorited(nextFav);
    try {
      await toggleFavorite(goalId, currentWorkspace?.id);
      toast.success(nextFav ? "Added to favorites!" : "Removed from favorites!");
    } catch (error) {
      setIsFavorited(!nextFav);
      toast.error("Failed to toggle favorite.");
    }
  };

  // Resolve dynamic owner profile details
  const activeOwnerId = currentGoal?.owners?.[0] || "";
  const matchedOwner = workspaceMembers.find(
    (m: any) => m.userId === activeOwnerId || m.id === activeOwnerId || m._id === activeOwnerId
  );
  
  const ownerName = matchedOwner?.name || user?.name || "Srinivasu Yelubandi";
  const ownerInitials = ownerName
    ? ownerName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "SY";

  const ownerProfilePic = matchedOwner?.profilePicture || (user as any)?.profilePictureUrl || undefined;

  return (
    <div className="min-h-screen bg-[#FBFDFE] py-6 px-4 md:px-8 font-sans antialiased text-slate-800">
      
      {/* Visual transitions and custom styles */}
      <style jsx global>{`
        .stepper-item-hover:hover {
          transform: translateX(2px);
        }
        .stepper-line {
          width: 2px;
          position: absolute;
          left: 11px; /* Center of the w-5.5 (22px) circles */
          top: 11px;  /* Starts exactly at the center of the first circle */
          bottom: 11px; /* Ends exactly at the center of the last circle */
          background-color: #10B981; /* Matches the solid green vertical line in image */
          z-index: 0;
        }
        .editor-btn:hover {
          background-color: #F1F5F9;
        }
      `}</style>

      <div className="max-w-[1240px] mx-auto flex flex-col space-y-6">
        
        {/* ── BREADCRUMB HEADER (Matches exactly: vasu > Goals > 6a198c6f0be20d22246d50f9) ── */}
        <div className="flex items-center space-x-1.5 text-[11px] text-[#94A3B8] font-semibold tracking-wide select-none self-start">
          <span 
            onClick={() => router.push("/goals")} 
            className="hover:text-slate-600 cursor-pointer transition-colors"
          >
            vasu
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <span 
            onClick={() => router.push("/goals")} 
            className="hover:text-slate-600 cursor-pointer transition-colors"
          >
            Goals
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
          <span className="text-[#1E293B] font-bold">
            {goalId || "6a198c6f0be20d22246d50f9"}
          </span>
        </div>

        {/* ── MAIN GOALS REPORT CARD (Identical to image structure) ── */}
        <div className="bg-white border border-[#E5E7EB] rounded-3xl p-6.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] relative w-full overflow-hidden">
          
          {/* Card Header Label: GOALS REPORT */}
          <div className="absolute top-6.5 left-7.5">
            <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider select-none">
              GOALS REPORT
            </span>
          </div>

          {/* Grid Layout: Using standard grid columns (3 + 6 + 3 = 12) so columns never squish or overflow */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch pt-7">
            
            {/* 1. FIVE-COLOR PROGRESS WHEEL (lg:col-span-3) */}
            <div className="lg:col-span-3 flex flex-col items-center justify-center pt-2">
              
              <div className="relative w-38 h-38 flex items-center justify-center">
                {/* SVG 5-Segment ring matching image color quadrants */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Segment 1: Coral Red (Top-Right) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#EC6262"
                    strokeWidth="10"
                    strokeDasharray="40.75 198.01"
                    transform="rotate(-90 50 50)"
                    strokeLinecap="round"
                  />
                  {/* Segment 2: Gold/Amber (Right/Bottom-Right) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#DFA53C"
                    strokeWidth="10"
                    strokeDasharray="40.75 198.01"
                    transform="rotate(-18 50 50)"
                    strokeLinecap="round"
                  />
                  {/* Segment 3: Pink/Rose (Bottom) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#CF5687"
                    strokeWidth="10"
                    strokeDasharray="40.75 198.01"
                    transform="rotate(54 50 50)"
                    strokeLinecap="round"
                  />
                  {/* Segment 4: Emerald Green (Left) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#52BD8B"
                    strokeWidth="10"
                    strokeDasharray="40.75 198.01"
                    transform="rotate(126 50 50)"
                    strokeLinecap="round"
                  />
                  {/* Segment 5: Slate Navy (Top-Left) */}
                  <circle
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke="#3E4A56"
                    strokeWidth="10"
                    strokeDasharray="40.75 198.01"
                    transform="rotate(198 50 50)"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Percentage read-out in center */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-[#0F172A] tracking-tight font-sans">
                    {progressPercent}%
                  </span>
                </div>
              </div>

            </div>

            {/* 2. GOAL DETAILS & EDITOR BOX (lg:col-span-6) */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
              
              {/* Header Title with Created Date Badge and Social Controls in same row */}
              <div className="flex items-center justify-between w-full">
                
                {/* Title Input + Created Date Badge */}
                <div className="flex items-center space-x-3.5 flex-1 mr-4">
                  <input
                    type="text"
                    value={goalTitle}
                    onChange={(e) => setGoalTitle(e.target.value)}
                    onBlur={async () => {
                      if (goalId && goalTitle.trim() && goalTitle !== currentGoal?.title) {
                        try {
                          await updateGoal(goalId, { title: goalTitle });
                          toast.success("Goal name updated!");
                          setChecklist((prev) =>
                            prev.map((s) => s.id === "name-desc" ? { ...s, completed: !!(goalTitle.trim() && description.trim()) } : s)
                          );
                        } catch {
                          toast.error("Failed to update goal name.");
                          setGoalTitle(currentGoal?.title || "hjgfjhgfyhj");
                        }
                      }
                    }}
                    className="bg-transparent font-bold text-[#1E293B] tracking-tight font-sans border-b border-transparent hover:border-slate-200 focus:border-slate-400 focus:outline-none focus:ring-0 transition-colors w-full text-[17px] p-0"
                  />
                  <span className="text-[9px] font-bold bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0]/40 px-2.5 py-0.5 rounded-full select-none tracking-wide whitespace-nowrap">
                    CREATED {createdDateStr}
                  </span>
                </div>

                {/* Social row controls exactly like image */}
                <div className="flex items-center space-x-2 bg-[#FAFCFD] border border-slate-150 p-0.5 rounded-full shrink-0">
                  <Avatar className="h-6.5 w-6.5 ring-2 ring-slate-100 shrink-0">
                    <AvatarFallback className="text-[10px] font-bold bg-[#0B1B3D] text-white">
                      S
                    </AvatarFallback>
                  </Avatar>

                  <button 
                    onClick={handleFavoriteToggle}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-yellow-500"
                  >
                    <Star className={`h-3.5 w-3.5 ${isFavorited ? "fill-yellow-400 text-yellow-500" : ""}`} />
                  </button>

                  <button className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <Share2 className="h-3.5 w-3.5" />
                  </button>

                  <button className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  </button>
                </div>

              </div>

              {/* Rich text editor box exactly matching style and shadow */}
              <div className="border border-[#E2E8F0] rounded-2xl overflow-hidden flex flex-col bg-white">
                {/* Toolbar matching exact screenshot elements */}
                <div className="flex flex-wrap items-center justify-between px-3.5 py-2 border-b border-slate-100 bg-[#FAFAFA] min-h-[38px] select-none">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Paragraph symbol */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 font-serif font-bold text-xs">
                      ¶
                    </button>
                    {/* Bold */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 hover:text-slate-800">
                      <Bold className="h-3.5 w-3.5" />
                    </button>
                    {/* Italic */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 hover:text-slate-800">
                      <Italic className="h-3.5 w-3.5" />
                    </button>
                    {/* Underline */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 hover:text-slate-800">
                      <Underline className="h-3.5 w-3.5" />
                    </button>
                    {/* Strikethrough */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 hover:text-slate-800">
                      <Strikethrough className="h-3.5 w-3.5" />
                    </button>
                    {/* Highlighter/pen (dropper) */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 hover:text-slate-800 font-semibold text-[10px]">
                      ✎
                    </button>
                    
                    {/* AA 16 text size dropdown */}
                    <button type="button" className="flex items-center space-x-1 px-1.5 py-0.5 rounded editor-btn text-[10.5px] font-bold text-slate-600">
                      <span>AA 16</span>
                      <ChevronRight className="h-3 w-3 rotate-90 text-slate-400" />
                    </button>

                    <span className="h-4 w-[1px] bg-slate-200 mx-0.5" />

                    {/* Unordered list */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 hover:text-slate-800">
                      <List className="h-3.5 w-3.5" />
                    </button>
                    {/* Ordered list */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 hover:text-slate-800">
                      <ListOrdered className="h-3.5 w-3.5" />
                    </button>
                    {/* Grid/Table */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 hover:text-slate-800">
                      <Table className="h-3.5 w-3.5" />
                    </button>
                    {/* Link */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-500 hover:text-slate-800">
                      <LinkIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Left align */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-400 hover:text-slate-700">
                      <AlignLeft className="h-3.5 w-3.5" />
                    </button>
                    {/* Center align */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-400 hover:text-slate-700">
                      <AlignCenter className="h-3.5 w-3.5" />
                    </button>
                    {/* Right align */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-400 hover:text-slate-700">
                      <AlignRight className="h-3.5 w-3.5" />
                    </button>
                    
                    {/* Horizontal line divider */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-400 hover:text-slate-700 font-bold text-xs">
                      —
                    </button>

                    <span className="h-4 w-[1px] bg-slate-200 mx-0.5" />
                    
                    {/* Clock */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-400 hover:text-slate-700">
                      <Clock className="h-3.5 w-3.5" />
                    </button>
                    {/* Mention */}
                    <button type="button" className="p-1 rounded editor-btn text-slate-400 hover:text-slate-700 font-bold text-xs">
                      @
                    </button>
                  </div>
                </div>

                {/* Editor Text Area */}
                <textarea
                  placeholder="Goal Description....."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={async () => {
                    if (goalId && description !== currentGoal?.description) {
                      try {
                        await updateGoal(goalId, { description: description });
                        toast.success("Goal description updated!");
                        setChecklist((prev) =>
                          prev.map((s) => s.id === "name-desc" ? { ...s, completed: !!(goalTitle.trim() && description.trim()) } : s)
                        );
                      } catch {
                        toast.error("Failed to update goal description.");
                        setDescription(currentGoal?.description || "");
                      }
                    }
                  }}
                  className="w-full p-4 text-[13px] text-slate-600 placeholder:text-slate-400 bg-transparent border-0 focus:ring-0 focus:outline-none resize-none min-h-[110px]"
                />
              </div>

              {/* Lower avatars row */}
              <div className="flex items-center justify-between pt-1">
                {/* Overlapping Owner Avatars */}
                <div className="flex items-center">
                  <div className="relative flex items-center h-7.5 w-14">
                    {/* First Avatar: Dynamic Owner (Peach Background) */}
                    <div className="absolute left-0 w-7 h-7 rounded-full bg-[#FFEAE0] border-2 border-white flex items-center justify-center shadow-3xs select-none overflow-hidden">
                      {ownerProfilePic ? (
                        <img src={ownerProfilePic} alt="Owner" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-[#E25A2B]">{ownerInitials}</span>
                      )}
                    </div>
                    {/* Overlapping Sparkle Avatar (Dark Blue) */}
                    <div className="absolute left-4.5 w-7 h-7 rounded-full bg-[#0B1B3D] border-2 border-white flex items-center justify-center shadow-3xs select-none">
                      <Sparkles className="h-3 w-3 text-white fill-white" />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. CORE STEPPER CHECKLIST UL COMPONENT (lg:col-span-3 - Same-to-Same bullets) */}
            <div className="lg:col-span-3 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#F3F4F6] pt-6 lg:pt-0 lg:pl-8">
              
              {/* Stepper container */}
              <div className="relative py-2 flex flex-col h-full justify-between">
                
                <div className="relative">
                  {/* Connecting Stepper Line (Matching solid green line in image) */}
                  <div className="stepper-line" />

                  {/* Unordered list styled exactly same-to-same */}
                  <ul className="relative space-y-7.5 list-none m-0 p-0">
                    {checklist.map((step) => {
                      const isCompleted = step.completed;
                      
                      return (
                        <li
                          key={step.id}
                          onClick={() => toggleStep(step.id)}
                          className="group flex items-center space-x-4 cursor-pointer select-none stepper-item-hover transition-transform duration-300"
                        >
                          {/* Custom Double-Circle Bullet structure matching image */}
                          <div 
                            className={`relative z-10 flex items-center justify-center w-5.5 h-5.5 rounded-full border-2 transition-all duration-300 shrink-0 ${
                              isCompleted 
                                ? "border-[#10B981] bg-white" 
                                : "border-[#F97316] bg-white"
                            }`}
                          >
                            {/* Inner solid center dot */}
                            <div 
                              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                isCompleted 
                                  ? "bg-[#10B981]" 
                                  : "bg-[#F97316]"
                              }`}
                            />
                          </div>

                          {/* List item label text */}
                          <span 
                            className={`text-[12.5px] tracking-wide transition-colors duration-300 ${
                              isCompleted 
                                ? "text-[#64748B] font-medium" 
                                : "text-[#0B1B3D] font-bold"
                            } group-hover:text-slate-900`}
                          >
                            {step.label}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                {/* End Date Pill relocated directly under the checklist as requested */}
                <div className="mt-9 pl-0.5 self-start">
                  <span className="text-[10.5px] font-bold text-[#64748B] bg-white border border-[#E5E7EB] px-5.5 py-1.8 rounded-full uppercase tracking-wider select-none hover:bg-slate-50 cursor-pointer transition-colors shadow-3xs">
                    END DATE: {endDateStr}
                  </span>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ── TARGET ILLUSTRATION SECTION & PRIMARY PILL BUTTON ── */}
        <div className="flex flex-col items-center justify-center py-16 px-4">
          
          {/* Target illustration SVG with horizontal lines exactly matching screenshot */}
          <div className="w-80 h-32 relative mb-8 flex items-center justify-center">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 200 80" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Target Concentric Rings */}
              <circle cx="150" cy="40" r="28" stroke="#D1DBE6" strokeWidth="2.5" />
              <circle cx="150" cy="40" r="19" stroke="#BACCDD" strokeWidth="2.5" />
              <circle cx="150" cy="40" r="10" stroke="#7E9EB8" strokeWidth="3" fill="#ECF4FA" />
              <circle cx="150" cy="40" r="3.5" fill="#4C789E" />
              
              {/* Flying Arrow Connector lines */}
              <line x1="10" y1="30" x2="110" y2="30" stroke="#D1DBE6" strokeWidth="1.5" />
              <line x1="10" y1="50" x2="110" y2="50" stroke="#D1DBE6" strokeWidth="1.5" />
              
              <g className="transform translate-x-2">
                {/* Arrow shaft */}
                <line x1="55" y1="40" x2="142" y2="40" stroke="#4C789E" strokeWidth="2.5" strokeLinecap="round" />
                {/* Arrow head */}
                <path d="M136 36L144 40L136 44" stroke="#4C789E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Arrow fletching / lines */}
                <line x1="62" y1="37" x2="68" y2="40" stroke="#7E9EB8" strokeWidth="2" />
                <line x1="62" y1="43" x2="68" y2="40" stroke="#7E9EB8" strokeWidth="2" />
                <line x1="57" y1="37" x2="63" y2="40" stroke="#7E9EB8" strokeWidth="2" />
                <line x1="57" y1="43" x2="63" y2="40" stroke="#7E9EB8" strokeWidth="2" />
              </g>
            </svg>
          </div>

          {/* Same-to-Same Dark Navy pill button */}
          <Button
            onClick={() => {
              toast.info("Target Creation Started");
            }}
            className="bg-[#0A172F] hover:bg-[#122342] text-white text-[12.5px] font-bold px-7.5 py-5.5 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg active:scale-98 tracking-wide font-sans capitalize"
          >
            Create Target
          </Button>

        </div>

      </div>
    </div>
  );
}
