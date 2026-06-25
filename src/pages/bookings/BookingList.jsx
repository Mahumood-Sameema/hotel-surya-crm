import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Filter, 
  Eye, 
  CheckSquare, 
  LogOut, 
  Trash2, 
  Printer, 
  Plus, 
  Calendar, 
  Tag, 
  IndianRupee, 
  Info,
  ChevronRight,
  X,
  AlertCircle
} from "lucide-react";
import { 
  getBookings, 
  getGuests, 
  getRooms, 
  getRoomTypes, 
  updateBooking, 
  updateRoomStatus, 
  getInvoices
} from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function BookingList() {
  const navigate = useNavigate();
  const { user, hasPermission } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  
  // Drawer / Details Modal State
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const loadData = async () => {
    try {
      const [b, g, r, rt, inv] = await Promise.all([
        getBookings(),
        getGuests(),
        getRooms(),
        getRoomTypes(),
        getInvoices()
      ]);
      setBookings(b);
      setGuests(g);
      setRooms(r);
      setRoomTypes(rt);
      setInvoices(inv);
    } catch (err) {
      console.error("BookingList failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    try {
      // Update booking status to Cancelled
      await updateBooking(selectedBooking.bookingId, { 
        status: "Cancelled",
        cancellationReason: cancelReason,
        cancelledAt: new Date().toISOString()
      }, user);
      
      // Release room status back to available
      if (selectedBooking.roomId) {
        await updateRoomStatus(selectedBooking.roomId, "available", `Cancelled Reservation ${selectedBooking.bookingId}`, user);
      }

      setShowCancelConfirm(false);
      setSelectedBooking(null);
      setCancelReason("");
      await loadData();
    } catch (err) {
      console.error("Cancellation failed:", err);
    }
  };

  const getGuestName = (guestId) => {
    const g = guests.find(guest => guest.guestId === guestId);
    return g ? g.fullName : "Unknown Guest";
  };

  const getRoomName = (roomId) => {
    const r = rooms.find(room => room.roomId === roomId);
    return r ? `Room ${r.roomNumber}` : "Not Assigned";
  };

  const getRoomTypeName = (roomTypeId) => {
    const rt = roomTypes.find(t => t.roomTypeId === roomTypeId);
    return rt ? rt.name : "Unknown Type";
  };

  const getInvoiceId = (bookingId) => {
    const inv = invoices.find(i => i.bookingId === bookingId);
    return inv ? inv.invoiceId : null;
  };

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    const guestName = getGuestName(b.guestId).toLowerCase();
    const searchMatch = 
      b.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guestName.includes(searchQuery.toLowerCase()) ||
      (b.roomId && b.roomId.includes(searchQuery));

    const statusMatch = statusFilter === "all" || b.status === statusFilter;

    let dateMatch = true;
    if (dateFilter) {
      dateMatch = b.checkInDate === dateFilter || b.checkOutDate === dateFilter;
    }

    return searchMatch && statusMatch && dateMatch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "Confirmed":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Checked In":
        return "bg-green-100 text-green-800 border-green-200";
      case "Checked Out":
        return "bg-gray-100 text-gray-800 border-gray-250";
      case "Cancelled":
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
          <h1 className="pms-page-header-title">Reservations Ledger</h1>
          <p className="pms-page-header-subtitle">View and manage guest arrivals, stays, and departures</p>
        </div>
        <button
          onClick={() => navigate("/bookings/create")}
          className="flex items-center gap-2 rounded-lg bg-red-850 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-900 transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" /> Create Reservation
        </button>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search booking ID, guest name, room..."
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
            <option value="all">All Booking Statuses</option>
            <option value="Confirmed">Confirmed (Reserved)</option>
            <option value="Checked In">Checked In (Occupied)</option>
            <option value="Checked Out">Checked Out</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <input
            type="date"
            className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-red-500 focus:outline-none"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Booking Ref</th>
                <th className="px-6 py-4">Guest</th>
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4 text-right">Grand Total</th>
                <th className="px-6 py-4 text-right">Balance Due</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredBookings.length > 0 ? (
                filteredBookings.map((b) => (
                  <tr key={b.bookingId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 text-xs">
                      {b.bookingId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{getGuestName(b.guestId)}</div>
                      <div className="text-3xs text-gray-500 font-mono">Source: {b.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-900">{getRoomName(b.roomId)}</div>
                      <div className="text-3xs text-gray-500">{getRoomTypeName(b.roomTypeId)}</div>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div className="text-gray-800">
                        {b.checkInDate} <ChevronRight className="inline-block h-3 w-3 mx-1 text-gray-400" /> {b.checkOutDate}
                      </div>
                      <div className="text-3xs text-gray-500 font-medium">({b.nightsCount} nights, {b.adultsCount} adults)</div>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-900">
                      ₹{b.grandTotal}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${b.balanceDue > 0 ? "text-amber-700" : "text-green-700"}`}>
                        ₹{b.balanceDue}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getStatusColor(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {b.status === "Confirmed" && (
                          <button
                            onClick={() => navigate(`/operations/check-in?bookingId=${b.bookingId}`)}
                            className="rounded p-1 text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Perform Check-In"
                          >
                            <CheckSquare className="h-4 w-4" />
                          </button>
                        )}
                        
                        {b.status === "Checked In" && (
                          <button
                            onClick={() => navigate(`/operations/check-out?bookingId=${b.bookingId}`)}
                            className="rounded p-1 text-green-600 hover:bg-green-50 transition-colors"
                            title="Perform Check-Out"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        )}

                        {getInvoiceId(b.bookingId) && (
                          <button
                            onClick={() => navigate(`/billing/invoices/${getInvoiceId(b.bookingId)}`)}
                            className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-800 transition-colors"
                            title="Print Tax Invoice"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                    No reservations matching current search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Side Drawer Panel */}
      {selectedBooking && (
        <div className="fixed inset-0 z-55 flex justify-end bg-black/40 backdrop-blur-3xs">
          <div className="h-full w-full max-w-lg bg-white p-6 shadow-2xl overflow-y-auto space-y-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-gray-150 pb-4">
                <div>
                  <span className="font-mono text-3xs font-semibold text-gray-400 uppercase tracking-wider">Reservation Summary</span>
                  <h3 className="font-serif text-lg font-bold text-gray-900 mt-1">{selectedBooking.bookingId}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    setShowCancelConfirm(false);
                  }}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Banner */}
              <div className={`mt-4 rounded-lg border p-3 flex justify-between items-center ${getStatusColor(selectedBooking.status)}`}>
                <span className="text-xs font-bold uppercase tracking-wider">Status: {selectedBooking.status}</span>
                <span className="text-3xs font-mono">{selectedBooking.createdAt.slice(0, 10)}</span>
              </div>

              {/* Booking Info Fields */}
              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider">Guest Profile</h4>
                  <p className="font-semibold text-gray-800 mt-1">{getGuestName(selectedBooking.guestId)}</p>
                  <button 
                    onClick={() => navigate(`/guests/${selectedBooking.guestId}`)} 
                    className="text-xs text-red-800 hover:underline mt-1 block"
                  >
                    View Guest Profile details &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider">Room category</h4>
                    <p className="font-semibold text-gray-800 mt-1">{getRoomTypeName(selectedBooking.roomTypeId)}</p>
                  </div>
                  <div>
                    <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider">Room number</h4>
                    <p className="font-semibold text-gray-800 mt-1">{getRoomName(selectedBooking.roomId)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider">Check-in</h4>
                    <p className="font-medium text-gray-800 mt-1">{selectedBooking.checkInDate}</p>
                  </div>
                  <div>
                    <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider">Check-out</h4>
                    <p className="font-medium text-gray-800 mt-1">{selectedBooking.checkOutDate}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider">Nights</h4>
                    <p className="font-medium text-gray-850 mt-1">{selectedBooking.nightsCount}</p>
                  </div>
                  <div>
                    <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider">Adults</h4>
                    <p className="font-medium text-gray-850 mt-1">{selectedBooking.adultsCount}</p>
                  </div>
                  <div>
                    <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider">Children</h4>
                    <p className="font-medium text-gray-850 mt-1">{selectedBooking.childrenCount || 0}</p>
                  </div>
                </div>

                {selectedBooking.specialRequests && (
                  <div>
                    <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider">Special Requests</h4>
                    <p className="bg-amber-50 p-2.5 text-xs text-amber-900 border border-amber-100 rounded-md mt-1 italic">
                      "{selectedBooking.specialRequests}"
                    </p>
                  </div>
                )}

                {/* Ledger summary */}
                <div className="border-t border-gray-150 pt-4">
                  <h4 className="text-3xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ledger Pricing</h4>
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Rate per night:</span>
                      <span>₹{selectedBooking.ratePerNight}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tariff Subtotal:</span>
                      <span>₹{selectedBooking.subTotal}</span>
                    </div>
                    {selectedBooking.discountAmount > 0 && (
                      <div className="flex justify-between text-red-750">
                        <span>Discount:</span>
                        <span>- ₹{selectedBooking.discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>GST Taxes ({selectedBooking.gstRate}%):</span>
                      <span>₹{selectedBooking.gstAmount}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-100 pt-1.5 font-bold text-gray-900">
                      <span>Grand Total:</span>
                      <span>₹{selectedBooking.grandTotal}</span>
                    </div>
                    <div className="flex justify-between text-green-700">
                      <span>Advance paid:</span>
                      <span>₹{selectedBooking.advancePaid || 0}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-150 pt-1.5 font-bold text-base text-amber-850">
                      <span>Balance Due:</span>
                      <span>₹{selectedBooking.balanceDue}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cancel Panel */}
            <div className="border-t border-gray-200 pt-4 space-y-3">
              {showCancelConfirm ? (
                <div className="rounded-lg bg-red-50 p-4 border border-red-150 space-y-3">
                  <div className="flex items-center gap-2 text-red-900 font-semibold text-xs uppercase">
                    <AlertCircle className="h-4 w-4" /> Are you sure you want to cancel?
                  </div>
                  <input
                    type="text"
                    placeholder="Enter cancellation reason..."
                    className="w-full rounded-md border border-gray-300 bg-white p-2 text-xs focus:outline-none"
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                  />
                  <div className="flex justify-end gap-2 text-xs">
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="rounded border border-gray-300 bg-white px-2.5 py-1 font-semibold text-gray-600 hover:bg-gray-50"
                    >
                      Keep Booking
                    </button>
                    <button
                      onClick={handleCancelBooking}
                      disabled={!cancelReason.trim()}
                      className="rounded bg-red-800 px-3 py-1 font-semibold text-white hover:bg-red-900 disabled:bg-gray-400"
                    >
                      Confirm Cancellation
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  {selectedBooking.status === "Confirmed" && (
                    <button
                      onClick={() => navigate(`/operations/check-in?bookingId=${selectedBooking.bookingId}`)}
                      className="flex-1 rounded-lg bg-red-800 py-2.5 text-center text-xs font-semibold text-white hover:bg-red-900 shadow"
                    >
                      Check-In Guest
                    </button>
                  )}
                  {selectedBooking.status === "Checked In" && (
                    <button
                      onClick={() => navigate(`/operations/check-out?bookingId=${selectedBooking.bookingId}`)}
                      className="flex-1 rounded-lg bg-green-800 py-2.5 text-center text-xs font-semibold text-white hover:bg-green-900 shadow"
                    >
                      Check-Out Guest
                    </button>
                  )}
                  
                  {/* Cancellation Action - Only if not Checked Out/Cancelled */}
                  {selectedBooking.status !== "Checked Out" && selectedBooking.status !== "Cancelled" && (
                    <button
                      onClick={() => setShowCancelConfirm(true)}
                      className="rounded-lg border border-red-200 px-3 py-2.5 text-xs font-semibold text-red-750 hover:bg-red-50"
                    >
                      Cancel Reservation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
