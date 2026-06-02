// components/Goals/EditTargetModal.tsx
"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  X,
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronDown,
  Calendar as CalendarIcon2,
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
import { ProseMirrorEditor } from "@/components/proseMirror/ProseMirrorEditor";

import { useGoalsStore } from "@/stores/goals-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProfileStore } from "@/stores/profile-store";
import { GoalTarget } from "@/types/goal.types";
import { toast } from "sonner";

interface EditTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: GoalTarget | null;
  goalId: string;
}

export function EditTargetModal({ isOpen, onClose, target, goalId }: EditTargetModalProps) {
  const { updateTarget } = useGoalsStore();
  const { currentWorkspace, workspaceMembers, fetchWorkspaceMembers } = useWorkspaceStore();
  const { user } = useProfileStore();

  // Core Form States
  const [label, setLabel] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [description, setDescription] = useState("");
  const [owner, setOwner] = useState<any>(null);

  // UI Interactive States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  // Fetch workspace members if they are not loaded
  useEffect(() => {
    if (isOpen && currentWorkspace?.id) {
      fetchWorkspaceMembers(currentWorkspace.id).catch(console.error);
    }
  }, [isOpen, currentWorkspace?.id, fetchWorkspaceMembers]);

  // Sync state with targets when loaded
  useEffect(() => {
    if (isOpen && target) {
      setLabel(target.label || "");
      setDescription(target.description || "");
      setEndDate(target.endDate ? new Date(target.endDate) : undefined);

      // Find the owner in workspace members
      const assigneeIds = Array.isArray(target.assignedTo) ? target.assignedTo : [target.assignedTo];
      const targetOwnerId = assigneeIds[0] 
        ? (typeof assigneeIds[0] === "string" ? assigneeIds[0] : assigneeIds[0].userId || assigneeIds[0]._id || assigneeIds[0].id)
        : "";

      const matchedOwner = workspaceMembers.find(
        (m: any) => m.userId === targetOwnerId || m.id === targetOwnerId || m._id === targetOwnerId
      );
      setOwner(matchedOwner || null);
    }
  }, [isOpen, target, workspaceMembers]);

  const mentionableMembers = workspaceMembers.map((m: any) => ({
    id: m.userId || m.id || m._id || "",
    name: m.name || "Unknown",
    avatar: m.profilePicture || m.avatar || undefined,
  }));

  const handleSubmit = async () => {
    if (!label.trim()) {
      toast.error("Please enter a Target name");
      return;
    }

    if (!target) return;

    setIsSubmitting(true);
    try {
      const payload = {
        label: label.trim(),
        description: description,
        endDate: endDate ? endDate.toISOString() : undefined,
        assignedTo: owner ? [owner.userId || owner.id || owner._id] : [],
      };

      await updateTarget(goalId, target.id, payload, currentWorkspace?.id);
      toast.success("Target settings updated successfully!");
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update target");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!target) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="sm:max-w-4xl w-full p-0 overflow-hidden bg-white border border-[#E5E7EB] rounded-2xl shadow-xl flex flex-col">
        {/* Header Panel */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
          <div className="flex items-center space-x-3.5">
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h2 className="text-base font-bold text-[#001F3F] tracking-tight truncate max-w-[500px]">
              Edit Target: {target.label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#FAFBFC] space-y-5 max-h-[72vh] scrollbar-thin">
          
          {/* Target Name & Date */}
          <div className="bg-[#F8FAFC] border border-[#F1F5F9] rounded-2xl p-5 shadow-2xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          {/* Description */}
          <div className="border border-[#E5E7EB] border-l-4 border-l-[#001F3F] bg-white rounded-r-2xl rounded-l-none p-5 shadow-2xs">
            <div className="flex flex-col space-y-2.5">
              <label className="text-sm font-semibold text-slate-900 leading-none">
                Target description
              </label>
              
              <div className="border border-[#E2E8F0] rounded-xl overflow-hidden flex flex-col bg-white min-h-[160px] transition-all">
                {isOpen && (
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
                )}
              </div>
            </div>
          </div>

          {/* Owner */}
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
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-white space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-10 text-[13px] font-bold border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 px-5.5 transition-all"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-10 text-[13px] font-bold bg-[#001F3F] text-white hover:bg-[#002e5e] rounded-xl px-6.5 transition-all"
          >
            {isSubmitting ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
