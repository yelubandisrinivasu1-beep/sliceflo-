"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useTeamStore } from "@/stores/teams-store";

import { getAvatarColor } from "@/utils/avatar-utils";

interface InviteMember {
  id: string;
  name: string;
  avatar?: string | null;
  initials: string;
  email?: string;
}

interface ViewAllMembersModalProps {
  open: boolean;
  onClose: () => void;
  members: InviteMember[];
}

const EMPTY_MEMBERS: InviteMember[] = [];

const ViewAllMembersModal: React.FC<ViewAllMembersModalProps> = ({
  open,
  onClose,
}) => {

  const { activeTeamId, removeMember, fetchTeamById } = useTeamStore();

  const members = useTeamStore(state =>
    state.teams.find(t => t.id === state.activeTeamId)?.teamMembers ?? EMPTY_MEMBERS
  );

  const [openInvite, setOpenInvite] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const teamId = activeTeamId;

  // const members = useTeamStore(state =>
  //   state.teams.find(t => t.id === teamId)?.teamMembers ?? []
  // );

  const handleConfirmRemove = async () => {
    if (!teamId || !memberToRemove || isRemoving) return;

    try {
      setIsRemoving(true);
      await removeMember(teamId, memberToRemove.id);

      // Optional: re-sync from backend if needed
      // await fetchTeamByID();
      setConfirmOpen(false);
      setMemberToRemove(null);

    } catch (error) {
      console.error("Failed to remove member:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl! w-full! border-0 border-b-[5px] border-[#001F3F] rounded-lg ">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle className="text-[#001F3F]">
              People associated with the Team
            </DialogTitle>
            <DialogClose asChild>
              {/* <button
                className="rounded-md p-1 text-[#001F3F] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#001F3F]"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button> */}
            </DialogClose>
          </DialogHeader>

          <div className=" overflow-y-auto border border-[#D1D1D6] rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#D1D1D6] ">
                  <TableHead className="border-[#D1D1D6] text-left px-14 text-[#001F3F]">Members</TableHead>
                  <TableHead className="text-center text-[#001F3F]">Action</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id} className="border-b border-b-[#D1D1D6] last:border-b-0">
                    <TableCell >
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={member.avatar || ""} />
                          <AvatarFallback className={`${getAvatarColor(member.id)} text-white`}>
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>

                        {/* Name + Email */}
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate max-w-50">
                            {member.name.length > 40
                              ? `${member.name.slice(0, 10)}...`
                              : member.name}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-50">
                            {member.email || "—"}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <button
                        className="text-sm text-red-600 hover:text-red-500 bg-[#F2F2F7] px-3 py-1 rounded-md cursor-pointer"
                        onClick={() => {
                          setMemberToRemove(member);
                          setConfirmOpen(true);
                        }}
                      >
                        Remove from Team
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={confirmOpen}
        onClose={() => {
          if (isRemoving) return;
          setConfirmOpen(false);
          setMemberToRemove(null);
        }}
        title={
          memberToRemove
            // ? `Are you sure you want to remove ${memberToRemove.name} (${memberToRemove.email})?`
            ? `Are you sure you want to remove ${memberToRemove.email}?`
            : 'Are you sure you want to remove this member?'
        }
        // confirmLabel={isRemoving ? "Removing..." : "Delete member"}
        confirmLabel="Delete member"
        description={
          memberToRemove?.email
            ? `${memberToRemove.email} will be removed from this team and its projects. To remove their access to the entire sliceflo.com organization, contact your admin.`
            : 'This member will be removed from this team and its projects.'
        }
        onConfirm={handleConfirmRemove}
        loading={isRemoving}
      />
    </>
  );
};

export default ViewAllMembersModal;
