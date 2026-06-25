import React, { useState, useEffect } from "react";
import { 
  Search, 
  IndianRupee, 
  Trash2, 
  AlertCircle,
  X,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { 
  getPayments, 
  voidPayment, 
  getBookings, 
  getGuests 
} from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function Payments() {
  const { user, hasPermission } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Void confirmation modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [voidReason, setVoidReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadData = async () => {
    try {
      const [pList, bList, gList] = await Promise.all([
        getPayments(),
        getBookings(),
        getGuests()
      ]);
      // Sort payments by paymentDate descending
      setPayments(pList.sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate)));
      setBookings(bList);
      setGuests(gList);
    } catch (e) {
      console.error("Payments log failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleVoid = async () => {
    if (!selectedPayment) return;
    setErrorMsg("");
    
    if (!voidReason.trim()) {
      setErrorMsg("Please specify a reason for voiding this transaction.");
      return;
    }

    try {
      await voidPayment(selectedPayment.paymentId, voidReason, user);
      setSuccessMsg(`Transaction ${selectedPayment.paymentId} was successfully voided.`);
      setSelectedPayment(null);
      setVoidReason("");
      await loadData();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg("Failed to void payment: " + err.message);
    }
  };

  const getGuestNameForBooking = (bookingId) => {
    const booking = bookings.find(b => b.bookingId === bookingId);
    if (booking) {
      const guest = guests.find(g => g.guestId === booking.guestId);
      return guest ? guest.fullName : "Unknown Guest";
    }
    return "N/A";
  };

  const filteredPayments = payments.filter(p => {
    const guestName = getGuestNameForBooking(p.bookingId).toLowerCase();
    const searchMatch = 
      p.paymentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.referenceId && p.referenceId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      guestName.includes(searchQuery.toLowerCase());

    const modeMatch = modeFilter === "all" || p.paymentMode === modeFilter;
    const statusMatch = statusFilter === "all" || p.status === statusFilter;

    return searchMatch && modeMatch && statusMatch;
  });

  const getPaymentTypeBadgeColor = (type) => {
    switch (type) {
      case "Advance":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Final Settlement":
        return "bg-purple-100 text-purple-800 border-purple-250";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "Voided":
        return "bg-red-100 text-red-800 border-red-200";
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
          <h1 className="pms-page-header-title">Payments Registry</h1>
          <p className="pms-page-header-subtitle">Audit trail of all front desk cash receipts, UPI transactions, and cards</p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-800 border border-green-150">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Filter Options */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search payment ID, booking, guest..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-4 text-sm focus:border-red-500 focus:outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div>
          <select
            className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-red-500 focus:outline-none bg-white"
            value={modeFilter}
            onChange={e => setModeFilter(e.target.value)}
          >
            <option value="all">All Payment Methods</option>
            <option>UPI</option>
            <option>Cash</option>
            <option>Credit Card</option>
            <option>Debit Card</option>
          </select>
        </div>
        <div>
          <select
            className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-red-500 focus:outline-none bg-white"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Payment Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Voided">Voided</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Receipt ID</th>
                <th className="px-6 py-4">Booking Ref</th>
                <th className="px-6 py-4">Guest</th>
                <th className="px-6 py-4">Date / Time</th>
                <th className="px-6 py-4">Payment Mode</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredPayments.length > 0 ? (
                filteredPayments.map(p => (
                  <tr key={p.paymentId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 text-xs">
                      {p.paymentId}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-xs text-red-800">
                      {p.bookingId}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {getGuestNameForBooking(p.bookingId)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(p.paymentDate).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="font-semibold text-gray-800">{p.paymentMode}</div>
                      {p.referenceId && <div className="font-mono text-3xs text-gray-400">Ref: {p.referenceId}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getPaymentTypeBadgeColor(p.paymentType)}`}>
                        {p.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ₹{p.amount}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeColor(p.status)}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.status === "Completed" && (
                        <button
                          onClick={() => setSelectedPayment(p)}
                          disabled={!hasPermission("payments/void")}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-800 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                          title={hasPermission("payments/void") ? "Void Payment" : "Restricted: Manager Only"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                    No transactions found matching search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Void Dialog Overlay */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <h3 className="font-serif text-lg font-bold text-gray-900">Void Transaction</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedPayment(null);
                  setVoidReason("");
                  setErrorMsg("");
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-800 border border-red-150">
                <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                <p className="text-xs font-semibold">{errorMsg}</p>
              </div>
            )}

            <div className="space-y-4 text-xs text-gray-600">
              <p className="text-gray-500">Voiding a payment will subtract it from the reservation's advance ledger. This action is permanently logged for security auditing.</p>
              <div className="bg-gray-50 p-3 border border-gray-200 rounded-md font-mono text-gray-800 space-y-1">
                <div>Receipt ID: <span className="font-bold">{selectedPayment.paymentId}</span></div>
                <div>Reservation: <span className="font-bold">{selectedPayment.bookingId}</span></div>
                <div>Amount: <span className="font-bold">₹{selectedPayment.amount}</span></div>
                <div>Mode: <span className="font-bold">{selectedPayment.paymentMode}</span></div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reason for Void *</label>
                <textarea
                  placeholder="Enter clear explanation (e.g. incorrect amount entered, UPI bounced)..."
                  className="w-full rounded-md border border-gray-300 p-2.5 text-xs focus:outline-none"
                  rows="3"
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-150 pt-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setSelectedPayment(null);
                  setVoidReason("");
                  setErrorMsg("");
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-center text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVoid}
                className="flex-1 rounded-lg bg-red-800 py-2 text-center text-white hover:bg-red-900 transition-colors"
              >
                Confirm Void Ledger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
