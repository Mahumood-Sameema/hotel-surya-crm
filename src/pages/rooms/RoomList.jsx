import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Edit2, X } from "lucide-react";
import { getRooms, getRoomTypes, saveRoom } from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function RoomList() {
  const navigate = useNavigate();
  const { user, hasPermission } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [floorFilter, setFloorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [formError, setFormError] = useState("");
  
  // Form State
  const [roomNumber, setRoomNumber] = useState("");
  const [floor, setFloor] = useState(1);
  const [roomTypeId, setRoomTypeId] = useState("");
  const [isAc, setIsAc] = useState(true);
  const [maxAdults, setMaxAdults] = useState(2);
  const [maxChildren, setMaxChildren] = useState(0);
  const [ratePerNight, setRatePerNight] = useState("");
  const [weekendRate, setWeekendRate] = useState("");
  const [status, setStatus] = useState("available");
  const [internalNotes, setInternalNotes] = useState("");
  
  const amenitiesList = [
    { key: "wifi", label: "WiFi" },
    { key: "tv", label: "Smart TV" },
    { key: "hot_water", label: "Hot Water" },
    { key: "balcony", label: "Balcony" },
    { key: "mini_fridge", label: "Mini Fridge" },
    { key: "safe", label: "In-Room Safe" },
    { key: "sofa", label: "Sofa Set" },
    { key: "bathtub", label: "Bathtub" }
  ];
  const [selectedAmenities, setSelectedAmenities] = useState({});

  const loadData = async () => {
    try {
      const r = await getRooms();
      const rt = await getRoomTypes();
      setRooms(r);
      setRoomTypes(rt);
      if (rt.length > 0 && !roomTypeId) {
        setRoomTypeId(rt[0].roomTypeId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setFormError("");
    setEditingRoom(null);
    setRoomNumber("");
    setFloor(1);
    if (roomTypes.length > 0) {
      setRoomTypeId(roomTypes[0].roomTypeId);
      setRatePerNight(roomTypes[0].basePrice);
      setWeekendRate(roomTypes[0].basePrice);
    }
    setIsAc(true);
    setMaxAdults(2);
    setMaxChildren(0);
    setStatus("available");
    setInternalNotes("");
    
    const initialAmenities = {};
    amenitiesList.forEach(a => { initialAmenities[a.key] = false; });
    setSelectedAmenities(initialAmenities);
    
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setFormError("");
    setEditingRoom(room);
    setRoomNumber(room.roomNumber);
    setFloor(room.floor);
    setRoomTypeId(room.roomTypeId);
    setIsAc(room.isAc !== false);
    setMaxAdults(room.maxAdults || 2);
    setMaxChildren(room.maxChildren || 0);
    setRatePerNight(room.ratePerNight || "");
    setWeekendRate(room.weekendRate || "");
    setStatus(room.status);
    setInternalNotes(room.internalNotes || "");
    
    const initialAmenities = {};
    amenitiesList.forEach(a => { 
      initialAmenities[a.key] = room.amenities ? !!room.amenities[a.key] : false; 
    });
    setSelectedAmenities(initialAmenities);

    setShowModal(true);
  };

  const handleAmenityChange = (key) => {
    setSelectedAmenities(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTypeChange = (e) => {
    const typeId = e.target.value;
    setRoomTypeId(typeId);
    const matchedType = roomTypes.find(t => t.roomTypeId === typeId);
    if (matchedType) {
      setRatePerNight(matchedType.basePrice);
      setWeekendRate(matchedType.basePrice);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!roomNumber.trim()) {
      setFormError("Room number is required");
      return;
    }

    if (!roomTypeId) {
      setFormError("Room Type Category is required");
      return;
    }

    const parsedFloor = parseInt(floor);
    if (isNaN(parsedFloor) || parsedFloor < 1) {
      setFormError("Floor Level must be a valid number greater than or equal to 1");
      return;
    }

    const parsedMaxAdults = parseInt(maxAdults);
    if (isNaN(parsedMaxAdults) || parsedMaxAdults < 1) {
      setFormError("Max Adults capacity must be at least 1");
      return;
    }

    const parsedMaxChildren = parseInt(maxChildren);
    const parsedRate = parseFloat(ratePerNight);
    if (isNaN(parsedRate) || parsedRate <= 0) {
      setFormError("Standard Rate per Night must be a valid number greater than 0");
      return;
    }

    const parsedWeekendRate = weekendRate ? parseFloat(weekendRate) : parsedRate;
    if (weekendRate && (isNaN(parsedWeekendRate) || parsedWeekendRate <= 0)) {
      setFormError("Weekend Rate must be a valid number greater than 0");
      return;
    }

    const payload = {
      roomId: editingRoom ? editingRoom.roomId : null,
      roomNumber,
      floor: parsedFloor,
      roomTypeId,
      isAc,
      maxAdults: parsedMaxAdults,
      maxChildren: isNaN(parsedMaxChildren) ? 0 : parsedMaxChildren,
      ratePerNight: parsedRate,
      weekendRate: parsedWeekendRate,
      status,
      internalNotes,
      amenities: selectedAmenities,
      isActive: true
    };

    setLoading(true);
    try {
      const saved = await saveRoom(payload, user);
      if (saved) {
        setShowModal(false);
        await loadData();
      }
    } catch (err) {
      console.error("Firestore save error caught in RoomList:", err);
      setFormError(err.message || "Failed to save room configuration. Please check your credentials or connection.");
    } finally {
      setLoading(false);
    }
  };

  // Filter Rooms
  const filteredRooms = rooms.filter(r => {
    const matchSearch = searchQuery.trim() === "" || r.roomNumber.includes(searchQuery);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchFloor = floorFilter === "all" || String(r.floor) === floorFilter;
    const matchType = typeFilter === "all" || r.roomTypeId === typeFilter;
    return matchSearch && matchStatus && matchFloor && matchType;
  });

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      
      {/* Page Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Physical Rooms Directory</h1>
          <p className="pms-page-header-subtitle">Manage hotel rooms, floors, pricing exceptions, maintenance flags and occupancy statuses</p>
        </div>
        {hasPermission("admin") && (
          <button 
            onClick={openAddModal}
            className="bg-[#B71C1C] hover:bg-[#9B1515] text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Add Physical Room</span>
          </button>
        )}
      </div>

      {/* FILTER BAR & ADD ACTION */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-premium flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Room Number"
              className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-red-600"
            />
          </div>

          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Statuses</option>
            <option value="available">available</option>
            <option value="occupied">occupied</option>
            <option value="reserved">reserved</option>
            <option value="cleaning">cleaning</option>
            <option value="maintenance">maintenance</option>
          </select>

          <select 
            value={floorFilter} 
            onChange={(e) => setFloorFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Floors</option>
            <option value="1">Floor 1</option>
            <option value="2">Floor 2</option>
            <option value="3">Floor 3</option>
          </select>

          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-red-600"
          >
            <option value="all">All Room Types</option>
            {roomTypes.map(t => (
              <option key={t.roomTypeId} value={t.roomTypeId}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-premium overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
              <th className="py-3 px-4">Room No.</th>
              <th className="py-3 px-4">Floor</th>
              <th className="py-3 px-4">Room Type</th>
              <th className="py-3 px-4">AC/Non-AC</th>
              <th className="py-3 px-4">Capacity</th>
              <th className="py-3 px-4 text-right">Base Rate</th>
              <th className="py-3 px-4 text-right">Weekend Rate</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Amenities</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {filteredRooms.map(room => {
              const type = roomTypes.find(t => t.roomTypeId === room.roomTypeId);
              const customAmenities = room.amenities 
                ? Object.entries(room.amenities).filter(([_, v]) => v).map(([k, _]) => k.replace(/_/g, " ")).join(", ")
                : "None";

              return (
                <tr key={room.roomId} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-bold text-slate-800">Room {room.roomNumber}</td>
                  <td className="py-3 px-4">Floor {room.floor}</td>
                  <td className="py-3 px-4">{type ? type.name : "Standard"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${room.isAc !== false ? "bg-cyan-50 text-cyan-700" : "bg-orange-50 text-orange-700"}`}>
                      {room.isAc !== false ? "AC" : "Non-AC"}
                    </span>
                  </td>
                  <td className="py-3 px-4">{room.maxAdults || 2} Pax + {room.maxChildren || 0} Child</td>
                  <td className="py-3 px-4 text-right">₹{(room.ratePerNight || (type ? type.basePrice : 0)).toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4 text-right">₹{(room.weekendRate || (type ? type.basePrice : 0)).toLocaleString("en-IN")}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      room.status === "available" ? "bg-green-100 text-green-800" :
                      room.status === "occupied" ? "bg-red-100 text-red-800" :
                      room.status === "reserved" ? "bg-yellow-100 text-yellow-800" :
                      room.status === "cleaning" ? "bg-blue-100 text-blue-800" :
                      "bg-slate-100 text-slate-800"
                    }`}>
                      {room.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-400">{customAmenities}</td>
                  <td className="py-3 px-4 text-center space-x-2">
                    <button 
                      onClick={() => navigate("/rooms/grid")}
                      className="text-slate-500 hover:text-slate-700 font-semibold"
                    >
                      Grid
                    </button>
                    {hasPermission("admin") && (
                      <button 
                        onClick={() => openEditModal(room)}
                        className="text-[#B71C1C] hover:text-[#9B1515] font-bold"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden text-slate-800 animate-fade-in">
            
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingRoom ? `Edit Room Configuration: ${editingRoom.roomNumber}` : "Add New Physical Room"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-200 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} noValidate className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-750 text-xs font-semibold rounded-lg">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Number*</label>
                  <input
                    type="text"
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    disabled={!!editingRoom}
                    placeholder="e.g. 101"
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Floor Level*</label>
                  <select
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  >
                    <option value={1}>Floor 1</option>
                    <option value={2}>Floor 2</option>
                    <option value={3}>Floor 3</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Category*</label>
                  <select
                    value={roomTypeId}
                    onChange={handleTypeChange}
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  >
                    {roomTypes.map(t => (
                      <option key={t.roomTypeId} value={t.roomTypeId}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Air Conditioning</label>
                  <div className="flex items-center space-x-4 mt-2">
                    <label className="flex items-center text-xs text-slate-650 cursor-pointer">
                      <input
                        type="radio"
                        name="ac_type"
                        checked={isAc === true}
                        onChange={() => setIsAc(true)}
                        className="text-[#B71C1C] focus:ring-[#B71C1C] h-4 w-4 mr-1.5"
                      />
                      AC
                    </label>
                    <label className="flex items-center text-xs text-slate-650 cursor-pointer">
                      <input
                        type="radio"
                        name="ac_type"
                        checked={isAc === false}
                        onChange={() => setIsAc(false)}
                        className="text-[#B71C1C] focus:ring-[#B71C1C] h-4 w-4 mr-1.5"
                      />
                      Non-AC
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Adults</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxAdults}
                    onChange={(e) => setMaxAdults(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Max Children</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={maxChildren}
                    onChange={(e) => setMaxChildren(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Standard Rate per Night (₹)*</label>
                  <input
                    type="number"
                    value={ratePerNight}
                    onChange={(e) => setRatePerNight(e.target.value)}
                    placeholder="e.g. 1999"
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Weekend Rate (₹)</label>
                  <input
                    type="number"
                    value={weekendRate}
                    onChange={(e) => setWeekendRate(e.target.value)}
                    placeholder="Optional"
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Default Initial Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  required
                >
                  <option value="available">available</option>
                  <option value="cleaning">cleaning</option>
                  <option value="maintenance">maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Amenities Checklist</label>
                <div className="grid grid-cols-4 gap-2 border border-slate-100 rounded p-3 bg-slate-50/50">
                  {amenitiesList.map(a => (
                    <label key={a.key} className="flex items-center text-xs text-slate-650 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!selectedAmenities[a.key]}
                        onChange={() => handleAmenityChange(a.key)}
                        className="rounded border-slate-300 text-[#B71C1C] focus:ring-[#B71C1C] mr-1.5 h-3.5 w-3.5"
                      />
                      {a.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Internal Operations Notes</label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="e.g. Near elevators, wheelchair accessible..."
                  rows="2"
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-650 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#B71C1C] hover:bg-[#9B1515] text-white rounded-lg text-xs font-bold shadow disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Saving Configuration..." : "Save Configuration"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
