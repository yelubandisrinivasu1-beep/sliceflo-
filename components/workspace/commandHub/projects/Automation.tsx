"use client";

import React, { useState, useEffect, useRef } from "react";
import {
    History,
    ChevronDown,
    ChevronRight,
    Check,
    Sparkles,
    Play,
    Clock,
    ArrowRight,
    Info,
    ArrowLeftCircle,
    MoreHorizontal,
    Loader2,
    Flag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";
import { useAutomationStore } from "@/stores/automation-store";
import { Search, Trash2, ShieldCheck, Zap } from "lucide-react";
import { useProjectsStore } from "@/stores/projects-store";



interface AutomationPageProps {
    projectId?: string;
}

interface Member {
    id: string;
    name: string;
    email: string;
    initials: string;
    color: string;
}

const getInitials = (name?: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
};

const getAvatarColor = (id: string) => {
    const colors = [
        "bg-emerald-500",
        "bg-blue-500",
        "bg-purple-500",
        "bg-pink-500",
        "bg-amber-500",
        "bg-indigo-500",
        "bg-rose-500",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

const mockMembers: Member[] = [
    { id: "1", name: "Sri Nanditha", email: "sri@sliceflo.com", initials: "SN", color: "bg-emerald-500" },
    { id: "2", name: "James Dev", email: "james@sliceflo.com", initials: "JD", color: "bg-blue-500" },
    { id: "3", name: "Alex Rivers", email: "alex@sliceflo.com", initials: "AR", color: "bg-purple-500" },
    { id: "4", name: "Sarah Connor", email: "sarah@sliceflo.com", initials: "SC", color: "bg-pink-500" },
    { id: "5", name: "Emma Watson", email: "emma@sliceflo.com", initials: "EW", color: "bg-amber-500" },
];

const mockPriorities = ["Low", "Medium", "High", "Urgent"];
const mockStatuses = ["To Do", "In Progress", "Review", "Done"];
const mockAssignees = ["Unassigned", "Sri Nanditha", "James Dev", "Alex Rivers", "Sarah Connor"];
const mockDates = ["Today", "Tomorrow", "In 3 Days", "In 1 Week", "In 1 Month"];

const Automation = ({ projectId = "default-project" }: AutomationPageProps) => {
    // --- Core Toggles (Rules) ---
    const [rule1Active, setRule1Active] = useState(true);
    const [rule2Active, setRule2Active] = useState(true);
    const [rule3Active, setRule3Active] = useState(false);
    const [rule4Active, setRule4Active] = useState(false);

    const {
        projects,
        getMembersByProject,
        getTaskStatusConfigs,
        getTaskPriorityConfigs,
        fetchProjectById,
        getTaskCustomFields,
        fetchTaskCustomFields,
        fetchCycles,
    } = useProjectsStore();

    // Fetch project details to load status and priority configurations, custom fields, and cycles
    useEffect(() => {
        if (projectId) {
            fetchProjectById(projectId).catch((err) =>
                console.error("Error loading project details for automations:", err)
            );
            fetchTaskCustomFields(projectId).catch((err) =>
                console.error("Error fetching custom fields for automations:", err)
            );
            fetchCycles(projectId).catch((err) =>
                console.error("Error fetching cycles for automations:", err)
            );
        }
    }, [projectId, fetchProjectById, fetchTaskCustomFields, fetchCycles]);

    const currentProject = React.useMemo(() => {
        return projects.find(p => p.id === projectId);
    }, [projects, projectId]);

    // Map projects members dynamically
    const projectMembers = React.useMemo(() => {
        const members = getMembersByProject(projectId);
        if (!members || members.length === 0) return mockMembers;
        return members.map(m => ({
            id: m.userId,
            name: m.name ?? m.email ?? m.userId,
            email: m.email ?? "",
            initials: getInitials(m.name ?? m.email ?? m.userId),
            color: getAvatarColor(m.userId),
        }));
    }, [projectId, getMembersByProject, projects]);

    // Compute dynamic arrays for priorities, statuses, and assignees
    const dynamicPriorities = React.useMemo(() => {
        const configs = getTaskPriorityConfigs(projectId);
        return configs.length > 0 ? configs.map(c => c.label) : mockPriorities;
    }, [projectId, getTaskPriorityConfigs, projects]);

    const dynamicStatuses = React.useMemo(() => {
        const configs = getTaskStatusConfigs(projectId);
        return configs.length > 0 ? configs.map(c => c.label) : mockStatuses;
    }, [projectId, getTaskStatusConfigs, projects]);

    const dynamicAssignees = React.useMemo(() => {
        return ["Unassigned", ...projectMembers.map(m => m.name)];
    }, [projectMembers]);

    // Compute project custom fields dynamically
    const projectCustomFields = React.useMemo(() => {
        return getTaskCustomFields(projectId);
    }, [projectId, getTaskCustomFields, projects]);

    // --- Rule 1 configuration ---
    const [selectedAssignee, setSelectedAssignee] = useState<Member>(mockMembers[0]);
    const [isAssigneeOpen, setIsAssigneeOpen] = useState(false);

    // --- Rule 2 configuration ---
    const [triggerTask, setTriggerTask] = useState(true);
    const [triggerSubtask, setTriggerSubtask] = useState(false);
    const [isFieldsOpen, setIsFieldsOpen] = useState(false);
    const [fieldsState, setFieldsState] = useState<Record<string, { checked: boolean; value: string; open: boolean }>>({
        Priority: { checked: false, value: "Medium", open: false },
        Status: { checked: false, value: "To Do", open: false },
        Assignee: { checked: false, value: "Sri Nanditha", open: false },
        Date: { checked: false, value: "Today", open: false },
    });

    // --- Rule 3 configuration ---
    const [inactivePeriod, setInactivePeriod] = useState("1 month");
    const [customMonths, setCustomMonths] = useState("3");
    const [isInactiveOpen, setIsInactiveOpen] = useState(false);
    const [isCustomMode, setIsCustomMode] = useState(false);

    // --- Rule 4 configuration ---
    const [rule4Status, setRule4Status] = useState("Done");
    const [isRule4StatusOpen, setIsRule4StatusOpen] = useState(false);

    // --- UI Auxiliary States ---
    const [showHistory, setShowHistory] = useState(false);

    const assigneeRef = useRef<HTMLDivElement>(null);
    const fieldsRef = useRef<HTMLDivElement>(null);
    const inactiveRef = useRef<HTMLDivElement>(null);
    const rule4Ref = useRef<HTMLDivElement>(null);

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (assigneeRef.current && !assigneeRef.current.contains(event.target as Node)) {
                setIsAssigneeOpen(false);
            }
            if (fieldsRef.current && !fieldsRef.current.contains(event.target as Node)) {
                setIsFieldsOpen(false);
            }
            if (inactiveRef.current && !inactiveRef.current.contains(event.target as Node)) {
                setIsInactiveOpen(false);
            }
            if (rule4Ref.current && !rule4Ref.current.contains(event.target as Node)) {
                setIsRule4StatusOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // --- Store Integration ---
    const { projectRuleSettings, updateProjectRuleSettings, runs, addRun, deleteRun } = useAutomationStore();
    const [searchQuery, setSearchQuery] = useState("");

    // Baseline mock runs if empty
    useEffect(() => {
        const currentRuns = useAutomationStore.getState().runs;
        if (currentRuns.length === 0) {
            addRun({
                automationId: "rule-1",
                automationName: "Assign Creator",
                description: "Automatically assigned Sri Nanditha to task 'Design Command Hub'",
                status: "success",
                timestamp: new Date(Date.now() - 120000).toISOString(),
            });
            addRun({
                automationId: "rule-2",
                automationName: "Auto-fill Fields",
                description: "Pre-filled Priority 'Medium' for task 'Review labels'",
                status: "success",
                timestamp: new Date(Date.now() - 3600000).toISOString(),
            });
            addRun({
                automationId: "rule-3",
                automationName: "Auto-close",
                description: "Closed task 'Onboarding Docs' due to 1 month inactivity",
                status: "success",
                timestamp: new Date(Date.now() - 86400000).toISOString(),
            });
        }
    }, [addRun]);

    // Keep track of which projectId we have initialized
    const [lastInitializedId, setLastInitializedId] = useState<string | null>(null);

    // On mount or when projects load, load settings from store into local state
    useEffect(() => {
        if (lastInitializedId === projectId && currentProject) {
            return;
        }

        const saved = projectRuleSettings[projectId];
        if (saved) {
            setRule1Active(saved.rule1Active);
            const savedMember = projectMembers.find(m => m.id === saved.rule1AssigneeId);
            if (savedMember) setSelectedAssignee(savedMember);
            setRule2Active(saved.rule2Active);
            setTriggerTask(saved.rule2Triggers.task);
            setTriggerSubtask(saved.rule2Triggers.subtask);
            
            // Merge saved fields with custom fields
            const loadedFields = { ...saved.rule2Fields } as any;
            projectCustomFields.forEach(cf => {
                if (!loadedFields[cf.name]) {
                    const defaultValue = cf.options && cf.options.length > 0
                        ? (typeof cf.options[0] === 'string' ? cf.options[0] : (cf.options[0] as any).value)
                        : "Select Option";
                    loadedFields[cf.name] = { checked: false, value: defaultValue, open: false };
                }
            });
            setFieldsState(loadedFields);

            setRule3Active(saved.rule3Active);
            setInactivePeriod(saved.rule3Period);
            setCustomMonths(saved.rule3CustomMonths);
            setIsCustomMode(saved.rule3CustomMode);
            setRule4Active(saved.rule4Active);
            if ((saved as any).rule4Status) {
                setRule4Status((saved as any).rule4Status);
            } else {
                const defaultDoneStatus = dynamicStatuses.includes("Done") ? "Done" : (dynamicStatuses[dynamicStatuses.length - 1] || "Done");
                setRule4Status(defaultDoneStatus);
            }
            setLastInitializedId(projectId);
        } else if (currentProject) {
            // Reset to defaults using loaded project data
            setRule1Active(true);
            setRule2Active(true);
            setTriggerTask(true);
            setTriggerSubtask(false);
            setRule3Active(false);
            setRule4Active(false);

            if (projectMembers.length > 0) {
                setSelectedAssignee(projectMembers[0]);
            }

            const defaultPriority = dynamicPriorities.includes("Medium") ? "Medium" : (dynamicPriorities[0] || "Medium");
            const defaultStatus = dynamicStatuses.includes("To Do") ? "To Do" : (dynamicStatuses[0] || "To Do");
            const defaultAssignee = projectMembers.length > 0 ? projectMembers[0].name : "Sri Nanditha";

            const initialFields: Record<string, { checked: boolean; value: string; open: boolean }> = {
                Priority: { checked: false, value: defaultPriority, open: false },
                Status: { checked: false, value: defaultStatus, open: false },
                Assignee: { checked: false, value: defaultAssignee, open: false },
                Date: { checked: false, value: "Today", open: false },
            };

            projectCustomFields.forEach(cf => {
                const defaultValue = cf.options && cf.options.length > 0
                    ? (typeof cf.options[0] === 'string' ? cf.options[0] : (cf.options[0] as any).value)
                    : "Select Option";
                initialFields[cf.name] = { checked: false, value: defaultValue, open: false };
            });

            setFieldsState(initialFields);

            const defaultDoneStatus = dynamicStatuses.includes("Done") ? "Done" : (dynamicStatuses[dynamicStatuses.length - 1] || "Done");
            setRule4Status(defaultDoneStatus);
            setLastInitializedId(projectId);
        }
    }, [projectId, currentProject, projectMembers, dynamicPriorities, dynamicStatuses, projectRuleSettings, lastInitializedId, projectCustomFields]);

    // Automatically synchronize local changes back to the store
    useEffect(() => {
        if (lastInitializedId === projectId) {
            updateProjectRuleSettings(projectId, {
                rule1Active,
                rule1AssigneeId: selectedAssignee.id,
                rule2Active,
                rule2Triggers: { task: triggerTask, subtask: triggerSubtask },
                rule2Fields: fieldsState,
                rule3Active,
                rule3Period: inactivePeriod,
                rule3CustomMonths: customMonths,
                rule3CustomMode: isCustomMode,
                rule4Active,
                rule4Status,
            });
        }
    }, [
        projectId,
        rule1Active,
        selectedAssignee,
        rule2Active,
        triggerTask,
        triggerSubtask,
        fieldsState,
        rule3Active,
        inactivePeriod,
        customMonths,
        isCustomMode,
        rule4Active,
        rule4Status,
        lastInitializedId,
        updateProjectRuleSettings,
    ]);

    const handleClearLogs = () => {
        runs.forEach(r => deleteRun(r.id));
        toast("success", { title: "Activity logs cleared" });
    };

    const triggerHistoryRun = () => {
        addRun({
            automationId: "simulation",
            automationName: "Simulation Run",
            description: "Processed all pending automated rules for workspace changes",
            status: "success",
            timestamp: new Date().toISOString(),
        });
        toast("success", { title: "Automation simulation executed!" });
    };

    const filteredLogs = runs.filter(log => {
        const query = searchQuery.toLowerCase();
        const actionStr = log.automationName || "";
        const detailStr = log.description || "";
        return actionStr.toLowerCase().includes(query) || detailStr.toLowerCase().includes(query);
    });

    const handleToggleRule = (ruleId: number, active: boolean) => {
        toast("info", { title: `Automation Rule #${ruleId} ${active ? "enabled" : "disabled"}` });
    };

    const handleFieldChecked = (fieldName: string) => {
        setFieldsState(prev => {
            const newState = { ...prev };
            const wasChecked = newState[fieldName]?.checked ?? false;
            
            // Close all others
            Object.keys(newState).forEach(k => {
                if (newState[k]) {
                    newState[k] = { ...newState[k], open: false };
                }
            });

            // Toggle checked, and if it becomes checked, automatically open it!
            if (newState[fieldName]) {
                newState[fieldName] = {
                    ...newState[fieldName],
                    checked: !wasChecked,
                    open: !wasChecked
                };
            }
            return newState;
        });
    };

    const handleFieldValueChange = (fieldName: string, val: string) => {
        setFieldsState(prev => {
            if (!prev[fieldName]) return prev;
            return {
                ...prev,
                [fieldName]: { ...prev[fieldName], value: val, open: false }
            };
        });
        toast("success", { title: `${fieldName} auto-fill value set to: ${val}` });
    };

    const handleToggleFieldSelectOpen = (fieldName: string) => {
        setFieldsState(prev => {
            const newState = { ...prev };
            const wasOpen = newState[fieldName]?.open ?? false;

            // Close all others
            Object.keys(newState).forEach(k => {
                if (k !== fieldName && newState[k]) {
                    newState[k] = { ...newState[k], open: false };
                }
            });

            // Toggle current
            if (newState[fieldName]) {
                newState[fieldName] = {
                    ...newState[fieldName],
                    open: !wasOpen
                };
            }
            return newState;
        });
    };


    if (showHistory) {
        return (
            <div className="w-full max-w-4xl mx-auto space-y-6 py-6 px-4 select-none">
                {/* --- Run History Header Area --- */}
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-5">
                    <div>
                        <h1 className="text-[22px] font-bold text-[#001F3F] dark:text-white tracking-tight">
                            Run history
                        </h1>
                        <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                            Subtext
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filter Button */}
                        <button className="p-2.5 bg-[#F1F3F6] dark:bg-slate-800/60 rounded-md text-[#555] dark:text-slate-300 hover:bg-[#E2E6EA] dark:hover:bg-slate-700/80 transition-colors flex items-center justify-center cursor-pointer border border-transparent">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="4" y1="21" x2="4" y2="14" />
                                <line x1="4" y1="10" x2="4" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="12" />
                                <line x1="12" y1="8" x2="12" y2="3" />
                                <line x1="20" y1="21" x2="20" y2="16" />
                                <line x1="20" y1="10" x2="20" y2="3" />
                                <line x1="1" y1="14" x2="7" y2="14" />
                                <line x1="9" y1="8" x2="15" y2="8" />
                                <line x1="17" y1="16" x2="23" y2="16" />
                            </svg>
                        </button>

                        {/* Go back to Automations peach button */}
                        <button
                            onClick={() => setShowHistory(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-[#FFF3E5] hover:bg-[#FFEAD8] dark:bg-[#E04F16]/10 text-[#E04F16] dark:text-[#FFA07A] rounded-lg text-[13px] font-bold transition-all cursor-pointer shadow-xs border border-[#FFF3E5] dark:border-transparent"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="14 8 10 12 14 16" />
                                <line x1="10" y1="12" x2="16" y2="12" />
                            </svg>
                            <span>Go back to Automations</span>
                        </button>
                    </div>
                </div>

                {/* History Runs List */}
                <div className="space-y-4">
                    {[
                        { id: 1, date: "Jul 30,2025 | 11:21 AM", rule: "When an item is created set Due date to", status: "success" },
                        { id: 2, date: "Jul 30,2025 | 11:21 AM", rule: "When an item is created set Due date to", status: "success" },
                        { id: 3, date: "Jul 30,2025 | 11:21 AM", rule: "When an item is created set Due date to", status: "success" },
                        { id: 4, date: "Jul 30,2025 | 11:21 AM", rule: "When an item is created set Due date to", status: "failed" },
                        { id: 5, date: "Jul 30,2025 | 11:21 AM", rule: "When an item is created set Due date to", status: "failed" },
                    ].map((run) => (
                        <div
                            key={run.id}
                            className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xs hover:shadow-sm transition-all flex items-center justify-between p-4 ${run.status === "success"
                                ? "border-l-[6px] border-l-[#28C76F]"
                                : "border-l-[6px] border-l-[#EA5455]"
                                }`}
                        >
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                {/* Status Icon Badge */}
                                {run.status === "success" ? (
                                    <div className="w-8 h-8 rounded-full bg-[#E8F8EE] dark:bg-emerald-500/10 border border-[#B3F1C9] dark:border-emerald-800/40 text-[#28C76F] dark:text-[#28C76F] flex items-center justify-center flex-shrink-0 shadow-xs">
                                        <svg className="w-4.5 h-4.5 stroke-[3.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#FCE2E2] dark:bg-rose-500/10 border border-[#F8B3B3] dark:border-rose-800/40 text-[#EA5455] dark:text-[#EA5455] flex items-center justify-center flex-shrink-0 shadow-xs">
                                        <svg className="w-4.5 h-4.5 stroke-[3.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                )}

                                {/* Date Timestamp */}
                                <span className="text-[12.5px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap pl-1">
                                    {run.date}
                                </span>

                                {/* Rule Title with exact styled bolding */}
                                <p className="text-[13.5px] text-slate-800 dark:text-slate-200 leading-normal truncate pl-4">
                                    When an item is created set <span className="font-semibold text-slate-900 dark:text-white">Due date</span> to
                                </p>
                            </div>

                            {/* Options Dots Button */}
                            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-md cursor-pointer flex-shrink-0">
                                <MoreHorizontal className="w-5 h-5 stroke-[2.2]" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full  space-y-6 py-6 px-4 select-none">
            {/* --- Top Header Area --- */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800/80 pb-5">
                <div>
                    <h1 className="text-[22px] font-bold text-[#001F3F] dark:text-white flex items-center gap-2 tracking-tight">
                        Automations
                        <Sparkles className="w-4 h-4 text-orange-500 animate-pulse" />
                    </h1>
                    <p className="text-[12px] text-gray-500 dark:text-slate-400 mt-1 font-medium">
                        Configure automated rules to streamline operations, task assignments, status tracking, and work processes.
                    </p>
                </div>

                {/* Peach History Icon */}
                <div className="flex items-center gap-2">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowHistory(!showHistory)}
                        className={`p-2.5 rounded-xl flex items-center justify-center transition-all ${showHistory
                            ? "bg-[#FFEAD8] text-[#E04F16] dark:bg-[#E04F16]/20 dark:text-[#FFA07A] shadow-inner"
                            : "bg-[#FFF4ED] text-[#E04F16] hover:bg-[#FFEAD8] dark:bg-[#E04F16]/10 dark:text-[#FFA07A] dark:hover:bg-[#E04F16]/20"
                            }`}
                        title="View Automation Logs"
                    >
                        <History className="w-5 h-5 stroke-[2.2]" />
                    </motion.button>
                </div>
            </div>

            {/* --- Major Automation Cards --- */}
            <div className="w-full space-y-4">

                {/* Rule 1 Card */}
                <motion.div
                    layout
                    className={`bg-white dark:bg-slate-900 border ${rule1Active ? "border-[#001F3F]/35 dark:border-indigo-500/30 shadow-[0_4px_16px_rgba(0,31,63,0.03)]" : "border-slate-200/80 dark:border-slate-800/60"
                        } rounded-xl p-5 hover:shadow-md transition-all duration-300`}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                            <h3 className="text-[14.5px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                                When task is created assign creator as person
                            </h3>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                                Automatically assigns the task creator as the assignee whenever a new task is created.
                            </p>
                        </div>
                        <Switch
                            checked={rule1Active}
                            onCheckedChange={(val) => {
                                setRule1Active(val);
                                handleToggleRule(1, val);
                            }}
                            className="data-[state=checked]:bg-[#001F3F] dark:data-[state=checked]:bg-indigo-600"
                        />
                    </div>

                    {/* Rule 1 Expanded Details */}
                    <AnimatePresence initial={false}>
                        {rule1Active && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0, overflow: "hidden" }}
                                animate={{
                                    height: "auto",
                                    opacity: 1,
                                    marginTop: 16,
                                    transitionEnd: { overflow: "visible" }
                                }}
                                exit={{ height: 0, opacity: 0, marginTop: 0, overflow: "hidden" }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                <div className="bg-[#F8F9FC] dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <span className="text-[12.5px] text-slate-600 dark:text-slate-300 font-medium">
                                        Select the default assignee for newly created tasks.
                                    </span>

                                    {/* Member Dropdown Trigger */}
                                    <div className="relative" ref={assigneeRef}>
                                        <button
                                            onClick={() => setIsAssigneeOpen(!isAssigneeOpen)}
                                            className="flex items-center justify-between gap-2.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12.5px] text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 w-full sm:w-[170px] shadow-sm transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`w-5 h-5 rounded-full ${selectedAssignee.color} text-white flex items-center justify-center text-[9px] font-bold shadow-sm`}>
                                                    {selectedAssignee.initials}
                                                </span>
                                                <span className="truncate font-medium">{selectedAssignee.name}</span>
                                            </div>
                                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAssigneeOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        {/* Dropdown Menu */}
                                        <AnimatePresence>
                                            {isAssigneeOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="absolute right-0 mt-1.5 w-[210px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1.5 overflow-hidden"
                                                >
                                                    <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                        Workspace Members
                                                    </div>
                                                    <div className="max-h-[180px] overflow-y-auto space-y-0.5">
                                                        {projectMembers.map((member) => (
                                                            <button
                                                                key={member.id}
                                                                onClick={() => {
                                                                    setSelectedAssignee(member);
                                                                    setIsAssigneeOpen(false);
                                                                    toast("success", { title: `Assigned ${member.name} as default assignee` });
                                                                }}
                                                                className="w-full text-left flex items-center justify-between px-2 py-1.5 rounded-lg text-[12.5px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-5 h-5 rounded-full ${member.color} text-white flex items-center justify-center text-[9px] font-bold shadow-sm`}>
                                                                        {member.initials}
                                                                    </span>
                                                                    <div>
                                                                        <p className="font-medium truncate">{member.name}</p>
                                                                        <p className="text-[10px] text-slate-400 truncate -mt-0.5">{member.email}</p>
                                                                    </div>
                                                                </div>
                                                                {selectedAssignee.id === member.id && (
                                                                    <Check className="w-3.5 h-3.5 text-emerald-500 stroke-[3]" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Rule 2 Card */}
                <motion.div
                    layout
                    className={`bg-white dark:bg-slate-900 border ${rule2Active ? "border-[#001F3F]/35 dark:border-indigo-500/30 shadow-[0_4px_16px_rgba(0,31,63,0.03)]" : "border-slate-200/80 dark:border-slate-800/60"
                        } rounded-xl p-5 hover:shadow-md transition-all duration-300`}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                            <h3 className="text-[14.5px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                                Automatically fill fields on task/sub task creation
                            </h3>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                                Pre-fill selected fields like priority, status, due date, or assignee when a task or subtask is created.
                            </p>
                        </div>
                        <Switch
                            checked={rule2Active}
                            onCheckedChange={(val) => {
                                setRule2Active(val);
                                handleToggleRule(2, val);
                            }}
                            className="data-[state=checked]:bg-[#001F3F] dark:data-[state=checked]:bg-indigo-600"
                        />
                    </div>

                    {/* Rule 2 Expanded Details */}
                    <AnimatePresence initial={false}>
                        {rule2Active && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0, overflow: "hidden" }}
                                animate={{
                                    height: "auto",
                                    opacity: 1,
                                    marginTop: 16,
                                    transitionEnd: { overflow: "visible" }
                                }}
                                exit={{ height: 0, opacity: 0, marginTop: 0, overflow: "hidden" }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                <div className="bg-[#F8F9FC] dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-xl p-5 space-y-4">

                                    {/* Trigger Checkboxes */}
                                    <div className="space-y-2.5">
                                        <p className="text-[12.5px] font-semibold text-slate-700 dark:text-slate-300">
                                            This automation triggers when:
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <label className="flex items-center gap-2.5 text-[12.5px] text-slate-600 dark:text-slate-400 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={triggerTask}
                                                    onChange={(e) => setTriggerTask(e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 dark:bg-slate-900 cursor-pointer"
                                                />
                                                <span className="font-medium">A new task is created</span>
                                            </label>

                                            <label className="flex items-center gap-2.5 text-[12.5px] text-slate-600 dark:text-slate-400 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={triggerSubtask}
                                                    onChange={(e) => setTriggerSubtask(e.target.checked)}
                                                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 dark:bg-slate-900 cursor-pointer"
                                                />
                                                <span className="font-medium">A new sub task is created</span>
                                            </label>
                                        </div>
                                    </div>

                                    <hr className="border-slate-100 dark:border-slate-800/50" />

                                    {/* Field selector trigger */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <span className="text-[12.5px] text-slate-600 dark:text-slate-300 font-medium">
                                            Select fields to auto-fill:
                                        </span>

                                        {/* Fields Popover Trigger */}
                                        <div className="relative" ref={fieldsRef}>
                                            <button
                                                onClick={() => setIsFieldsOpen(!isFieldsOpen)}
                                                className="flex items-center justify-between gap-2.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12.5px] text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 w-full sm:w-[170px] shadow-sm transition-all"
                                            >
                                                <span className="font-medium text-slate-600 dark:text-slate-400">Select fields</span>
                                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isFieldsOpen ? "rotate-180" : ""}`} />
                                            </button>

                                            {/* Dropdown Menu / Field selection Panel */}
                                            <AnimatePresence>
                                                {isFieldsOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="absolute right-0 mt-1.5 w-[280px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-30 p-3 space-y-3"
                                                    >
                                                        <div className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-1.5">
                                                            Select fields to auto-fill
                                                        </div>
                                                        <div className="space-y-2.5">
                                                            {Object.entries(fieldsState)
                                                                .sort(([keyA], [keyB]) => {
                                                                    const systemFieldsOrder = ["Priority", "Status", "Assignee", "Date"];
                                                                    const idxA = systemFieldsOrder.indexOf(keyA);
                                                                    const idxB = systemFieldsOrder.indexOf(keyB);
                                                                    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                                                                    if (idxA !== -1) return -1;
                                                                    if (idxB !== -1) return 1;
                                                                    return keyA.localeCompare(keyB);
                                                                })
                                                                .map(([key, f]) => {
                                                                    const name = key;
                                                                return (
                                                                    <div key={key} className="flex items-center justify-between gap-4">
                                                                        <label className="flex items-center gap-2 text-[12.5px] text-slate-700 dark:text-slate-300 cursor-pointer flex-1">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={f.checked}
                                                                                onChange={() => handleFieldChecked(name)}
                                                                                className="w-4 h-4 rounded border-slate-300 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 dark:bg-slate-900 cursor-pointer"
                                                                            />
                                                                            <span className="font-semibold">{key}</span>
                                                                        </label>

                                                                        {/* Mini drop selector next to each checkbox */}
                                                                        <div className="relative">
                                                                            <button
                                                                                type="button"
                                                                                disabled={!f.checked}
                                                                                onClick={() => handleToggleFieldSelectOpen(name)}
                                                                                className={`flex items-center justify-between gap-1.5 px-2 py-1 border rounded-md text-[11px] w-[90px] text-left transition-all ${f.checked
                                                                                    ? "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300"
                                                                                    : "bg-slate-50/40 dark:bg-slate-950/40 border-slate-100 dark:border-slate-900 text-slate-400 cursor-not-allowed opacity-50"
                                                                                    }`}
                                                                            >
                                                                                <span className="truncate font-medium">{f.value}</span>
                                                                                <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                                            </button>

                                                                            {/* Nested Dropdown */}
                                                                            <AnimatePresence>
                                                                                {f.open && f.checked && (
                                                                                    <motion.div
                                                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                                        exit={{ opacity: 0, scale: 0.95 }}
                                                                                        className="absolute right-0 mt-1 w-[160px] max-h-[220px] overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-40 p-1 space-y-0.5 scrollbar-thin"
                                                                                    >
                                                                                        {name === "Priority" && (
                                                                                            getTaskPriorityConfigs(projectId).length > 0 ? (
                                                                                                getTaskPriorityConfigs(projectId).map(p => (
                                                                                                    <button
                                                                                                        key={p._id}
                                                                                                        onClick={() => handleFieldValueChange("Priority", p.label)}
                                                                                                        className="w-full text-left px-2 py-1.5 rounded text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/85 transition-colors font-medium flex items-center justify-between"
                                                                                                    >
                                                                                                        <span className="flex items-center gap-1.5 min-w-0">
                                                                                                            <Flag className="w-3 h-3 flex-shrink-0" style={{ color: p.color || '#9CA3AF' }} />
                                                                                                            <span className="truncate">{p.label}</span>
                                                                                                        </span>
                                                                                                        {f.value === p.label && <Check className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                                                                                                    </button>
                                                                                                ))
                                                                                            ) : (
                                                                                                mockPriorities.map(option => (
                                                                                                    <button
                                                                                                        key={option}
                                                                                                        onClick={() => handleFieldValueChange("Priority", option)}
                                                                                                        className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium flex items-center justify-between"
                                                                                                    >
                                                                                                        <span className="flex items-center gap-1.5">
                                                                                                            <Flag className="w-3 h-3 text-slate-400" />
                                                                                                            <span>{option}</span>
                                                                                                        </span>
                                                                                                        {f.value === option && <Check className="w-3 h-3 text-indigo-500" />}
                                                                                                    </button>
                                                                                                ))
                                                                                            )
                                                                                        )}

                                                                                        {name === "Status" && (
                                                                                            getTaskStatusConfigs(projectId).length > 0 ? (
                                                                                                getTaskStatusConfigs(projectId).map(s => (
                                                                                                    <button
                                                                                                        key={s._id}
                                                                                                        onClick={() => handleFieldValueChange("Status", s.label)}
                                                                                                        className="w-full text-left px-2 py-1.5 rounded text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/85 transition-colors font-medium flex items-center justify-between"
                                                                                                    >
                                                                                                        <span className="flex items-center gap-1.5 min-w-0">
                                                                                                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || '#9CA3AF' }} />
                                                                                                            <span className="truncate">{s.label}</span>
                                                                                                        </span>
                                                                                                        {f.value === s.label && <Check className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                                                                                                    </button>
                                                                                                ))
                                                                                            ) : (
                                                                                                mockStatuses.map(option => (
                                                                                                    <button
                                                                                                        key={option}
                                                                                                        onClick={() => handleFieldValueChange("Status", option)}
                                                                                                        className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium flex items-center justify-between"
                                                                                                    >
                                                                                                        <span className="flex items-center gap-1.5">
                                                                                                            <span className="w-2 h-2 rounded-full bg-slate-400" />
                                                                                                            <span>{option}</span>
                                                                                                        </span>
                                                                                                        {f.value === option && <Check className="w-3 h-3 text-indigo-500" />}
                                                                                                    </button>
                                                                                                ))
                                                                                            )
                                                                                        )}

                                                                                        {name === "Assignee" && (
                                                                                            projectMembers.map(m => (
                                                                                                <button
                                                                                                    key={m.id}
                                                                                                    onClick={() => handleFieldValueChange("Assignee", m.name)}
                                                                                                    className="w-full text-left px-2 py-1.5 rounded text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/85 transition-colors font-medium flex items-center justify-between"
                                                                                                >
                                                                                                    <span className="flex items-center gap-2 min-w-0">
                                                                                                        <span className={`w-4 h-4 rounded-full ${m.color} text-white flex items-center justify-center text-[7px] font-bold shadow-xs`}>
                                                                                                            {m.initials}
                                                                                                        </span>
                                                                                                        <span className="truncate">{m.name}</span>
                                                                                                    </span>
                                                                                                    {f.value === m.name && <Check className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                                                                                                </button>
                                                                                            ))
                                                                                        )}

                                                                                        {name === "Date" && (
                                                                                            mockDates.map(option => (
                                                                                                <button
                                                                                                    key={option}
                                                                                                    onClick={() => handleFieldValueChange("Date", option)}
                                                                                                    className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium flex items-center justify-between"
                                                                                                >
                                                                                                    <span>{option}</span>
                                                                                                    {f.value === option && <Check className="w-3 h-3 text-indigo-500" />}
                                                                                                </button>
                                                                                            ))
                                                                                        )}

                                                                                        {/* Custom Field Fallback Options Renderer */}
                                                                                        {(() => {
                                                                                            // 1. Check if name is "cycle" (case-insensitive and robust matching)
                                                                                            if (name.trim().toLowerCase().includes("cycle")) {
                                                                                                const cyclesList = currentProject?.cycles || [];
                                                                                                return cyclesList.length > 0 ? (
                                                                                                    cyclesList.map(c => (
                                                                                                        <button
                                                                                                            key={c.id}
                                                                                                            onClick={() => handleFieldValueChange(name, c.name)}
                                                                                                            className="w-full text-left px-2 py-1.5 rounded text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/85 transition-colors font-medium flex items-center justify-between"
                                                                                                        >
                                                                                                            <span className="truncate">{c.name}</span>
                                                                                                            {f.value === c.name && <Check className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                                                                                                        </button>
                                                                                                    ))
                                                                                                ) : (
                                                                                                    <div className="px-2 py-1.5 text-[10px] text-slate-400 italic">No cycles available</div>
                                                                                                );
                                                                                            }

                                                                                            const customField = projectCustomFields.find(cf => cf.name === name);
                                                                                            if (!customField) return null;

                                                                                            // 2. Handle people custom fields
                                                                                            if (customField.type === "people") {
                                                                                                return projectMembers.length > 0 ? (
                                                                                                    projectMembers.map(m => (
                                                                                                        <button
                                                                                                            key={m.id}
                                                                                                            onClick={() => handleFieldValueChange(name, m.name)}
                                                                                                            className="w-full text-left px-2 py-1.5 rounded text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/85 transition-colors font-medium flex items-center justify-between"
                                                                                                        >
                                                                                                            <span className="flex items-center gap-2 min-w-0">
                                                                                                                <span className={`w-4 h-4 rounded-full ${m.color} text-white flex items-center justify-center text-[7px] font-bold shadow-xs`}>
                                                                                                                    {m.initials}
                                                                                                                </span>
                                                                                                                <span className="truncate">{m.name}</span>
                                                                                                            </span>
                                                                                                            {f.value === m.name && <Check className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                                                                                                        </button>
                                                                                                    ))
                                                                                                ) : (
                                                                                                    <div className="px-2 py-1.5 text-[10px] text-slate-400 italic">No members available</div>
                                                                                                );
                                                                                            }

                                                                                            // 3. Handle date custom fields
                                                                                            if (customField.type === "date") {
                                                                                                return mockDates.map(option => (
                                                                                                    <button
                                                                                                        key={option}
                                                                                                        onClick={() => handleFieldValueChange(name, option)}
                                                                                                        className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium flex items-center justify-between"
                                                                                                    >
                                                                                                        <span>{option}</span>
                                                                                                        {f.value === option && <Check className="w-3 h-3 text-indigo-500" />}
                                                                                                    </button>
                                                                                                ));
                                                                                            }

                                                                                            // 4. Handle checkbox custom fields
                                                                                            if (customField.type === "checkbox") {
                                                                                                return ["Checked", "Unchecked"].map(option => (
                                                                                                    <button
                                                                                                        key={option}
                                                                                                        onClick={() => handleFieldValueChange(name, option)}
                                                                                                        className="w-full text-left px-2 py-1 rounded text-[11px] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium flex items-center justify-between"
                                                                                                    >
                                                                                                        <span>{option}</span>
                                                                                                        {f.value === option && <Check className="w-3 h-3 text-indigo-500" />}
                                                                                                    </button>
                                                                                                ));
                                                                                            }

                                                                                            // 5. Handle text/number input custom fields
                                                                                            if (["text", "textarea", "number", "website", "email", "phone"].includes(customField.type)) {
                                                                                                return (
                                                                                                    <div className="p-2 space-y-1.5 select-text" onClick={(e) => e.stopPropagation()}>
                                                                                                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Set Default Value</label>
                                                                                                        <input
                                                                                                            type={customField.type === "number" ? "number" : "text"}
                                                                                                            value={f.value === "Select Option" || f.value === "N/A" || f.value === "None" ? "" : f.value}
                                                                                                            onChange={(e) => handleFieldValueChange(name, e.target.value)}
                                                                                                            className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-md text-xs focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                                                                                                            placeholder="Type default value..."
                                                                                                        />
                                                                                                    </div>
                                                                                                );
                                                                                            }

                                                                                            // 6. Handle standard multi/single select fields
                                                                                            return customField.options && customField.options.length > 0 ? (
                                                                                                customField.options.map(opt => {
                                                                                                    const label = typeof opt === 'string' ? opt : opt.value;
                                                                                                    const color = typeof opt === 'string' ? undefined : opt.color;
                                                                                                    return (
                                                                                                        <button
                                                                                                            key={label}
                                                                                                            onClick={() => handleFieldValueChange(name, label)}
                                                                                                            className="w-full text-left px-2 py-1.5 rounded text-[11px] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/85 transition-colors font-medium flex items-center justify-between"
                                                                                                        >
                                                                                                            <span className="flex items-center gap-1.5 min-w-0">
                                                                                                                {color && (
                                                                                                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                                                                                                                )}
                                                                                                                <span className="truncate">{label}</span>
                                                                                                            </span>
                                                                                                            {f.value === label && <Check className="w-3 h-3 text-indigo-500 flex-shrink-0" />}
                                                                                                        </button>
                                                                                                    );
                                                                                                })
                                                                                            ) : (
                                                                                                <div className="px-2 py-1.5 text-[10px] text-slate-400 italic">No options defined</div>
                                                                                            );
                                                                                        })()}
                                                                                    </motion.div>
                                                                                )}
                                                                            </AnimatePresence>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Rule 3 Card */}
                <motion.div
                    layout
                    className={`bg-white dark:bg-slate-900 border ${rule3Active ? "border-[#001F3F]/35 dark:border-indigo-500/30 shadow-[0_4px_16px_rgba(0,31,63,0.03)]" : "border-slate-200/80 dark:border-slate-800/60"
                        } rounded-xl p-5 hover:shadow-md transition-all duration-300`}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                            <h3 className="text-[14.5px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                                Auto-close tasks that are inactive
                            </h3>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                                Automatically close tasks or work items that remain inactive for a specified period of time.
                            </p>
                        </div>
                        <Switch
                            checked={rule3Active}
                            onCheckedChange={(val) => {
                                setRule3Active(val);
                                handleToggleRule(3, val);
                                handleToggleRule(3, val);
                            }}
                            className="data-[state=checked]:bg-[#001F3F] dark:data-[state=checked]:bg-indigo-600"
                        />
                    </div>

                    {/* Rule 3 Expanded Details */}
                    <AnimatePresence initial={false}>
                        {rule3Active && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0, overflow: "hidden" }}
                                animate={{
                                    height: "auto",
                                    opacity: 1,
                                    marginTop: 16,
                                    transitionEnd: { overflow: "visible" }
                                }}
                                exit={{ height: 0, opacity: 0, marginTop: 0, overflow: "hidden" }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                <div className="bg-[#F8F9FC] dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-xl p-4 space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <span className="text-[12.5px] text-slate-600 dark:text-slate-300 font-medium">
                                            Auto-close tasks that are inactive for
                                        </span>

                                        {/* Inactive Duration Dropdown Trigger */}
                                        <div className="relative" ref={inactiveRef}>
                                            <button
                                                onClick={() => setIsInactiveOpen(!isInactiveOpen)}
                                                className="flex items-center justify-between gap-2.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12.5px] text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 w-full sm:w-[170px] shadow-sm transition-all"
                                            >
                                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                    {isCustomMode ? `${customMonths} months` : inactivePeriod}
                                                </span>
                                                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isInactiveOpen ? "rotate-180" : ""}`} />
                                            </button>

                                            {/* Inactive Popover Dropdown Selection */}
                                            <AnimatePresence>
                                                {isInactiveOpen && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 5 }}
                                                        className="absolute right-0 mt-1.5 w-[210px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1.5 space-y-1"
                                                    >
                                                        <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                                            Select inactive range
                                                        </div>
                                                        <div className="space-y-0.5">
                                                            {["1 month", "3 months", "6 months", "9 months", "12 months"].map((p) => (
                                                                <button
                                                                    key={p}
                                                                    onClick={() => {
                                                                        setInactivePeriod(p);
                                                                        setIsCustomMode(false);
                                                                        setIsInactiveOpen(false);
                                                                        toast("success", { title: `Inactivity threshold set to ${p}` });
                                                                    }}
                                                                    className="w-full text-left px-2 py-1.5 rounded-lg text-[12.5px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium flex items-center justify-between"
                                                                >
                                                                    <span>{p}</span>
                                                                    {inactivePeriod === p && !isCustomMode && (
                                                                        <Check className="w-3.5 h-3.5 text-indigo-500" />
                                                                    )}
                                                                </button>
                                                            ))}

                                                            <hr className="border-slate-100 dark:border-slate-800/50 my-1" />

                                                            {/* Custom range triggers sub-menu / inputs */}
                                                            <button
                                                                onClick={() => {
                                                                    setIsCustomMode(true);
                                                                    setIsInactiveOpen(false);
                                                                }}
                                                                className="w-full text-left px-2 py-1.5 rounded-lg text-[12.5px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-semibold flex items-center justify-between"
                                                            >
                                                                <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                                                    Custom range
                                                                </span>
                                                                <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Custom Range Sub-Form Input */}
                                    <AnimatePresence>
                                        {isCustomMode && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center justify-between gap-3 shadow-inner"
                                            >
                                                <div className="flex items-center gap-2 flex-1">
                                                    <span className="text-[12px] font-semibold text-slate-400">custom range:</span>
                                                    <div className="relative flex-1 max-w-[130px]">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            max="120"
                                                            value={customMonths}
                                                            onChange={(e) => setCustomMonths(e.target.value)}
                                                            className="w-full pl-3 pr-14 py-1 border border-slate-200 dark:border-slate-800 rounded-md text-[12px] font-semibold text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-950 focus:border-indigo-500 focus:outline-none"
                                                        />
                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 uppercase">
                                                            months
                                                        </span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        setIsCustomMode(false);
                                                        setInactivePeriod("1 month");
                                                        toast("info", { title: "Switched to default inactivity threshold" });
                                                    }}
                                                    className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                                >
                                                    Reset to standard
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Rule 4 Card */}
                <motion.div
                    layout
                    className={`bg-white dark:bg-slate-900 border ${rule4Active ? "border-[#001F3F]/35 dark:border-indigo-500/30 shadow-[0_4px_16px_rgba(0,31,63,0.03)]" : "border-slate-200/80 dark:border-slate-800/60"
                        } rounded-xl p-5 hover:shadow-md transition-all duration-300`}
                >
                    <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1 flex-1">
                            <h3 className="text-[14.5px] font-semibold text-slate-800 dark:text-slate-200 tracking-tight leading-tight">
                                Set Due date is today, when status is <span className="text-indigo-600 dark:text-indigo-400 font-bold">{rule4Status}</span> for task/sub task
                            </h3>
                            <p className="text-[11.5px] text-slate-500 dark:text-slate-400 font-normal leading-relaxed">
                                Automatically updates the due date to today when a task status is marked as {rule4Status}.
                            </p>
                        </div>
                        <Switch
                            checked={rule4Active}
                            onCheckedChange={(val) => {
                                setRule4Active(val);
                                handleToggleRule(4, val);
                            }}
                            className="data-[state=checked]:bg-[#001F3F] dark:data-[state=checked]:bg-indigo-600"
                        />
                    </div>

                    {/* Rule 4 Expanded Details */}
                    <AnimatePresence initial={false}>
                        {rule4Active && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, marginTop: 0, overflow: "hidden" }}
                                animate={{
                                    height: "auto",
                                    opacity: 1,
                                    marginTop: 16,
                                    transitionEnd: { overflow: "visible" }
                                }}
                                exit={{ height: 0, opacity: 0, marginTop: 0, overflow: "hidden" }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                                <div className="bg-[#F8F9FC] dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <span className="text-[12.5px] text-slate-600 dark:text-slate-300 font-medium">
                                        Trigger when task status is set to:
                                    </span>

                                    {/* Status Config Dropdown */}
                                    <div className="relative" ref={rule4Ref}>
                                        <button
                                            onClick={() => setIsRule4StatusOpen(!isRule4StatusOpen)}
                                            className="flex items-center justify-between gap-2.5 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-[12.5px] text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 w-full sm:w-[170px] shadow-sm transition-all"
                                        >
                                            <span className="font-semibold text-slate-700 dark:text-slate-300">{rule4Status}</span>
                                            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isRule4StatusOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        <AnimatePresence>
                                            {isRule4StatusOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 5 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 5 }}
                                                    className="absolute right-0 mt-1.5 w-[180px] max-h-[220px] overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-1.5 space-y-0.5 scrollbar-thin"
                                                >
                                                    {getTaskStatusConfigs(projectId).length > 0 ? (
                                                        getTaskStatusConfigs(projectId).map(s => (
                                                            <button
                                                                key={s._id}
                                                                onClick={() => {
                                                                    setRule4Status(s.label);
                                                                    setIsRule4StatusOpen(false);
                                                                    toast("success", { title: `Rule 4 trigger status set to ${s.label}` });
                                                                }}
                                                                className="w-full text-left px-2 py-1.5 rounded-lg text-[12.5px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium flex items-center justify-between"
                                                            >
                                                                <span className="flex items-center gap-1.5 min-w-0">
                                                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color || '#9CA3AF' }} />
                                                                    <span className="truncate">{s.label}</span>
                                                                </span>
                                                                {rule4Status === s.label && <Check className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        mockStatuses.map(option => (
                                                            <button
                                                                key={option}
                                                                onClick={() => {
                                                                    setRule4Status(option);
                                                                    setIsRule4StatusOpen(false);
                                                                    toast("success", { title: `Rule 4 trigger status set to ${option}` });
                                                                }}
                                                                className="w-full text-left px-2 py-1.5 rounded-lg text-[12.5px] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors font-medium flex items-center justify-between"
                                                            >
                                                                <span className="flex items-center gap-1.5">
                                                                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                                                                    <span>{option}</span>
                                                                </span>
                                                                {rule4Status === option && <Check className="w-3.5 h-3.5 text-indigo-500" />}
                                                            </button>
                                                        ))
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default Automation;
