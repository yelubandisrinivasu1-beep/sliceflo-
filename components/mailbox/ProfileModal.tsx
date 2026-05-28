"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { X, Phone, Mail, MapPin, Clock, SendHorizontal } from "lucide-react";
import { mailStore } from "@/stores/mailbox-store";
import dayjs from "dayjs";

const ProfileModal: React.FC = () => {
  const isOpen = mailStore((state) => state.isProfileModalOpen);
  const closeModal = mailStore((state) => state.closeProfileModal);
  const profile = mailStore((state) => state.profileData);

  if (!isOpen || !profile) return null;

  const {
    name,
    email,
    profilePicture,
    profilePictureUrl,
    phone,
    city,
    country,
    position,
    localTime,
  } = profile;

  const formattedLocalTime = dayjs().format("hh:mm A");

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="w-95 rounded-2xl border-0 border-b-4 border-[#001F3F] p-4">
        <DialogHeader className="flex flex-col items-center text-center gap-2">
          {/* Avatar */}
          <img
            src={profilePictureUrl  || profilePicture || "/avatar-placeholder.png"}
            alt={name}
            className="w-24 h-24 rounded-full object-cover shadow-md border-2 border-[#001F3F]"
          />

          <DialogTitle className="text-lg font-semibold">
            {/* {name?.length > 10 ? `${name.slice(0, 10)}...` : name} */}
            {name}
          </DialogTitle>

          {position && (
            <p className="text-gray-400 text-sm font-semibold">
              {position}
            </p>
          )}
        </DialogHeader>

        <Separator />

        {/* Phone */}
        <InfoRow
          icon={<Phone className="text-[#001F3F]" />}
          label="Phone"
          value={phone || "+91 98765 43210"}
        />

        <Separator />

        {/* Email */}
        <div className="px-0 flex items-center justify-between">
          <InfoRow
            icon={<Mail className="text-[#001F3F]" />}
            label="Email"
            value={email}
          />
          <SendHorizontal className="p-2 rounded-full bg-gray-200 text-gray-500 cursor-pointer hover:bg-gray-300 w-9 h-9" />
        </div>

        <Separator />

        {/* Location */}
        {/* <InfoRow
          icon={<MapPin className="text-[#001F3F]" />}
          label="City, Country"
          value={`${city || "city"}, ${country || "country"}`}
        />

        <Separator /> */}

        {/* Local Time */}
        <InfoRow
          icon={<Clock className="text-[#001F3F]" />}
          label="Local Time"
          // value={localTime}
          value={formattedLocalTime}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;

/* Reusable row */
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) => (
  <div className="px-2 flex items-center gap-3">
    {icon}
    <div className="flex flex-col leading-tight">
      <span className="font-medium text-[#001F3F] text-sm">{label}</span>
      <span className="text-gray-500 text-sm">
        {value || "Not available"}
      </span>
    </div>
  </div>
);
