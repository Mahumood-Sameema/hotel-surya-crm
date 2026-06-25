import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Check, 
  X, 
  Globe, 
  ExternalLink,
  Info,
  Calendar,
  AlertCircle
} from "lucide-react";
import { 
  getBookingRequests, 
  updateBookingRequestStatus,
  getRoomTypes
} from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function WebsiteBookingRequests() {
  const navigate = useNavigate();
  const { user } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending"); // Default to pending triage

  const loadData = async () => {
    try {
      const [reqList, rtList] = await Promise.all([
        getBookingRequests(),
        getRoomTypes()
      ]);
      // Sort requests by date descending
      setRequests(reqList.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setRoomTypes(rtList);
    } catch (e) {
      console.error("Requests triage failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDecline = async (id) => {
    try {
      await updateBookingRequestStatus(id, "Declined", user);
      await loadData();
    } catch (err) {
      console.error("Decline failed:", err);
    }
  };

  const handleApprove = async (req) => {
    try {
      // 1. Mark request as Approved
      await updateBookingRequestStatus(req.id, "Approved", user);
      
      // 2. Redirect to Create Booking form with pre-filled lead query parameters!
      navigate(
        `/bookings/create?leadId=${req.id}&guestName=${encodeURIComponent(req.guestName)}&phone=${req.phone}&email=${encodeURIComponent(req.email || "")}&roomTypeId=${req.roomTypeId}&checkIn=${req.checkIn}&checkOut=${req.checkOut}`
      );
    } catch (err) {
      console.error("Approval conversion failed:", err);
    }
  };

  const getRoomTypeName = (roomTypeId) => {
    const rt = roomTypes.find(t => t.roomTypeId === roomTypeId);
    return rt ? rt.name : "Unknown Type";
  };

  const filteredRequests = requests.filter(r => {
    const name = r.guestName.toLowerCase();
    const searchMatch = 
      name.includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      (r.bookingRef && r.bookingRef.toLowerCase().includes(searchQuery.toLowerCase()));

    const statusMatch = statusFilter === "all" || r.status === statusFilter;

    return searchMatch && statusMatch;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return "bg-amber-100 text-amber-800 border-amber-250";
      case "Approved":
        return "bg-green-100 text-green-800 border-green-205";
      case "Declined":
        return "bg-red-105 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Website Reservation Requests</h1>
          <p className="pms-page-header-subtitle">Triage bookings leads submitted online by customers via guest site portal</p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search request ref, customer name, mobile..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-red-500 focus:outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-red-500 focus:outline-none bg-white"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Lead Statuses</option>
            <option value="Pending">Pending Triage</option>
            <option value="Approved">Approved (Converted)</option>
            <option value="Declined">Declined</option>
          </select>
        </div>
      </div>

      {/* Requests table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Ref Number</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Requested Stay</th>
                <th className="px-6 py-4">Rooms / Guests</th>
                <th className="px-6 py-4">Special Requests</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredRequests.length > 0 ? (
                filteredRequests.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 text-xs">
                      {r.bookingRef || `ID-${r.id.slice(0, 5)}`}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{r.guestName}</div>
                      <div className="text-3xs text-gray-500 font-mono">{r.phone} | {r.email || "No Email"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800">{getRoomTypeName(r.roomTypeId)}</div>
                      <div className="text-3xs text-gray-500 font-medium">{r.checkIn} to {r.checkOut}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium">
                      {r.roomsCount || 1} Room(s) / {r.guestsCount || 1} Guest(s)
                    </td>
                    <td className="px-6 py-4 text-xs italic text-gray-500 max-w-xs truncate" title={r.specialRequests}>
                      {r.specialRequests ? `"${r.specialRequests}"` : "None"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.status === "Pending" ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r)}
                            className="rounded bg-red-800 hover:bg-red-900 text-white px-2.5 py-1 text-xs font-semibold transition-colors flex items-center gap-0.5 shadow-sm"
                            title="Approve & Convert to booking"
                          >
                            <Check className="h-3.5 w-3.5" /> Book
                          </button>
                          <button
                            onClick={() => handleDecline(r.id)}
                            className="rounded border border-red-200 hover:bg-red-50 text-red-800 p-1 transition-colors"
                            title="Decline Request"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-3xs text-gray-400 italic">Triaged</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                    No booking requests in this queue status.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
