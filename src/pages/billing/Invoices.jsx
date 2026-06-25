import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Eye, 
  Printer, 
  FileText, 
  ChevronRight 
} from "lucide-react";
import { 
  getInvoices, 
  getGuests, 
  getBookings 
} from "../../services/pmsDbService";

export default function Invoices() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [guests, setGuests] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = async () => {
    try {
      const [invList, gList, bList] = await Promise.all([
        getInvoices(),
        getGuests(),
        getBookings()
      ]);
      // Sort invoices by date descending
      setInvoices(invList.sort((a,b) => new Date(b.invoiceDate) - new Date(a.invoiceDate)));
      setGuests(gList);
      setBookings(bList);
    } catch (e) {
      console.error("Invoices failed to load:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getGuestName = (guestId) => {
    const g = guests.find(guest => guest.guestId === guestId);
    return g ? g.fullName : "Unknown Guest";
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "Partial":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Unpaid":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const guestName = getGuestName(inv.guestId).toLowerCase();
    const searchMatch = 
      inv.invoiceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guestName.includes(searchQuery.toLowerCase());

    const statusMatch = statusFilter === "all" || inv.status === statusFilter;

    return searchMatch && statusMatch;
  });

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
          <h1 className="pms-page-header-title">Tax Invoices</h1>
          <p className="pms-page-header-subtitle">Registry of generated GST invoices, stay billing folios, and printables</p>
        </div>
      </div>

      {/* Filter panel */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice number, reservation, guest..."
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
            <option value="all">All Invoice Statuses</option>
            <option value="Paid">Paid (Settled)</option>
            <option value="Partial">Partial (Balance Due)</option>
            <option value="Unpaid">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Invoice ID</th>
                <th className="px-6 py-4">Booking Ref</th>
                <th className="px-6 py-4">Guest</th>
                <th className="px-6 py-4">Invoice Date</th>
                <th className="px-6 py-4 text-right">Grand Total</th>
                <th className="px-6 py-4 text-right">Paid</th>
                <th className="px-6 py-4 text-right">Balance Due</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map(inv => (
                  <tr key={inv.invoiceId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-gray-900 text-xs">
                      {inv.invoiceId}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-xs text-red-800">
                      {inv.bookingId}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {getGuestName(inv.guestId)}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {inv.invoiceDate}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-950">
                      ₹{inv.grandTotal}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-green-700">
                      ₹{inv.paidAmount}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${inv.balanceDue > 0 ? "text-amber-800" : "text-green-800"}`}>
                        ₹{inv.balanceDue}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${getStatusBadgeColor(inv.status)}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => navigate(`/billing/invoices/${inv.invoiceId}`)}
                          className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-red-800 transition-colors"
                          title="Print / View Invoice"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-400">
                    No invoices matching current selection criteria.
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
