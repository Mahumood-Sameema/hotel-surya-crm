import React, { useState, useEffect } from "react";
import { 
  Search, 
  ShieldAlert, 
  Clock, 
  User, 
  Database,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { getAuditLogs } from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function AuditLogs() {
  const { hasPermission } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  // Selected Log detail dialog
  const [selectedLog, setSelectedLog] = useState(null);

  const loadLogsList = async () => {
    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error("Audit logs load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission("admin")) {
      loadLogsList();
    } else {
      setLoading(false);
    }
  }, [hasPermission]);

  if (!hasPermission("admin")) {
    return (
      <div className="mx-auto max-w-lg text-center py-20 space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-800">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-sm text-gray-500">
            This module is reserved for hotel managers only. Receptionists are restricted from viewing operational audit trails.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent"></div>
      </div>
    );
  }

  const modules = ["Auth", "Bookings", "Rooms", "Room Types", "Guests", "Payments", "Invoices", "Settings", "Website Requests", "Contact Inquiries"];

  const filteredLogs = logs.filter(l => {
    const searchMatch = 
      l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.recordId && l.recordId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.newValue && typeof l.newValue === 'string' && l.newValue.toLowerCase().includes(searchQuery.toLowerCase()));

    const moduleMatch = moduleFilter === "all" || l.module === moduleFilter;

    return searchMatch && moduleMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Security Audit Logs</h1>
          <p className="pms-page-header-subtitle">System operations audit trail, login history, and database transaction records</p>
        </div>
      </div>

      {/* Filter Options */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search staff user name, action, record ID..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-red-500 focus:outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-red-500 focus:outline-none bg-white"
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
          >
            <option value="all">All Modules</option>
            {modules.map((m, idx) => (
              <option key={idx} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Staff User</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Record ID</th>
                <th className="px-6 py-4">Details Summary</th>
                <th className="px-6 py-4">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 font-mono text-3xs">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(l.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{l.userName}</div>
                      <div className="text-4xs text-gray-400 font-semibold">{l.role}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-700 uppercase tracking-wider">
                      {l.module}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded px-1.5 py-0.5 text-4xs font-semibold ${
                        l.action === "Created" 
                          ? "bg-green-50 text-green-800" 
                          : l.action === "Updated" 
                            ? "bg-blue-50 text-blue-800" 
                            : l.action === "Voided" || l.action === "Deleted" 
                              ? "bg-red-50 text-red-800" 
                              : "bg-gray-50 text-gray-600"
                      }`}>
                        {l.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-550 font-bold">
                      {l.recordId || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate font-sans">
                      {typeof l.newValue === 'object' ? JSON.stringify(l.newValue) : l.newValue}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="text-xs font-bold text-red-850 hover:underline font-sans"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    No security audit logs found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Inspector Dialog */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl border border-gray-200 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div className="flex items-center gap-2 text-gray-800">
                <Clock className="h-5 w-5 text-red-800" />
                <h3 className="font-serif text-lg font-bold text-gray-900">Audit Log Details</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-4xs font-bold text-gray-450 uppercase block font-sans">Timestamp</span>
                  <span className="text-gray-805 mt-0.5 block">{new Date(selectedLog.timestamp).toLocaleString("en-IN")}</span>
                </div>
                <div>
                  <span className="text-4xs font-bold text-gray-455 uppercase block font-sans">Staff User</span>
                  <span className="text-gray-805 mt-0.5 block">{selectedLog.userName} ({selectedLog.role})</span>
                </div>
                <div>
                  <span className="text-4xs font-bold text-gray-455 uppercase block font-sans">Module</span>
                  <span className="text-gray-805 mt-0.5 block">{selectedLog.module}</span>
                </div>
                <div>
                  <span className="text-4xs font-bold text-gray-455 uppercase block font-sans">Action</span>
                  <span className="text-gray-850 mt-0.5 block font-bold text-red-800">{selectedLog.action}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-4xs font-bold text-gray-455 uppercase block font-sans">Record Reference ID</span>
                  <span className="text-gray-805 mt-0.5 block">{selectedLog.recordId || "N/A"}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-4xs font-bold text-gray-455 uppercase block font-sans">Client Client Context</span>
                  <span className="text-gray-500 mt-0.5 block leading-normal text-4xs">IP: {selectedLog.ipAddress} | {selectedLog.browser}</span>
                </div>
              </div>

              {selectedLog.oldValue && (
                <div>
                  <span className="text-4xs font-bold text-gray-400 uppercase block font-sans mb-1">Old Value State</span>
                  <pre className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 overflow-x-auto text-4xs leading-normal max-h-32 text-gray-650">
                    {selectedLog.oldValue}
                  </pre>
                </div>
              )}

              <div>
                <span className="text-4xs font-bold text-gray-400 uppercase block font-sans mb-1">New Value State / Details</span>
                <pre className="bg-gray-50 p-2.5 rounded-lg border border-gray-150 overflow-x-auto text-4xs leading-normal max-h-48 text-gray-700 font-bold">
                  {selectedLog.newValue}
                </pre>
              </div>
            </div>

            <div className="border-t border-gray-150 pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
