'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Smile, ArrowUp, Paperclip } from 'lucide-react';
import EmojiPicker, { EmojiStyle, EmojiClickData } from 'emoji-picker-react';

import { useProfileStore } from '@/stores/profile-store';
import { useAuthStore } from '@/stores/auth-store';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import AttachFileModal from './AttachFileModal';
import { uploadFile } from '@/lib/api/uploads-api';
import type { UploadResponse } from '@/lib/api/uploads-api'

interface NewThreadInputProps {
  onNewThread: (data: {
    text: string;
    uploads: UploadResponse[];
  }) => Promise<void>;
}

export default function NewThreadInput({ onNewThread }: NewThreadInputProps) {
  const fetchUserProfile = useProfileStore((state) => state.fetchUserProfile
  );
  const { user } = useAuthStore();

  const profilePictureUrl = useProfileStore((state) => state.user?.profilePictureUrl);

  const [newThreadText, setNewThreadText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [showAttachFile, setShowAttachFile] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const initials = user?.name
    ? user.name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
    : 'U';

  // Close emoji picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target as Node)
      ) {
        setEmojiOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNewThread = async () => {
    if (!newThreadText.trim() && attachedFiles.length === 0) return;

    try {
      // Upload all files in parallel
      const uploadResults: UploadResponse[] = await Promise.all(
        attachedFiles.map(file => uploadFile(file))
      );

      // Send thread with text + uploaded file references
      await onNewThread({
        text: newThreadText.trim(),
        uploads: uploadResults,
      });

      // Clear UI
      setNewThreadText('');
      setAttachedFiles([]);
    } catch (error) {
      console.error(' Failed to send thread:', error);
      // optional: show toast here
    }
  };

  const handleEmojiSelect = (emojiData: EmojiClickData) => {
    setNewThreadText((prev) => prev + emojiData.emoji);
  };

  return (
    <Card className="rounded-xl bg-[#D1D1D6] p-4 shadow-sm">
      <div className="flex items-center gap-2 rounded-lg bg-[#F5F6FA] p-2">
        {/* Avatar */}
        <Avatar className="h-6 w-6">
          {profilePictureUrl?.trim() ? (
            <AvatarImage src={profilePictureUrl} alt="Profile" />
          ) : (
            <AvatarFallback className="text-[10px] font-semibold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>

        {/* Input */}
        <Input
          value={newThreadText}
          onChange={(e) => setNewThreadText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleNewThread();
            }
          }}
          placeholder="Create new thread"
          className="border-0 bg-transparent text-sm font-medium text-[#001F3F] placeholder:text-xs placeholder:font-semibold placeholder:text-[#8E8E93] focus-visible:ring-0"
        />

        {/* Attach file */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setShowAttachFile(true)}
          className={`relative rounded-md transition-colors
            ${attachedFiles.length > 0
              ? 'bg-[#FF8D28]/20'
              : 'bg-[#E5E5EA]'
            }`}
        >
          <Paperclip
            size={16}
            className={
              attachedFiles.length > 0
                ? 'text-[#FF8D28]'
                : 'text-[#8E8E93]'
            }
          />

          {attachedFiles.length > 0 && (
            // <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center px-1 text-[10px] font-semibold text-[#FF8D28]">
            <span className="absolute bottom-1 left-3/4 -translate-x-1/2 translate-y-1/8 text-[10px] font-semibold text-[#FF8D28]">
              {attachedFiles.length}
            </span>
          )}
        </Button>

        <AttachFileModal
          open={showAttachFile}
          onClose={() => setShowAttachFile(false)}
          onAttach={(files: File[]) => {
            setAttachedFiles(files);
            setShowAttachFile(false);
          }}
        />

        {/* Emoji picker */}
        <div className="relative" ref={emojiPickerRef}>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-md bg-[#E5E5EA]"
            onClick={() => setEmojiOpen((v) => !v)}
          >
            <Smile size={16} className="text-[#8E8E93]" />
          </Button>

          {emojiOpen && (
            <div className="absolute right-0 top-0 z-50 -translate-y-full translate-x-2 rounded-md bg-white shadow-lg">
              <EmojiPicker
                onEmojiClick={handleEmojiSelect}
                width={320}
                height={400}
                emojiStyle={EmojiStyle.NATIVE}
                lazyLoadEmojis
              />
            </div>
          )}
        </div>

        {/* Send */}
        <Button
          type="button"
          size="icon"
          className="rounded-full bg-white"
          onClick={handleNewThread}
        >
          <ArrowUp size={18} className="text-[#8E8E93]" />
        </Button>
      </div>
    </Card>
  );
}
