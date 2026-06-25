import React from "react";
import { User, Shield, Phone, Mail, Clock } from "lucide-react";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function MyProfile() {
  const { user } = usePmsAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">My Staff Account</h1>
          <p className="pms-page-header-subtitle">View your current operational session and credentials info</p>
        </div>
      </div>

      {/* Profile Card details */}
      <div className="rounded-xl border border-gray-205 bg-white p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-gray-150 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-800 text-2xl font-bold font-serif">
            {user.fullName[0]}
          </div>
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-bold text-gray-900">{user.fullName}</h3>
            <span className="inline-flex rounded-full bg-red-50 border border-red-100 px-3 py-0.5 text-xs font-semibold text-red-850">
              {user.role} Privilege
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <span className="text-4xs font-bold text-gray-400 uppercase tracking-widest block">Email Username</span>
              <span className="font-semibold text-gray-900 mt-0.5 block">{user.email}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <span className="text-4xs font-bold text-gray-400 uppercase tracking-widest block">Mobile Number</span>
              <span className="font-semibold text-gray-900 mt-0.5 block">{user.phone || "N/A"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <span className="text-4xs font-bold text-gray-400 uppercase tracking-widest block">Account Status</span>
              <span className="font-bold text-green-750 mt-0.5 block">Active</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-gray-400 shrink-0" />
            <div>
              <span className="text-4xs font-bold text-gray-400 uppercase tracking-widest block">Session Created</span>
              <span className="font-semibold text-gray-900 mt-0.5 block font-mono">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "Today"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
