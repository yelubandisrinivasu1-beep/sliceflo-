// 'use client'

// import React, { useEffect } from 'react'
// import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
// import { useTeamStore } from '@/stores/teams-store'
// import { useActivityLogStore } from '@/stores/activity-log-store'

// function ActivityLog() {
//   const { activeTeamId } = useTeamStore()
//   const { teams } = useTeamStore.getState();

//   const activeTeam = teams.find(t => t.id === activeTeamId);
//   const members = activeTeam?.teamMembers ?? [];

//   const attachMembers = (
//   logs: TeamActivityLogItem[],
//   members: {
//     id: string;
//     name: string;
//     email?: string;
//     avatar?: string;
//     role?: string;
//   }[]
// ): TeamActivityLogItem[] => {
//   return logs.map((log) => {
//     const member = members.find(m => m.id === log.actionBy);

//     const actor = member
//       ? {
//           id: member.id,
//           name: member.name,
//           email: member.email,
//           avatar: member.avatar ?? null,
//           role: member.role,
//         }
//       : undefined;

//     const d = new Date(log.time);
//     const dateOnly = d.toLocaleDateString("en-GB");
//     const timeOnly = d.toLocaleTimeString("en-US", {
//       hour: "2-digit",
//       minute: "2-digit",
//     });

//     return {
//       ...log,
//       actor,
//       dateOnly,
//       timeOnly,
//     };
//   });
// };



//   const activityLogs = useActivityLogStore(s => s.activityLogs)
//   const loading = useActivityLogStore(s => s.loading)
//   const fetchTeamActivityLogs = useActivityLogStore(s => s.fetchTeamActivityLogs)

//   useEffect(() => {
//     if (!activeTeamId) return
//     fetchTeamActivityLogs(activeTeamId)
//   }, [activeTeamId, fetchTeamActivityLogs])

//   if (loading) {
//     return (
//       <div className="text-sm text-muted-foreground px-4">
//         Loading activity...
//       </div>
//     )
//   }

//   if (!activityLogs.length) {
//     return (
//       <div className="text-sm text-muted-foreground px-4">
//         No activity yet
//       </div>
//     )
//   }

//   return (
//     <div className="flex flex-col gap-4 px-4">
//       {activityLogs.map((log) => (
//         <div key={log._id} className="flex gap-3">
//           <Avatar className="h-8 w-8">
//             <AvatarImage src={log.actor?.avatar ?? ''} />
//             <AvatarFallback>
//               {log.actor?.name?.charAt(0)}
//             </AvatarFallback>
//           </Avatar>

//           <div className="flex-1">
//             <p className="text-sm text-foreground">
//               <span className="font-medium">
//                 {log.actor?.name ?? 'Someone'}
//               </span>{' '}
//               {log.message}
//             </p>

//             <p className="text-xs text-muted-foreground">
//               {log.dateOnly} • {log.timeOnly}
//             </p>
//           </div>
//         </div>
//       ))}
//     </div>
//   )
// }

// export default ActivityLog























'use client'

import React, { useEffect } from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useTeamStore } from '@/stores/teams-store'
import { useActivityLogStore } from '@/stores/activity-log-store'

function ActivityLog() {
  const { activeTeamId } = useTeamStore()
  const { teams } = useTeamStore.getState();

  const activeTeam = teams.find(t => t.id === activeTeamId);
  const members = activeTeam?.teamMembers ?? [];


  const activityLogs = useActivityLogStore(s => s.activityLogs)
  const loading = useActivityLogStore(s => s.loading)
  const fetchTeamActivityLogs = useActivityLogStore(s => s.fetchTeamActivityLogs)

  useEffect(() => {
    if (!activeTeamId) return
    fetchTeamActivityLogs(activeTeamId)
  }, [activeTeamId, fetchTeamActivityLogs])

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground px-4">
        Loading activity...
      </div>
    )
  }

  if (!activityLogs.length) {
    return (
      <div className="text-sm text-muted-foreground px-4">
        No activity yet
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 px-4">
      {activityLogs.map((log) => (
        <div key={log._id} className="flex gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={log.actor?.avatar ?? ''} />
            <AvatarFallback>
              {log.actor?.name?.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-medium">
                {log.actor?.name ?? 'Someone'}
              </span>{' '}
              {log.message}
            </p>

            <p className="text-xs text-muted-foreground">
              {log.dateOnly} • {log.timeOnly}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityLog
