"use client";

import { useState, MouseEvent } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Ellipsis,
  Pin,
  PinOff,
  EyeOff,
  Link,
  Mail,
  ClipboardList,
  ListPlus,
  Trash2,
  Ban,
} from "lucide-react";

// import DoNotDisturbIcon from "@mui/icons-material/DoNotDisturb"; // If needed you can replace this too
// import NewTaskModal from "./NewTaskModal";
// import NewSubTaskModal from "./NewSubTaskModal";
import { toast } from "@/components/ui/sonner";

interface MoreMenuProps {
  commentId?: string;
  isPinned?: boolean;
  onTogglePin: (threadId: string, shouldPin: boolean) => void;
  onDelete?: (threadId: string) => void;
}

export default function MoreMenu({
  commentId,
  isPinned = false,
  onTogglePin,
  onDelete,
}: MoreMenuProps) {
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [subTaskModalOpen, setSubTaskModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // store actions
  // const { pinComment, unpinComment } = useTeamStore();

  // Pin
  const handlePin = () => {
    if (commentId && onTogglePin) {
      onTogglePin(commentId, !isPinned);
    }
  };

  const handleUnfollow = () => {
    console.log("Unfollow clicked");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("threadId", commentId || "");
        navigator.clipboard.writeText(url.toString());
        toast("success", { title: "Thread link copied!" });
      } catch (err) {
        console.error("Failed to copy link:", err);
        toast("error", { title: "Failed to copy thread link" });
      }
    }
  };

  const handleSendEmail = () => {
    console.log("Send via Email clicked");
  };

  const handleNewTask = () => setTaskModalOpen(true);

  const handleNewSubtask = () => setSubTaskModalOpen(true);

  const handleDelete = () => {
    if (commentId) {
      setConfirmOpen(true);
    }
  };

  const confirmDelete = async () => {
    if (commentId && onDelete) {
      await onDelete(commentId);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Ellipsis className="w-4 h-4 cursor-pointer" />
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-58 border-0 border-b-4 border-[#001F3F]">
          {/* Pin / Unpin */}
          <DropdownMenuItem onClick={handlePin}>
            <span className="flex items-center gap-2">
              {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
              <span className="text-[0.85rem] font-light">
                {isPinned ? "Unpin Thread" : "Pin Thread"}
              </span>
            </span>
          </DropdownMenuItem>

          {/* Unfollow */}
          <DropdownMenuItem onClick={handleUnfollow}>
            <span className="flex items-center gap-2">
              <Ban style={{ fontSize: 16 }} />
              <span className="text-[0.85rem] font-light">Unfollow Thread</span>
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Copy Link */}
          <DropdownMenuItem onClick={handleCopyLink}>
            <span className="flex items-center gap-2">
              <Link size={16} />
              <span className="text-[0.85rem] font-light">
                Copy Thread Link
              </span>
            </span>
          </DropdownMenuItem>

          {/* Send Email */}
          <DropdownMenuItem onClick={handleSendEmail}>
            <span className="flex items-center gap-2">
              <Mail size={16} />
              <span className="text-[0.85rem] font-light">Send via Email</span>
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* New Task */}
          <DropdownMenuItem onClick={handleNewTask}>
            <span className="flex items-center gap-2">
              <ClipboardList size={16} />
              <span className="text-[0.85rem] font-light">
                New task from comment
              </span>
            </span>
          </DropdownMenuItem>

          {/* New Subtask */}
          <DropdownMenuItem onClick={handleNewSubtask}>
            <span className="flex items-center gap-2">
              <ListPlus size={16} />
              <span className="text-[0.85rem] font-light">
                New subtask from comment
              </span>
            </span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Delete */}
          <DropdownMenuItem onClick={handleDelete}>
            <span className="flex items-center gap-2 text-[#FF3D00]">
              <Trash2 size={16} color="#FF3D00" />
              <span className="text-[0.85rem] font-light">Delete</span>
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* <NewTaskModal open={taskModalOpen} onClose={() => setTaskModalOpen(false)} /> */}

      {/* <NewSubTaskModal
        open={subTaskModalOpen}
        onClose={() => setSubTaskModalOpen(false)}
      /> */}

      {/* <ConfirmationModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Are you sure you want to delete this thread?"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
      /> */}
    </>
  );
}
