import React from "react";
import { ShieldCheck, ShieldAlert, Lock, Check } from "lucide-react";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function RolesPermissions() {
  const { hasPermission } = usePmsAuth();

  if (!hasPermission("admin")) {
    return (
      <div className="mx-auto max-w-lg text-center py-20 space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-800">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-500">
            This module is reserved for hotel managers only. Receptionists are restricted from role policy editing.
          </p>
        </div>
      </div>
    );
  }

  // Permission Matrices
  const matrices = [
    { module: "Dashboard KPI View", manager: true, receptionist: true },
    { module: "Room List / Status updates", manager: true, receptionist: true },
    { module: "Create / Edit Booking", manager: true, receptionist: true },
    { module: "Check-In / Out Folios", manager: true, receptionist: true },
    { module: "Payments Logs (UPI / Cash capture)", manager: true, receptionist: true },
    { module: "Print Tax Invoices", manager: true, receptionist: true },
    { module: "View Occupancy / Guest reports", manager: true, receptionist: true },
    { module: "View Revenue reports", manager: true, receptionist: false },
    { module: "View Payment reports", manager: true, receptionist: false },
    { module: "Void captured payments", manager: true, receptionist: false },
    { module: "Cancel reservations", manager: true, receptionist: true },
    { module: "Website Requests Triage", manager: true, receptionist: true },
    { module: "Staff Account Creation (Admin)", manager: true, receptionist: false },
    { module: "Hotel Settings (GST rates/Gstins)", manager: true, receptionist: false },
    { module: "Security Audit Logs", manager: true, receptionist: false }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Roles & Policy Permissions</h1>
          <p className="pms-page-header-subtitle">View front desk user privileges and role-based access control restrictions</p>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-red-50 p-2 text-red-800 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-gray-900">Hotel Staff Permission Policy</h3>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              Surya Residency CRM operates under strict Role-Based Access Control (RBAC). Privileges are coded to prevent front desk receptionists from tampering with historical billing logs, voiding payments, or viewing gross hotel revenue summary charts. Managers hold full system-wide permissions.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Policy Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full border-collapse text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Module Operations</th>
              <th className="px-6 py-4 text-center">Manager (Admin)</th>
              <th className="px-6 py-4 text-center">Receptionist</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-150">
            {matrices.map((m, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-semibold text-gray-900">{m.module}</td>
                <td className="px-6 py-4 text-center">
                  <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-800">
                    <Check className="h-4 w-4" />
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {m.receptionist ? (
                    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-800">
                      <Check className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-850" title="Restricted: Managers Only">
                      <Lock className="h-3 w-3" />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
