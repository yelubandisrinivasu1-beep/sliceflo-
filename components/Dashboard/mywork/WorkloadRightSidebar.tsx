
"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProjectsStore } from "@/stores/projects-store";
import { useTasksStore } from "@/stores/tasks-store";
import { useMemo } from "react";
import { useProfileStore } from "@/stores/profile-store";
import { useAuthStore } from "@/stores/auth-store";

export function WorkloadRightSidebar() {
  const { tasks } = useTasksStore();
  const { user } = useAuthStore();
  const { myWork } = useProfileStore();

  const myTeams = myWork?.teams || [];

  const recentTasks = useMemo(() => {
    return tasks
      .filter((t) => t.assignee === user?.id)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [tasks, user]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* My Teams */}
      <div className="flex-1 flex flex-col overflow-hidden pb-4 min-h-0">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h3 className="text-sm font-bold">My Teams</h3>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {myTeams.length} Total
          </span>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-1.5 pr-4">
              {myTeams.map((team) => (
                <div
                  key={team.id}
                  className="group flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-border"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs shrink-0">
                    {team.name?.[0].toUpperCase() ?? "T"}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-semibold truncate group-hover:text-blue-600 transition-colors">
                      {team.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {team.teamMembers ? `${team.teamMembers.length} members` : (team.role || "Member")}
                    </span>
                  </div>
                </div>
              ))}
              {myTeams.length === 0 && (
                <p className="text-[10px] text-muted-foreground px-2">You are not in any teams.</p>
              )}
              {myTeams.length > 6 && (
                <button className="text-[10px] font-medium text-blue-500 hover:underline mt-2 px-2 text-left">
                  View all teams
                </button>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Recents */}
      <div className="flex-1 flex flex-col overflow-hidden pt-4 border-t min-h-0">
        <h3 className="text-sm font-bold mb-4 shrink-0">Recents</h3>
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-1 pr-4">
              {recentTasks.map((t, i) => (
                <div
                  key={t.id || i}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-[10px] bg-background border">
                        {t.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-medium truncate">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      Task
                    </span>
                  </div>
                </div>
              ))}
              {recentTasks.length === 0 && (
                <p className="text-[10px] text-muted-foreground px-2">No recent activity.</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
