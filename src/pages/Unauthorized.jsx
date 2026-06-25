import React from "react";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 py-12 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-50 border border-red-100 text-red-750 mb-6 animate-pulse">
        <ShieldAlert className="h-10 w-10" />
      </div>
      
      <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">
        Access Unauthorized
      </h1>
      
      <p className="text-gray-500 text-sm max-w-md mb-8 leading-relaxed">
        This screen or route is reserved for Hotel Managers only. Front desk receptionist roles do not have permission to view or modify this directory.
      </p>

      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 rounded-lg bg-red-850 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-red-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </button>
    </div>
  );
}
