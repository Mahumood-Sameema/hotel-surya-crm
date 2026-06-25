import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bed,
  ArrowDownLeft,
  ArrowUpRight,
  IndianRupee,
  Clock,
  TrendingUp,
  AlertCircle,
  FileText
} from "lucide-react";
import {
  getRooms,
  getBookings,
  getPayments,
  getBookingRequests,
  getGuests
} from "../services/pmsDbService";

export default function Dashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    roomsOccupied: 0,
    totalRooms: 0,
    checkinsToday: 0,
    checkoutsToday: 0,
    pendingPayments: 0,
    revenueToday: 0,
    pendingRequests: 0
  });

  const [checkinsList, setCheckinsList] = useState([]);
  const [checkoutsList, setCheckoutsList] = useState([]);
  const [roomStatusCounts, setRoomStatusCounts] = useState({
    available: 0,
    occupied: 0,
    reserved: 0,
    cleaning: 0,
    maintenance: 0
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const rooms = await getRooms();
        const bookings = await getBookings();
        const payments = await getPayments();
        const requests = await getBookingRequests();
        const guests = await getGuests();

        const todayStr = new Date().toISOString().split("T")[0];

        // 1. KPI Calculations
        const totalRooms = rooms.length;
        const occupiedRoomsCount = rooms.filter(r => r.status === "occupied").length;

        const checkinsTodayList = bookings.filter(b => b.checkInDate === todayStr && b.status === "Confirmed");
        const checkoutsTodayList = bookings.filter(b => b.checkOutDate === todayStr && b.status === "Checked In");

        const pendingRequests = requests.filter(r => r.status === "Pending").length;

        const revenueToday = payments
          .filter(p => p.status === "Completed" && p.paymentDate.split("T")[0] === todayStr)
          .reduce((sum, p) => sum + p.amount, 0);

        const pendingPayments = bookings
          .filter(b => b.status === "Checked In" || b.status === "Confirmed")
          .reduce((sum, b) => sum + (b.balanceDue || 0), 0);

        setStats({
          roomsOccupied: occupiedRoomsCount,
          totalRooms,
          checkinsToday: checkinsTodayList.length,
          checkoutsToday: checkoutsTodayList.length,
          pendingPayments,
          revenueToday,
          pendingRequests
        });

        // 2. Room Status counts
        const counts = { available: 0, occupied: 0, reserved: 0, cleaning: 0, maintenance: 0 };
        rooms.forEach(r => {
          if (counts[r.status] !== undefined) counts[r.status]++;
        });
        setRoomStatusCounts(counts);

        // 3. Arrivals / Departures lists
        const enrichedCheckins = checkinsTodayList.map(b => {
          const guest = guests.find(g => g.guestId === b.guestId);
          return {
            bookingId: b.bookingId,
            guestName: guest ? guest.fullName : "Unknown Guest",
            roomNumber: b.roomId,
            expectedTime: "12:00 PM",
            status: b.status
          };
        });
        setCheckinsList(enrichedCheckins);

        const enrichedCheckouts = checkoutsTodayList.map(b => {
          const guest = guests.find(g => g.guestId === b.guestId);
          return {
            bookingId: b.bookingId,
            guestName: guest ? guest.fullName : "Unknown Guest",
            roomNumber: b.roomId,
            balanceDue: b.balanceDue || 0
          };
        });
        setCheckoutsList(enrichedCheckouts);

        // 4. Pending Tasks
        const tasks = [];
        const cleaningCount = rooms.filter(r => r.status === "cleaning").length;
        if (cleaningCount > 0) {
          tasks.push({
            id: "t1",
            text: `${cleaningCount} room(s) pending cleaning`,
            link: "/rooms/grid",
            type: "cleaning"
          });
        }
        const pendingConfirm = bookings.filter(b => b.status === "Pending").length;
        if (pendingConfirm > 0) {
          tasks.push({
            id: "t2",
            text: `${pendingConfirm} unconfirmed booking(s)`,
            link: "/bookings",
            type: "alert"
          });
        }
        if (pendingRequests > 0) {
          tasks.push({
            id: "t3",
            text: `${pendingRequests} pending website request(s)`,
            link: "/website/requests",
            type: "website"
          });
        }
        if (checkoutsTodayList.length > 0) {
          tasks.push({
            id: "t4",
            text: `${checkoutsTodayList.length} guest check-out(s) due today`,
            link: "/operations/check-out",
            type: "checkout"
          });
        }
        setPendingTasks(tasks);

        // 5. Recent Bookings
        const recent = bookings
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10)
          .map(b => {
            const guest = guests.find(g => g.guestId === b.guestId);
            return {
              ...b,
              guestName: guest ? guest.fullName : "Walk-in Guest"
            };
          });
        setRecentBookings(recent);

        // 6. Last 7 Days Revenue
        const revenueTrend = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateStr = d.toISOString().split("T")[0];

          const dailyTotal = payments
            .filter(p => p.status === "Completed" && p.paymentDate.split("T")[0] === dateStr)
            .reduce((sum, p) => sum + p.amount, 0);

          revenueTrend.push({
            label: d.toLocaleDateString([], { weekday: 'short' }),
            value: dailyTotal,
            date: dateStr
          });
        }
        setWeeklyRevenue(revenueTrend);

      } catch (err) {
        console.error("Dashboard failed to load:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    console.log("Dashboard Render");
    return (
      
      <div className="w-full min-w-0 max-w-full space-y-6 animate-pulse">

        {/* Header Skeleton */}
        <div className="pms-page-header">
          <div>
            <div className="h-8 w-64 bg-slate-200 rounded"></div>
            <div className="h-4 w-96 bg-slate-200 rounded mt-2"></div>
          </div>
        </div>

        {/* KPI Skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white h-24 rounded-xl border border-slate-200 shimmer"
            />
          ))}
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white h-80 rounded-xl border border-slate-200 shimmer" />
          <div className="bg-white h-80 rounded-xl border border-slate-200 shimmer" />
        </div>

      </div>
    );
  }
  const donutTotal = Object.values(roomStatusCounts).reduce((a, b) => a + b, 0);
  const getDonutSegments = () => {
    let accumulated = 0;
    const colors = {
      available: "#2E7D32",
      occupied: "#B71C1C",
      reserved: "#FBC02D",
      cleaning: "#1976D2",
      maintenance: "#9E9E9E"
    };

    return Object.entries(roomStatusCounts).map(([status, val]) => {
      if (val === 0) return null;
      const percentage = (val / donutTotal) * 100;
      const offset = (accumulated / donutTotal) * 100;
      accumulated += val;
      return {
        status,
        value: val,
        color: colors[status],
        percentage,
        offset
      };
    }).filter(Boolean);
  };

  const donutSegments = getDonutSegments();

  return (
    <div className="w-full min-w-0 max-w-full space-y-6 pt-2">

      {/* Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">
            Dashboard Overview
          </h1>

          <p className="pms-page-header-subtitle">
            Real-time occupancy metrics, daily tasks, and financial summary
          </p>
        </div>
      </div>

      {/* ROW 1: KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Rooms Occupied */}
        <div
          onClick={() => navigate("/rooms/grid")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-premium hover:shadow-premium-hover cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Rooms Occupied</span>
            <div className="h-9 w-9 rounded-full bg-red-50 flex items-center justify-center text-[#B71C1C] shrink-0">
              <Bed className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline">
              <span className="text-2xl font-extrabold text-slate-800 leading-none">{stats.roomsOccupied}</span>
              <span className="text-xs font-semibold text-slate-400 ml-1">/ {stats.totalRooms}</span>
            </div>
            <p className="text-[10px] text-slate-450 mt-1 font-medium">Live occupancy map</p>
          </div>
        </div>

        {/* Check-Ins Today */}
        <div
          onClick={() => navigate("/operations/check-in")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-premium hover:shadow-premium-hover cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Check-Ins Today</span>
            <div className="h-9 w-9 rounded-full bg-blue-50 flex items-center justify-center text-[#1976D2] shrink-0">
              <ArrowDownLeft className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800 leading-none">{stats.checkinsToday}</span>
            <p className="text-[10px] text-slate-455 mt-1.5 font-medium">Arrivals checklists</p>
          </div>
        </div>

        {/* Check-Outs Today */}
        <div
          onClick={() => navigate("/operations/check-out")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-premium hover:shadow-premium-hover cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Check-Outs Today</span>
            <div className="h-9 w-9 rounded-full bg-amber-50 flex items-center justify-center text-[#F57C00] shrink-0">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800 leading-none">{stats.checkoutsToday}</span>
            <p className="text-[10px] text-slate-455 mt-1.5 font-medium">Departures checklists</p>
          </div>
        </div>

        {/* Pending Payments */}
        <div
          onClick={() => navigate("/billing/invoices")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-premium hover:shadow-premium-hover cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance Due</span>
            <div className="h-9 w-9 rounded-full bg-rose-50 flex items-center justify-center text-[#D32F2F] shrink-0">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800 leading-none">₹{stats.pendingPayments.toLocaleString("en-IN")}</span>
            <p className="text-[10px] text-slate-455 mt-1.5 font-medium">Outstanding balances</p>
          </div>
        </div>

        {/* Revenue Today */}
        <div
          onClick={() => navigate("/billing/payments")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-premium hover:shadow-premium-hover cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Today</span>
            <div className="h-9 w-9 rounded-full bg-green-50 flex items-center justify-center text-[#2E7D32] shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800 leading-none">₹{stats.revenueToday.toLocaleString("en-IN")}</span>
            <p className="text-[10px] text-slate-455 mt-1.5 font-medium">Today's collection</p>
          </div>
        </div>

        {/* Website Requests */}
        <div
          onClick={() => navigate("/website/requests")}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-premium hover:shadow-premium-hover cursor-pointer transition-all flex flex-col justify-between"
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Web Requests</span>
            <div className="h-9 w-9 rounded-full bg-yellow-50 flex items-center justify-center text-[#F5B921] shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-slate-800 leading-none">{stats.pendingRequests}</span>
            <p className="text-[10px] text-slate-455 mt-1.5 font-medium">Unresolved website leads</p>
          </div>
        </div>
      </div>

      {/* ROW 2: ACTIVITY & ROOM INVENTORY DONUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-premium p-5 flex flex-col h-[340px]">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
            Today's FrontDesk Activity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-grow overflow-hidden">
            <div className="flex flex-col h-full overflow-hidden">
              <h4 className="text-xs font-bold text-[#1976D2] uppercase tracking-wider flex items-center mb-2">
                <ArrowDownLeft className="h-4 w-4 mr-1" />
                Arrivals Pending
              </h4>
              <div className="flex-grow overflow-y-auto pr-1">
                {checkinsList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-450">No check-ins left today</div>
                ) : (
                  <div className="space-y-2">
                    {checkinsList.map(item => (
                      <div key={item.bookingId} className="p-2.5 border border-slate-100 rounded-lg flex items-center justify-between hover:bg-slate-50 text-xs">
                        <div>
                          <p className="font-bold text-slate-700">{item.guestName}</p>
                          <p className="text-[10px] text-slate-400">Room {item.roomNumber || "Unassigned"}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/operations/check-in?bookingId=${item.bookingId}`)}
                          className="bg-[#1976D2] hover:bg-[#1565C0] text-white font-semibold py-1 px-2.5 rounded-md text-[10px] shadow"
                        >
                          Check In
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col h-full overflow-hidden">
              <h4 className="text-xs font-bold text-[#F57C00] uppercase tracking-wider flex items-center mb-2">
                <ArrowUpRight className="h-4 w-4 mr-1" />
                Departures Pending
              </h4>
              <div className="flex-grow overflow-y-auto pr-1">
                {checkoutsList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-455">No check-outs left today</div>
                ) : (
                  <div className="space-y-2">
                    {checkoutsList.map(item => (
                      <div key={item.bookingId} className="p-2.5 border border-slate-100 rounded-lg flex items-center justify-between hover:bg-slate-50 text-xs">
                        <div>
                          <p className="font-bold text-slate-700">{item.guestName}</p>
                          <p className="text-[10px] text-red-500">Room {item.roomNumber} - Due: ₹{item.balanceDue}</p>
                        </div>
                        <button
                          onClick={() => navigate(`/operations/check-out?roomId=${item.roomNumber}`)}
                          className="bg-[#F57C00] hover:bg-[#E65100] text-white font-semibold py-1 px-2.5 rounded-md text-[10px] shadow"
                        >
                          Check Out
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-premium p-5 flex flex-col h-[340px]">
          <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
            Room Inventory Status
          </h3>

          <div className="flex items-center space-x-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="3.5" />
                {donutSegments.map((seg, idx) => {
                  const circumference = 2 * Math.PI * 15.915;
                  const dashStroke = (seg.value / donutTotal) * circumference;
                  const dashSpace = circumference - dashStroke;
                  const offset = (donutSegments.slice(0, idx).reduce((s, item) => s + item.value, 0) / donutTotal) * circumference;

                  return (
                    <circle
                      key={seg.status}
                      cx="18"
                      cy="18"
                      r="15.915"
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="3.5"
                      strokeDasharray={`${dashStroke} ${dashSpace}`}
                      strokeDashoffset={-offset}
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-slate-800">{donutTotal}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Rooms</span>
              </div>
            </div>

            <div className="text-xs space-y-1.5 flex-grow">
              <div className="flex items-center justify-between text-slate-605">
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#2E7D32] mr-2"></span>Available</span>
                <span className="font-bold">{roomStatusCounts.available}</span>
              </div>
              <div className="flex items-center justify-between text-slate-605">
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#B71C1C] mr-2"></span>Occupied</span>
                <span className="font-bold">{roomStatusCounts.occupied}</span>
              </div>
              <div className="flex items-center justify-between text-slate-605">
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#FBC02D] mr-2"></span>Reserved</span>
                <span className="font-bold">{roomStatusCounts.reserved}</span>
              </div>
              <div className="flex items-center justify-between text-slate-605">
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#1976D2] mr-2"></span>Cleaning</span>
                <span className="font-bold">{roomStatusCounts.cleaning}</span>
              </div>
              <div className="flex items-center justify-between text-slate-605">
                <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#9E9E9E] mr-2"></span>Maintenance</span>
                <span className="font-bold">{roomStatusCounts.maintenance}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex-grow overflow-y-auto border-t border-slate-100 pt-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Pending Tasks</h4>
            {pendingTasks.length === 0 ? (
              <p className="text-xs text-slate-400">All tasks completed!</p>
            ) : (
              <div className="space-y-1.5">
                {pendingTasks.map(task => (
                  <Link
                    key={task.id}
                    to={task.link}
                    className="flex items-center text-xs text-slate-600 hover:text-red-700 py-1 hover:bg-slate-50 px-1 rounded transition-colors"
                  >
                    <AlertCircle className="h-3.5 w-3.5 mr-2 text-red-500 shrink-0" />
                    <span className="truncate flex-grow">{task.text}</span>
                    <span className="text-[10px] font-bold text-[#B71C1C] shrink-0">Action &rarr;</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ROW 3: RECENT BOOKINGS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-premium p-5">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
          <h3 className="font-bold text-slate-805 text-sm uppercase tracking-wider">
            Latest Reservations Pipeline
          </h3>
          <Link to="/bookings" className="text-xs font-bold text-[#B71C1C] hover:underline">
            View Booking Registry
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                <th className="py-2.5 px-3">Booking ID</th>
                <th className="py-2.5 px-3">Guest Name</th>
                <th className="py-2.5 px-3">Room No.</th>
                <th className="py-2.5 px-3">Check-In</th>
                <th className="py-2.5 px-3">Check-Out</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentBookings.map(b => (
                <tr key={b.bookingId} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-bold text-[#B71C1C]">{b.bookingId}</td>
                  <td className="py-2 px-3 font-medium">{b.guestName}</td>
                  <td className="py-2 px-3">Room {b.roomId || "Unassigned"}</td>
                  <td className="py-2 px-3">{b.checkInDate}</td>
                  <td className="py-2 px-3">{b.checkOutDate}</td>
                  <td className="py-2 px-3 text-right font-semibold">₹{b.grandTotal.toLocaleString("en-IN")}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status === "Checked In" ? "bg-green-100 text-green-800" :
                      b.status === "Confirmed" ? "bg-blue-100 text-blue-800" :
                        b.status === "Checked Out" ? "bg-gray-100 text-gray-800" :
                          b.status === "Pending" ? "bg-amber-100 text-amber-800" :
                            "bg-red-100 text-red-800"
                      }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center space-x-1">
                    {b.status === "Confirmed" && (
                      <button
                        onClick={() => navigate(`/operations/check-in?bookingId=${b.bookingId}`)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-0.5 px-2 rounded text-[10px] shadow"
                      >
                        Check-In
                      </button>
                    )}
                    {b.status === "Checked In" && (
                      <button
                        onClick={() => navigate(`/operations/check-out?roomId=${b.roomId}`)}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-0.5 px-2 rounded text-[10px] shadow"
                      >
                        Check-Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROW 4: 7-DAY REVENUE BAR CHART */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-premium p-5">
        <h3 className="font-bold text-slate-850 text-sm uppercase tracking-wider border-b border-slate-100 pb-3 mb-4">
          7-Day Collection & Revenue Trend
        </h3>

        <div className="relative h-64 w-full flex items-end justify-between px-6 pt-6 pb-2 border-b border-slate-100">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none px-6 pt-6 pb-8">
            <div className="w-full border-t border-dashed border-slate-100"></div>
            <div className="w-full border-t border-dashed border-slate-100"></div>
            <div className="w-full border-t border-dashed border-slate-100"></div>
            <div className="w-full border-t border-dashed border-slate-100"></div>
          </div>

          {(() => {
            const maxVal = Math.max(...weeklyRevenue.map(d => d.value), 1000);
            return weeklyRevenue.map((d, index) => {
              const heightPercent = (d.value / maxVal) * 100;
              return (
                <div key={index} className="flex flex-col items-center flex-grow group relative h-full justify-end">
                  <div className="absolute bottom-full mb-2 bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity shadow z-10">
                    ₹{d.value.toLocaleString("en-IN")}
                  </div>
                  <div
                    style={{ height: `${Math.max(5, heightPercent)}%` }}
                    className="w-8 sm:w-12 bg-[#B71C1C] hover:bg-[#FBC02D] rounded-t-md transition-all duration-500 shadow cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-400 mt-2 block">{d.label}</span>
                </div>
              );
            });
          })()}
        </div>
      </div>

    </div>
  );
}
