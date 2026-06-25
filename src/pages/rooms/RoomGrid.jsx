import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Eye, 
  CheckSquare, 
  LogOut, 
  Wrench, 
  CheckCircle2, 
  Grid, 
  List, 
  Filter, 
  Info,
  AlertTriangle,
  X
} from "lucide-react";
import { 
  getRooms, 
  getRoomTypes, 
  getBookings, 
  getGuests, 
  updateRoomStatus 
} from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function RoomGrid() {
  const navigate = useNavigate();
  const { user, hasPermission } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  // Modal State
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [maintenanceReason, setMaintenanceReason] = useState("");

  const loadRoomData = async () => {
    try {
      const r = await getRooms();
      const rt = await getRoomTypes();
      const b = await getBookings();
      const g = await getGuests();
      setRooms(r);
      setRoomTypes(rt);
      setBookings(b);
      setGuests(g);
    } catch (err) {
      console.error("RoomGrid failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoomData();
  }, []);

  const filteredRooms = rooms.filter(r => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchFloor = floorFilter === "all" || String(r.floor) === floorFilter;
    const matchType = typeFilter === "all" || r.roomTypeId === typeFilter;
    return matchStatus && matchFloor && matchType;
  });

  const getStatusCounts = () => {
    const counts = { available: 0, occupied: 0, reserved: 0, cleaning: 0, maintenance: 0 };
    rooms.forEach(r => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });
    return counts;
  };
  const counts = getStatusCounts();

  const getRoomEnrichments = (room) => {
    const type = roomTypes.find(t => t.roomTypeId === room.roomTypeId);
    let activeBooking = null;
    let guestName = "";
    let checkOutDate = "";
    let checkInDate = "";
    let nightsRemaining = 0;
    let daysToArrival = 0;
    let balanceDue = 0;

    if (room.status === "occupied") {
      activeBooking = bookings.find(b => b.roomId === room.roomId && b.status === "Checked In");
      if (activeBooking) {
        const guest = guests.find(g => g.guestId === activeBooking.guestId);
        guestName = guest ? guest.fullName : "Unknown";
        checkOutDate = activeBooking.checkOutDate;
        balanceDue = activeBooking.balanceDue || 0;
        
        const diffTime = Math.abs(new Date(checkOutDate) - new Date());
        nightsRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    } else if (room.status === "reserved") {
      activeBooking = bookings.find(b => b.roomId === room.roomId && b.status === "Confirmed");
      if (activeBooking) {
        const guest = guests.find(g => g.guestId === activeBooking.guestId);
        guestName = guest ? guest.fullName : "Unknown";
        checkInDate = activeBooking.checkInDate;
        
        const diffTime = Math.abs(new Date(checkInDate) - new Date());
        daysToArrival = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    return {
      typeName: type ? type.name : "Standard",
      rate: type ? type.basePrice : 1499,
      guestName,
      checkOutDate,
      checkInDate,
      nightsRemaining,
      daysToArrival,
      balanceDue,
      bookingId: activeBooking ? activeBooking.bookingId : null
    };
  };

  const handleStatusTransition = async (room, nextStatus, reason = "") => {
    setLoading(true);
    try {
      await updateRoomStatus(room.roomId, nextStatus, reason, user);
      await loadRoomData();
      setSelectedRoom(null);
      setConfirmAction(null);
      setMaintenanceReason("");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const triggerTransitionConfirm = (room, nextStatus) => {
    if (nextStatus === "maintenance" && !hasPermission("admin")) {
      alert("Only managers can manually override rooms to maintenance status.");
      return;
    }
    setConfirmAction({ room, nextStatus });
  };

  const handleConfirmSubmit = () => {
    if (!confirmAction) return;
    const { room, nextStatus } = confirmAction;
    handleStatusTransition(room, nextStatus, nextStatus === "maintenance" ? maintenanceReason : "");
  };

  if (loading && rooms.length === 0) {
    return <div className="p-8 text-center text-slate-400 font-bold">Loading live room map...</div>;
  }

  const statusStyles = {
    available: { border: "border-t-[#2E7D32] border-l-[#2E7D32]", badge: "bg-green-100 text-green-800", dot: "bg-green-600" },
    occupied: { border: "border-t-[#B71C1C] border-l-[#B71C1C]", badge: "bg-red-100 text-red-800", dot: "bg-red-600" },
    reserved: { border: "border-t-[#FBC02D] border-l-[#FBC02D]", badge: "bg-yellow-100 text-yellow-800", dot: "bg-yellow-600" },
    cleaning: { border: "border-t-[#1976D2] border-l-[#1976D2]", badge: "bg-blue-100 text-blue-800", dot: "bg-blue-600" },
    maintenance: { border: "border-t-slate-500 border-l-slate-500", badge: "bg-slate-100 text-slate-800", dot: "bg-slate-500" }
  };

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      
      {/* Page Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Live Room Status Grid</h1>
          <p className="pms-page-header-subtitle">Real-time status grid mapping available, occupied, reserved, cleaning, and maintenance room flows</p>
        </div>
      </div>
      
      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1 text-slate-400 text-xs font-bold uppercase">
            <Filter className="h-4 w-4" />
            <span>Filter Grid</span>
          </div>
          
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Statuses</option>
            <option value="available">🟢 Available</option>
            <option value="occupied">🔴 Occupied</option>
            <option value="reserved">🟡 Reserved</option>
            <option value="cleaning">🔵 Cleaning</option>
            <option value="maintenance">⚫ Maintenance</option>
          </select>

          <select 
            value={floorFilter} 
            onChange={(e) => setFloorFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Floors</option>
            <option value="1">1st Floor (Ground)</option>
            <option value="2">2nd Floor</option>
            <option value="3">3rd Floor</option>
          </select>

          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Room Types</option>
            {roomTypes.map(t => (
              <option key={t.roomTypeId} value={t.roomTypeId}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-1 shrink-0 border border-slate-100 p-0.5 rounded-lg">
          <button 
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-md ${viewMode === "grid" ? "bg-red-50 text-[#B71C1C]" : "text-slate-400 hover:text-slate-650"}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setViewMode("list")}
            className={`p-1.5 rounded-md ${viewMode === "list" ? "bg-red-50 text-[#B71C1C]" : "text-slate-400 hover:text-slate-655"}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* LEGEND */}
      <div className="bg-slate-100 p-3 rounded-lg flex flex-wrap items-center justify-around text-xs gap-3 font-semibold text-slate-700">
        <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#2E7D32] mr-1.5"></span>Available ({counts.available})</span>
        <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#B71C1C] mr-1.5"></span>Occupied ({counts.occupied})</span>
        <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#FBC02D] mr-1.5"></span>Reserved ({counts.reserved})</span>
        <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#1976D2] mr-1.5"></span>Cleaning ({counts.cleaning})</span>
        <span className="flex items-center"><span className="h-2.5 w-2.5 rounded-full bg-[#9E9E9E] mr-1.5"></span>Maintenance ({counts.maintenance})</span>
      </div>

      {/* GRID BODY */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
          {filteredRooms.map(room => {
            const extra = getRoomEnrichments(room);
            const style = statusStyles[room.status] || statusStyles.available;

            return (
              <div 
                key={room.roomId}
                className={`bg-white rounded-xl shadow-premium hover:shadow-premium-hover border-t-8 border-l-4 transition-all duration-305 relative group flex flex-col justify-between h-[190px] cursor-pointer overflow-hidden ${style.border}`}
              >
                <div className="p-3" onClick={() => setSelectedRoom(room)}>
                  <div className="flex justify-between items-start">
                    <span className="text-2xl font-black text-slate-800 tracking-tighter">{room.roomNumber}</span>
                    <span className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded uppercase">
                      Fl {room.floor}
                    </span>
                  </div>
                  
                  <div className="text-[10px] text-slate-500 font-bold tracking-tight uppercase truncate mt-1">
                    {extra.typeName}
                  </div>
                  
                  <div className="mt-3 min-h-[40px] text-xs">
                    {room.status === "occupied" && (
                      <div className="text-red-700">
                        <p className="font-bold truncate">{extra.guestName}</p>
                        <p className="text-[10px] text-slate-400">Checkout: {extra.checkOutDate}</p>
                      </div>
                    )}
                    {room.status === "reserved" && (
                      <div className="text-yellow-700">
                        <p className="font-bold truncate">{extra.guestName}</p>
                        <p className="text-[10px] text-slate-400">Expected: {extra.checkInDate}</p>
                      </div>
                    )}
                    {room.status === "cleaning" && (
                      <p className="text-blue-700 font-medium italic animate-pulse">Cleaning in Progress</p>
                    )}
                    {room.status === "maintenance" && (
                      <p className="text-slate-600 font-medium truncate max-w-full" title={room.statusReason}>
                        {room.statusReason || "Under Maintenance"}
                      </p>
                    )}
                    {room.status === "available" && (
                      <p className="text-green-700 font-bold">₹{extra.rate}/night</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-100 p-2 bg-slate-50/50 flex justify-around items-center opacity-70 group-hover:opacity-100 transition-opacity">
                  {room.status === "available" && (
                    <>
                      <button onClick={() => setSelectedRoom(room)} title="View Detail" className="p-1 hover:bg-slate-200 rounded text-slate-500"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => navigate(`/operations/check-in?roomId=${room.roomNumber}`)} title="Check-In" className="p-1 hover:bg-green-100 rounded text-green-600"><CheckSquare className="h-4 w-4" /></button>
                      <button onClick={() => triggerTransitionConfirm(room, "maintenance")} title="Maintenance Override" className="p-1 hover:bg-slate-200 rounded text-slate-655"><Wrench className="h-4 w-4" /></button>
                    </>
                  )}
                  {room.status === "reserved" && (
                    <>
                      <button onClick={() => setSelectedRoom(room)} title="View Detail" className="p-1 hover:bg-slate-200 rounded text-slate-500"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => navigate(`/operations/check-in?bookingId=${extra.bookingId}`)} title="Check-In" className="p-1 hover:bg-green-100 rounded text-green-600"><CheckSquare className="h-4 w-4" /></button>
                      <button onClick={() => triggerTransitionConfirm(room, "maintenance")} title="Maintenance" className="p-1 hover:bg-slate-200 rounded text-slate-655"><Wrench className="h-4 w-4" /></button>
                    </>
                  )}
                  {room.status === "occupied" && (
                    <>
                      <button onClick={() => setSelectedRoom(room)} title="View Detail" className="p-1 hover:bg-slate-200 rounded text-slate-500"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => navigate(`/operations/check-out?roomId=${room.roomNumber}`)} title="Check-Out" className="p-1 hover:bg-orange-100 rounded text-orange-655"><LogOut className="h-4 w-4" /></button>
                      {hasPermission("admin") && (
                        <button onClick={() => triggerTransitionConfirm(room, "maintenance")} title="Override Maintenance" className="p-1 hover:bg-slate-200 rounded text-slate-600"><Wrench className="h-4 w-4" /></button>
                      )}
                    </>
                  )}
                  {room.status === "cleaning" && (
                    <>
                      <button onClick={() => setSelectedRoom(room)} title="View Detail" className="p-1 hover:bg-slate-200 rounded text-slate-500"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => triggerTransitionConfirm(room, "available")} title="Complete Cleaning" className="p-1 hover:bg-green-100 rounded text-green-600"><CheckCircle2 className="h-4 w-4" /></button>
                      <button onClick={() => triggerTransitionConfirm(room, "maintenance")} title="Maintenance" className="p-1 hover:bg-slate-200 rounded text-slate-655"><Wrench className="h-4 w-4" /></button>
                    </>
                  )}
                  {room.status === "maintenance" && (
                    <>
                      <button onClick={() => setSelectedRoom(room)} title="View Detail" className="p-1 hover:bg-slate-200 rounded text-slate-500"><Eye className="h-4 w-4" /></button>
                      <button onClick={() => triggerTransitionConfirm(room, "available")} title="Complete Maintenance" className="p-1 hover:bg-green-100 rounded text-green-600"><CheckCircle2 className="h-4 w-4" /></button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-premium overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                <th className="py-3 px-4">Room Number</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Stay Information</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredRooms.map(room => {
                const extra = getRoomEnrichments(room);
                const style = statusStyles[room.status] || statusStyles.available;
                
                return (
                  <tr key={room.roomId} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-bold text-slate-805">Room {room.roomNumber}</td>
                    <td className="py-3 px-4">Floor {room.floor}</td>
                    <td className="py-3 px-4">{extra.typeName}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${style.badge}`}>
                        {room.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {room.status === "occupied" && `In-House: ${extra.guestName} (check-out: ${extra.checkOutDate})`}
                      {room.status === "reserved" && `Reserved: ${extra.guestName} (arrival: ${extra.checkInDate})`}
                      {room.status === "cleaning" && "Housekeeping Review"}
                      {room.status === "maintenance" && (room.statusReason || "Maintenance checklist")}
                      {room.status === "available" && "Vacant"}
                    </td>
                    <td className="py-3 px-4 text-center space-x-2">
                      <button onClick={() => setSelectedRoom(room)} className="text-[#B71C1C] hover:underline font-bold">
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* QUICK VIEW MODAL */}
      {selectedRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-800">
            {(() => {
              const extra = getRoomEnrichments(selectedRoom);
              return (
                <>
                  <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-xl font-black text-slate-800">Room {selectedRoom.roomNumber} Details</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase">{extra.typeName} - Floor {selectedRoom.floor}</p>
                    </div>
                    <button onClick={() => setSelectedRoom(null)} className="p-1 hover:bg-slate-200 rounded-full">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase">Rate Per Night</span>
                        <span className="font-extrabold text-[#B71C1C] text-lg">₹{extra.rate}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase">Current Status</span>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${statusStyles[selectedRoom.status]?.badge}`}>
                          {selectedRoom.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center">
                        <Info className="h-4 w-4 mr-1 text-[#B71C1C]" />
                        Operational Details
                      </h4>
                      {selectedRoom.status === "available" && <p className="text-xs text-slate-600">This room is vacant, clean, and ready for guests.</p>}
                      {selectedRoom.status === "cleaning" && <p className="text-xs text-slate-600">Housekeeping has been requested. Resolve cleaning to make this room available for checkout.</p>}
                      {selectedRoom.status === "maintenance" && (
                        <div className="text-xs text-slate-650">
                          <p className="font-semibold text-red-650">Issue details:</p>
                          <p className="italic mt-1">"{selectedRoom.statusReason || "Not specified"}"</p>
                        </div>
                      )}
                      {(selectedRoom.status === "occupied" || selectedRoom.status === "reserved") && (
                        <div className="text-xs space-y-1 text-slate-600">
                          <p><strong className="text-slate-805">Guest:</strong> {extra.guestName}</p>
                          <p><strong className="text-slate-805">Reservation ID:</strong> {extra.bookingId}</p>
                          {selectedRoom.status === "occupied" ? (
                            <>
                              <p><strong className="text-slate-805">Check-Out:</strong> {extra.checkOutDate}</p>
                              <p><strong className="text-slate-805">Due Balance:</strong> ₹{extra.balanceDue}</p>
                            </>
                          ) : (
                            <p><strong className="text-slate-805">Check-In:</strong> {extra.checkInDate} ({extra.daysToArrival} days remaining)</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-bold text-slate-450 uppercase tracking-wider mb-3">Execute State Transitions</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedRoom.status === "cleaning" && (
                          <button onClick={() => triggerTransitionConfirm(selectedRoom, "available")} className="bg-green-600 hover:bg-green-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center shadow">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Mark Clean & Available
                          </button>
                        )}
                        {selectedRoom.status === "maintenance" && (
                          <button onClick={() => triggerTransitionConfirm(selectedRoom, "available")} className="bg-green-650 hover:bg-green-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center shadow">
                            <CheckCircle2 className="h-4 w-4 mr-1" /> Resolve Maintenance
                          </button>
                        )}
                        {selectedRoom.status === "available" && (
                          <>
                            <button onClick={() => { setSelectedRoom(null); navigate(`/operations/check-in?roomId=${selectedRoom.roomNumber}`); }} className="bg-green-700 hover:bg-green-800 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center shadow">
                              <CheckSquare className="h-4 w-4 mr-1" /> Check-In Walk-In
                            </button>
                            <button onClick={() => triggerTransitionConfirm(selectedRoom, "maintenance")} className="bg-slate-600 hover:bg-slate-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center">
                              <Wrench className="h-4 w-4 mr-1" /> Put in Maintenance
                            </button>
                          </>
                        )}
                        {selectedRoom.status === "reserved" && (
                          <button onClick={() => { setSelectedRoom(null); navigate(`/operations/check-in?bookingId=${extra.bookingId}`); }} className="bg-green-700 hover:bg-green-800 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center shadow">
                            <CheckSquare className="h-4 w-4 mr-1" /> Check-In Reservation
                          </button>
                        )}
                        {selectedRoom.status === "occupied" && (
                          <button onClick={() => { setSelectedRoom(null); navigate(`/operations/check-out?roomId=${selectedRoom.roomNumber}`); }} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs py-1.5 px-3 rounded-lg flex items-center shadow">
                            <LogOut className="h-4 w-4 mr-1" /> Check-Out & Bill
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* CONFIRM TRANSITION MODAL */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md border border-slate-200 text-slate-800">
            <h3 className="text-lg font-bold text-[#B71C1C] flex items-center mb-3">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Confirm Status Override
            </h3>
            
            <p className="text-sm text-slate-600 mb-4 font-medium">
              Are you sure you want to transition Room <strong>{confirmAction.room.roomNumber}</strong> to <strong>{confirmAction.nextStatus}</strong>?
            </p>

            {confirmAction.nextStatus === "maintenance" && (
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Reported Issue Description
                </label>
                <textarea
                  value={maintenanceReason}
                  onChange={(e) => setMaintenanceReason(e.target.value)}
                  placeholder="Describe the issue (e.g., bathroom pipe leak, broken remote)..."
                  rows="3"
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  required
                />
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => { setConfirmAction(null); setMaintenanceReason(""); }}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSubmit}
                className="px-4 py-2 bg-[#B71C1C] hover:bg-[#9B1515] text-white rounded-lg text-xs font-bold shadow"
              >
                Confirm transition
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
