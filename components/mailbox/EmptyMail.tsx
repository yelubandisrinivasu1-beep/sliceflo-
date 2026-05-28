
import Image from "next/image";
export default function EmptyMail() {
  return (
    <div className="flex justify-center bg-white px-1 pt-5">
      <div className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 shadow-md p-6 w-[370px]">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          {/* Left: Logo + SliceFlo text */}
          <div className="flex items-center space-x-2">
            <Image
              src="/images/slicefloLogo.svg"
              alt="SliceFlo Logo"
              width={32}
              height={32}
              // className="w-8 h-8"
            />
            <span className="text-[#001F3F] text-base font-semibold">SliceFlo</span>
          </div>

          {/* Right: Date/Time + Mail Icon */}
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <span>15 Dec, 10:30 AM</span>
          </div>
        </div>

        {/* Main Text */}
        <h2 className="text-[#001F3F] font-semibold text-sm mt-3">
          Welcome to SliceFlo - We&apos;re glad you&apos;re here!
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          <span className="block">Hi [First Name],</span>
          Thank you for signing up with SliceFlo - we&apos;re excited to have you o...
        </p>

        {/* Footer Icons */}
    <div className="flex justify-end space-x-4 mt-4">
      <button
        className="text-gray-400 "
        title="Snooze"
      >
        
      </button>

      <button
        className="text-gray-400 "
        title="Delete"
      >
      </button>
    </div>
      </div>
    </div>
  );
}
