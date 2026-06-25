import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Users, X } from "lucide-react";
import { getRooms, getRoomTypes, saveRoomType, deleteRoomType } from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function RoomTypes() {
  const { user, hasPermission } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  // Form State
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [weekendRate, setWeekendRate] = useState("");
  const [description, setDescription] = useState("");
  const [capacity, setCapacity] = useState("2 Adults");
  const [features, setFeatures] = useState("");
  const [image, setImage] = useState("");
  
  const amenitiesList = [
    { key: "ac", label: "AC Unit" },
    { key: "wifi", label: "Free High-Speed WiFi" },
    { key: "breakfast", label: "Complimentary Breakfast" },
    { key: "roomService", label: "24/7 Room Service" }
  ];
  const [selectedAmenities, setSelectedAmenities] = useState({});

  const loadData = async () => {
    try {
      const r = await getRooms();
      const rt = await getRoomTypes();
      setRooms(r);
      setRoomTypes(rt);
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
    setEditingType(null);
    setName("");
    setTagline("");
    setBasePrice("");
    setWeekendRate("");
    setDescription("");
    setCapacity("2 Adults");
    setFeatures("Free Wi-Fi, Smart TV");
    setImage("https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80");
    
    const initialAmenities = {};
    amenitiesList.forEach(a => { initialAmenities[a.key] = false; });
    setSelectedAmenities(initialAmenities);

    setShowModal(true);
  };

  const openEditModal = (type) => {
    setEditingType(type);
    setName(type.name);
    setTagline(type.tagline || "");
    setBasePrice(type.basePrice || type.basePrice);
    setWeekendRate(type.weekendRate || type.basePrice);
    setDescription(type.description || "");
    setCapacity(type.capacity || "2 Adults");
    setFeatures(type.features ? type.features.join(", ") : "");
    setImage(type.image || "");
    
    const initialAmenities = {};
    amenitiesList.forEach(a => {
      initialAmenities[a.key] = type.amenities ? !!type.amenities[a.key] : false;
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

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Name is required");
      return;
    }
    if (parseFloat(basePrice) <= 0) {
      alert("Base rate must be greater than 0");
      return;
    }

    const payload = {
      roomTypeId: editingType ? editingType.roomTypeId : null,
      name,
      tagline,
      basePrice: parseFloat(basePrice),
      weekendRate: weekendRate ? parseFloat(weekendRate) : parseFloat(basePrice),
      description,
      capacity,
      features: features.split(",").map(f => f.trim()).filter(Boolean),
      image,
      amenities: selectedAmenities
    };

    setLoading(true);
    try {
      const saved = await saveRoomType(payload, user);
      if (saved) {
        setShowModal(false);
        await loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (type) => {
    const assignedRooms = rooms.filter(r => r.roomTypeId === type.roomTypeId);
    if (assignedRooms.length > 0) {
      alert(`Cannot delete Room Type "${type.name}". There are ${assignedRooms.length} active physical rooms assigned to it. Please reassign those rooms first.`);
      return;
    }

    if (confirm(`Are you absolutely sure you want to delete Room Type: ${type.name}?`)) {
      setLoading(true);
      try {
        await deleteRoomType(type.roomTypeId, user);
        await loadData();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  if (loading && roomTypes.length === 0) {
    return <div className="p-8 text-center text-slate-400 font-bold">Loading categories...</div>;
  }

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      
      {/* Page Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Room Categories & Base Tariffs</h1>
          <p className="pms-page-header-subtitle">Define base room tier rates, capacity rules, amenities and marketing tags</p>
        </div>
        {hasPermission("admin") && (
          <button 
            onClick={openAddModal}
            className="bg-[#B71C1C] hover:bg-[#9B1515] text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Create Room Type</span>
          </button>
        )}
      </div>

      {/* GRID CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {roomTypes.map(type => {
          const typeRooms = rooms.filter(r => r.roomTypeId === type.roomTypeId);
          const availRooms = typeRooms.filter(r => r.status === "available").length;

          return (
            <div key={type.roomTypeId} className="bg-white rounded-xl shadow-premium border border-slate-200 overflow-hidden flex flex-col justify-between hover:shadow-premium-hover transition-all duration-300">
              
              <div className="h-44 w-full relative bg-slate-100">
                <img 
                  src={type.image || "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"} 
                  alt={type.name} 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80"; }}
                />
                <span className="absolute top-3 right-3 bg-red-650 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow uppercase">
                  {type.tagline || "Active"}
                </span>
              </div>

              <div className="p-4 flex-grow space-y-3">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-base text-slate-800 truncate">{type.name}</h3>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase">Rate / Night</p>
                    <p className="font-extrabold text-[#B71C1C] text-sm">₹{type.basePrice.toLocaleString("en-IN")}</p>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed h-8">
                  {type.description}
                </p>

                <div className="flex items-center justify-between text-xs border-t border-slate-50 pt-2 text-slate-500">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-[#B71C1C]" />
                    {type.capacity || "2 Pax"}
                  </span>
                  <span className="font-semibold text-slate-400 uppercase tracking-widest text-[9px]">
                    Available: <strong className="text-[#2E7D32]">{availRooms}</strong> / {typeRooms.length}
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {type.amenities && Object.entries(type.amenities).map(([k, v]) => {
                    if (!v) return null;
                    return (
                      <span key={k} className="bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500 px-1.5 py-0.5 rounded capitalize">
                        {k.replace(/_/g, " ")}
                      </span>
                    );
                  })}
                </div>
              </div>

              {hasPermission("admin") && (
                <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end space-x-2">
                  <button 
                    onClick={() => openEditModal(type)}
                    className="p-1 text-slate-500 hover:text-slate-705 bg-white border border-slate-200 rounded transition-colors"
                    title="Edit Rate Profile"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(type)}
                    className="p-1 text-red-650 hover:text-red-700 bg-white border border-red-200 rounded transition-colors"
                    title="Delete Room Type"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden text-slate-800 animate-fade-in">
            
            <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {editingType ? `Edit Rate Profile: ${editingType.name}` : "Create New Room Category"}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-200 rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Type Name*</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Executive Suite AC"
                  disabled={!!editingType}
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Marketing Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Premium Choice / Maximum Comfort"
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Base Price / Night (₹)*</label>
                  <input
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    placeholder="e.g. 2999"
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Weekend Price Override (₹)</label>
                  <input
                    type="number"
                    value={weekendRate}
                    onChange={(e) => setWeekendRate(e.target.value)}
                    placeholder="e.g. 3499"
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Capacity Display Text</label>
                  <input
                    type="text"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="e.g. 2 Adults / 3 Guests"
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Image URL Link</label>
                  <input
                    type="text"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://unsplash.com/..."
                    className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">General Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Essential room details..."
                  rows="3"
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Special Features (comma-separated)</label>
                <input
                  type="text"
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="Free WiFi, King Size Bed, Safe Vault"
                  className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Enabled Amenities</label>
                <div className="grid grid-cols-2 gap-2 border border-slate-100 rounded p-3 bg-slate-50/50">
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

              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-605 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B71C1C] hover:bg-[#9B1515] text-white rounded-lg text-xs font-bold shadow"
                >
                  Save Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
