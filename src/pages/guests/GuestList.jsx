import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Eye, Download, Star } from "lucide-react";
import { getGuests } from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function GuestList() {
  const navigate = useNavigate();
  const { user, hasPermission } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");

  const loadData = async () => {
    try {
      const g = await getGuests();
      setGuests(g);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportCSV = () => {
    const headers = ["Guest ID", "Full Name", "Phone", "Email", "City", "State", "Stays Count", "Total Spent", "VIP status"];
    const rows = filteredGuests.map(g => [
      g.guestId,
      g.fullName,
      g.phone,
      g.email || "N/A",
      g.city || "N/A",
      g.state || "N/A",
      g.totalStays || 0,
      g.totalSpent || 0,
      g.isVip ? "Yes" : "No"
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "hotel_surya_guests.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredGuests = guests.filter(g => {
    const q = searchQuery.toLowerCase();
    const matchSearch = q === "" ||
      g.fullName.toLowerCase().includes(q) ||
      g.phone.includes(q) ||
      (g.email && g.email.toLowerCase().includes(q)) ||
      (g.idNumber && g.idNumber.toLowerCase().includes(q));

    const matchCity = cityFilter === "all" || g.city === cityFilter;

    let matchTag = true;
    if (tagFilter === "vip") matchTag = g.isVip;
    else if (tagFilter === "repeat") matchTag = (g.totalStays || 0) > 1;
    else if (tagFilter === "first") matchTag = (g.totalStays || 0) <= 1;

    return matchSearch && matchCity && matchTag;
  });

  const cities = [...new Set(guests.map(g => g.city).filter(Boolean))];

  const totalCount = guests.length;
  const repeatCount = guests.filter(g => (g.totalStays || 0) > 1).length;
  const spentSum = guests.reduce((sum, g) => sum + (g.totalSpent || 0), 0);

  const getAvatarStyle = (guest) => {
    if (guest.isVip) return "bg-[#B71C1C] text-white";
    const idx = guest.fullName.length % 5;
    const colors = [
      "bg-blue-600 text-white",
      "bg-teal-600 text-white",
      "bg-orange-600 text-white",
      "bg-indigo-600 text-white",
      "bg-purple-600 text-white"
    ];
    return colors[idx];
  };

  const getInitials = (name) => {
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  if (loading && guests.length === 0) {
    return <div className="p-8 text-center text-slate-400 font-bold">Loading guests directory...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">

      {/* Page Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Guest Ledger Database</h1>
          <p className="pms-page-header-subtitle">Manage guest directory, histories, VIP designations, and contact logs</p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="border border-slate-200 hover:bg-slate-50 text-slate-600 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center space-x-1"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => navigate("/guests/new")}
            className="bg-[#B71C1C] hover:bg-[#9B1515] text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow flex items-center space-x-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New Guest Profile</span>
          </button>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-premium flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Registered Guests</span>
          <span className="text-2xl font-black text-slate-850 mt-2">{totalCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-premium flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase">Repeat stayers</span>
          <span className="text-2xl font-black text-slate-850 mt-2">{repeatCount}</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-premium flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase font-sans">Total Spent</span>
          <span className="text-2xl font-black text-slate-850 mt-2">₹{spentSum.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-premium flex flex-col lg:flex-row lg:items-center justify-between gap-4">

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Name, Phone, Email, ID Number"
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <select
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Guests</option>
            <option value="vip">VIP Guests Only</option>
            <option value="repeat">Repeat stayers</option>
            <option value="first">First Time Guests</option>
          </select>

          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Cities</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* GUEST MATRIX */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-premium overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
              <th className="py-3 px-4">Avatar</th>
              <th className="py-3 px-4">Guest ID</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Phone Number</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">City</th>
              <th className="py-3 px-4 text-center">Total Stays</th>
              <th className="py-3 px-4 text-right">Total Spent</th>
              <th className="py-3 px-4">Badges</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {filteredGuests.map(guest => {
              const avatarStyle = getAvatarStyle(guest);
              return (
                <tr key={guest.guestId} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${avatarStyle}`}>
                      {getInitials(guest.fullName)}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-slate-400">{guest.guestId}</td>
                  <td className="py-3 px-4 font-bold text-slate-800 hover:text-[#B71C1C] cursor-pointer" onClick={() => navigate(`/guests/${guest.guestId}`)}>
                    {guest.fullName}
                  </td>
                  <td className="py-3 px-4">{guest.phone}</td>
                  <td className="py-3 px-4 text-slate-500">{guest.email || "—"}</td>
                  <td className="py-3 px-4">{guest.city || "—"}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{guest.totalStays || 0}</td>
                  <td className="py-3 px-4 text-right font-extrabold text-[#B71C1C]">₹{(guest.totalSpent || 0).toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4">
                    <div className="flex space-x-1">
                      {guest.isVip && (
                        <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-800 text-[8px] font-black uppercase flex items-center">
                          <Star className="h-2 w-2 mr-0.5 fill-yellow-800" /> VIP
                        </span>
                      )}
                      {(guest.totalStays || 0) > 1 && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[8px] font-black uppercase">
                          Repeat
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center space-x-2">
                    <button
                      onClick={() => navigate(`/guests/${guest.guestId}`)}
                      className="text-slate-500 hover:text-slate-700 font-semibold inline-flex items-center"
                    >
                      <Eye className="h-3.5 w-3.5 mr-0.5" /> Profile
                    </button>
                    <button
                      onClick={() => navigate(`/bookings/create?guestId=${guest.guestId}`)}
                      className="text-[#B71C1C] hover:text-[#9B1515] font-bold"
                    >
                      New Booking
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
