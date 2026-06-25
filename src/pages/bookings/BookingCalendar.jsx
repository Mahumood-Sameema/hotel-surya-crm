import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  Bed, 
  Plus, 
  Info,
  X,
  AlertCircle
} from "lucide-react";
import { 
  getRooms, 
  getBookings, 
  getGuests, 
  getRoomTypes 
} from "../../services/pmsDbService";

export default function BookingCalendar() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  // Time Window State (defaults to starting today, showing 10 days)
  const [startDate, setStartDate] = useState(new Date());
  const [daysCount] = useState(10);
  const [dateList, setDateList] = useState([]);

  // Selected details modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  const loadData = async () => {
    try {
      const [r, b, g, rt] = await Promise.all([
        getRooms(),
        getBookings(),
        getGuests(),
        getRoomTypes()
      ]);
      // Sort rooms by roomNumber
      setRooms(r.sort((a,b) => a.roomNumber.localeCompare(b.roomNumber)));
      setBookings(b.filter(x => x.status !== "Cancelled")); // Ignore cancelled in Gantt
      setGuests(g);
      setRoomTypes(rt);
    } catch (e) {
      console.error("Calendar failed to load data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Recalculate date range when startDate changes
  useEffect(() => {
    const dates = [];
    for (let i = 0; i < daysCount; i++) {
      const temp = new Date(startDate);
      temp.setDate(startDate.getDate() + i);
      dates.push(temp);
    }
    setDateList(dates);
  }, [startDate, daysCount]);

  const changeDateOffset = (offset) => {
    const nextDate = new Date(startDate);
    nextDate.setDate(startDate.getDate() + offset);
    setStartDate(nextDate);
  };

  const resetToToday = () => {
    setStartDate(new Date());
  };

  const getGuestName = (guestId) => {
    const g = guests.find(guest => guest.guestId === guestId);
    return g ? g.fullName : "Unknown Guest";
  };

  const getRoomTypeName = (roomTypeId) => {
    const rt = roomTypes.find(t => t.roomTypeId === roomTypeId);
    return rt ? rt.name : "Unknown Type";
  };

  // Find if there is a booking for a specific room and date
  const getBookingForRoomDate = (roomId, date) => {
    const dateStr = date.toISOString().split("T")[0];
    
    // Find booking where date falls between checkInDate (inclusive) and checkOutDate (exclusive)
    return bookings.find(b => {
      if (b.roomId !== roomId) return false;
      const inDate = new Date(b.checkInDate);
      const outDate = new Date(b.checkOutDate);
      
      const checkDate = new Date(dateStr);
      
      // We check inclusive of checkIn, exclusive of checkOut (since check out day afternoon the room is free)
      return checkDate >= inDate && checkDate < outDate;
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Checked In":
        return "bg-green-600 hover:bg-green-700 text-white";
      case "Confirmed":
        return "bg-blue-600 hover:bg-blue-750 text-white";
      default:
        return "bg-gray-400 hover:bg-gray-500 text-white";
    }
  };

  // Formats date headers
  const formatDateHeader = (d) => {
    const day = d.toLocaleDateString("en-IN", { weekday: "short" });
    const dateNum = d.getDate();
    const month = d.toLocaleDateString("en-IN", { month: "short" });
    return { day, dateNum, month, isToday: d.toDateString() === new Date().toDateString() };
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
      {/* Header controls */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Room Timeline (Gantt)</h1>
          <p className="pms-page-header-subtitle">Visual occupancy dashboard for room reservations and blocks</p>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button 
            onClick={() => changeDateOffset(-daysCount)} 
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
            title="Previous Period"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button 
            onClick={resetToToday} 
            className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Today
          </button>
          <button 
            onClick={() => changeDateOffset(daysCount)} 
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50"
            title="Next Period"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 ml-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span>
              {dateList[0]?.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} - {dateList[daysCount-1]?.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-500 shadow-sm font-medium">
        <span className="font-semibold text-gray-700 uppercase tracking-wider text-2xs mr-2">Legend:</span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-green-600"></div>
          <span>Checked In (Occupied)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-blue-600"></div>
          <span>Confirmed (Reserved)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded border border-gray-200 bg-gray-50"></div>
          <span>Available Room Slot</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-yellow-500"></div>
          <span>Maintenance / Out of Order (Under Grid)</span>
        </div>
      </div>

      {/* Gantt Timeline Grid Wrapper */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Timeline Header Row */}
            <div className="grid grid-cols-12 border-b border-gray-200 bg-gray-50 text-center text-xs text-gray-500 font-semibold uppercase tracking-wider divide-x divide-gray-200">
              {/* Room Info Cell */}
              <div className="col-span-2 py-4 text-left pl-6 flex items-center gap-2">
                <Bed className="h-4 w-4 text-gray-400" /> Room
              </div>
              
              {/* Date Cells */}
              {dateList.map((d, idx) => {
                const header = formatDateHeader(d);
                return (
                  <div 
                    key={idx} 
                    className={`py-2 flex flex-col justify-center items-center ${header.isToday ? "bg-red-50/70 text-red-900 border-x-red-200" : ""}`}
                  >
                    <span className="text-3xs tracking-wider">{header.day}</span>
                    <span className="text-sm font-bold mt-0.5">{header.dateNum}</span>
                    <span className="text-4xs text-gray-400 font-normal">{header.month}</span>
                  </div>
                );
              })}
            </div>

            {/* Room Rows */}
            <div className="divide-y divide-gray-250">
              {rooms.map((room) => (
                <div key={room.roomId} className="grid grid-cols-12 items-stretch divide-x divide-gray-150 group">
                  
                  {/* Room Label Cell */}
                  <div className="col-span-2 px-6 py-4 flex items-center justify-between bg-gray-50/50">
                    <div>
                      <div className="font-bold text-gray-900">Room {room.roomNumber}</div>
                      <div className="text-3xs text-gray-500">{getRoomTypeName(room.roomTypeId)}</div>
                    </div>
                    {room.status === "maintenance" && (
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-4xs font-semibold text-amber-800 uppercase">Ooo</span>
                    )}
                  </div>

                  {/* Day Columns */}
                  {dateList.map((d, dIdx) => {
                    const booking = getBookingForRoomDate(room.roomId, d);
                    const isToday = d.toDateString() === new Date().toDateString();
                    const dateStr = d.toISOString().split("T")[0];

                    if (booking) {
                      // Check if this is the start of the booking segment in our view
                      const isCheckInDay = booking.checkInDate === dateStr;
                      const guestName = getGuestName(booking.guestId);

                      return (
                        <div 
                          key={dIdx} 
                          className={`relative p-1 flex items-stretch ${isToday ? "bg-red-50/20" : ""}`}
                        >
                          <button
                            onClick={() => setSelectedBooking(booking)}
                            className={`w-full rounded px-2 py-1 text-left text-3xs font-semibold transition-all shadow-sm flex flex-col justify-between truncate select-none ${getStatusColor(booking.status)}`}
                          >
                            <span className="block truncate leading-tight font-bold">
                              {isCheckInDay || dIdx === 0 ? guestName : ""}
                            </span>
                            <span className="block text-4xs font-mono font-normal opacity-90">
                              {isCheckInDay || dIdx === 0 ? booking.bookingId : ""}
                            </span>
                          </button>
                        </div>
                      );
                    }

                    // Empty Block - click to book
                    return (
                      <div 
                        key={dIdx} 
                        className={`relative group/cell hover:bg-red-50/30 transition-colors p-1 flex items-stretch ${isToday ? "bg-red-50/20" : ""}`}
                      >
                        <button
                          onClick={() => navigate(`/bookings/create?roomTypeId=${room.roomTypeId}&checkIn=${dateStr}`)}
                          className="w-full h-full rounded border border-transparent hover:border-dashed hover:border-red-300 flex items-center justify-center text-transparent hover:text-red-800 hover:bg-white/80 transition-all font-semibold text-3xs"
                        >
                          <Plus className="h-3 w-3 mr-0.5" /> Book
                        </button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Booking Details Modal Popup overlay */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-3xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-gray-200 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-150 pb-3">
              <div>
                <span className="text-4xs font-bold text-gray-400 uppercase tracking-widest font-mono">Gantt Details</span>
                <h3 className="font-serif text-lg font-bold text-gray-900 mt-0.5">{selectedBooking.bookingId}</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-semibold">Guest Profile:</span>
                <span className="font-bold text-gray-950">{getGuestName(selectedBooking.guestId)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-semibold">Assigned Room:</span>
                <span className="font-bold text-gray-950">Room {selectedBooking.roomId} ({getRoomTypeName(selectedBooking.roomTypeId)})</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-semibold">Stay Period:</span>
                <span>{selectedBooking.checkInDate} to {selectedBooking.checkOutDate}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-semibold">Stay Duration:</span>
                <span className="font-semibold text-gray-900">{selectedBooking.nightsCount} Night(s)</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 pb-2">
                <span className="font-semibold">Status:</span>
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${selectedBooking.status === "Checked In" ? "bg-green-150 text-green-800" : "bg-blue-150 text-blue-800"}`}>
                  {selectedBooking.status}
                </span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold text-gray-900">
                <span>Grand Total:</span>
                <span className="text-red-800">₹{selectedBooking.grandTotal}</span>
              </div>
              <div className="flex justify-between font-bold text-amber-850">
                <span>Balance Due:</span>
                <span>₹{selectedBooking.balanceDue}</span>
              </div>
            </div>

            <div className="flex gap-3 border-t border-gray-150 pt-4 text-xs font-semibold">
              <button
                onClick={() => {
                  setSelectedBooking(null);
                  navigate("/bookings");
                }}
                className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-center text-gray-700 hover:bg-gray-50"
              >
                View Ledger
              </button>
              
              {selectedBooking.status === "Confirmed" && (
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    navigate(`/operations/check-in?bookingId=${selectedBooking.bookingId}`);
                  }}
                  className="flex-1 rounded-lg bg-red-800 py-2 text-center text-white hover:bg-red-900"
                >
                  Check In
                </button>
              )}
              {selectedBooking.status === "Checked In" && (
                <button
                  onClick={() => {
                    setSelectedBooking(null);
                    navigate(`/operations/check-out?bookingId=${selectedBooking.bookingId}`);
                  }}
                  className="flex-1 rounded-lg bg-green-800 py-2 text-center text-white hover:bg-green-900"
                >
                  Check Out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
