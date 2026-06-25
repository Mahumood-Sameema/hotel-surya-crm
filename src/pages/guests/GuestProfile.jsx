import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  User, 
  ArrowLeft,
  Edit,
  Save,
  Award,
  Plus,
  MessageSquare,
  Upload,
  FileCheck,
  Star
} from "lucide-react";
import { 
  getGuests, 
  saveGuest, 
  getBookings, 
  getInvoices, 
  getPayments, 
  getRoomTypes,
  logAction
} from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function GuestProfile() {
  const { guestId: id } = useParams();
  const navigate = useNavigate();
  const { user } = usePmsAuth();
  
  const isNew = id === "new";

  const [loading, setLoading] = useState(true);
  const [guest, setGuest] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  
  // Tab control
  const [activeTab, setActiveTab] = useState("overview");

  // Related lists
  const [guestBookings, setGuestBookings] = useState([]);
  const [guestInvoices, setGuestInvoices] = useState([]);
  const [guestPayments, setGuestPayments] = useState([]);
  const [guestNotes, setGuestNotes] = useState([]);

  // Form Fields
  const [editMode, setEditMode] = useState(isNew);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [anniversaryDate, setAnniversaryDate] = useState("");
  const [idType, setIdType] = useState("Aadhaar Card");
  const [idNumber, setIdNumber] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [nationality, setNationality] = useState("Indian");
  const [isVip, setIsVip] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");

  const loadGuestData = async () => {
    try {
      const rts = await getRoomTypes();
      setRoomTypes(rts);

      if (isNew) {
        setGuest({
          fullName: "",
          phone: "",
          email: "",
          idType: "Aadhaar Card",
          idNumber: "",
          address: "",
          city: "",
          state: "",
          pinCode: "",
          nationality: "Indian",
          isVip: false,
          internalNotes: ""
        });
        setFullName("");
        setPhone("");
        setEmail("");
        setDateOfBirth("");
        setAnniversaryDate("");
        setIdType("Aadhaar Card");
        setIdNumber("");
        setAddress("");
        setCity("");
        setState("");
        setPinCode("");
        setNationality("Indian");
        setIsVip(false);
        setGuestNotes([]);
        setEditMode(true);
        setLoading(false);
        return;
      }

      const allGuests = await getGuests();
      const matched = allGuests.find(g => g.guestId === id);
      if (!matched) {
        navigate("/guests");
        return;
      }

      setGuest(matched);
      setFullName(matched.fullName || "");
      setPhone(matched.phone || "");
      setEmail(matched.email || "");
      setDateOfBirth(matched.dateOfBirth || "");
      setAnniversaryDate(matched.anniversaryDate || "");
      setIdType(matched.idType || "Aadhaar Card");
      setIdNumber(matched.idNumber || "");
      setAddress(matched.address || "");
      setCity(matched.city || "");
      setState(matched.state || "");
      setPinCode(matched.pinCode || "");
      setNationality(matched.nationality || "Indian");
      setIsVip(!!matched.isVip);

      // Parse notes
      try {
        if (matched.internalNotes) {
          const notesArr = JSON.parse(matched.internalNotes);
          if (Array.isArray(notesArr)) setGuestNotes(notesArr);
        }
      } catch (e) {
        if (matched.internalNotes) {
          setGuestNotes([{ author: "Staff", timestamp: new Date().toISOString(), text: matched.internalNotes }]);
        }
      }

      // Fetch links
      const allBookings = await getBookings();
      const allInvoices = await getInvoices();
      const allPayments = await getPayments();

      const filteredBookings = allBookings.filter(b => b.guestId === id);
      setGuestBookings(filteredBookings);

      const filteredInvoices = allInvoices.filter(i => i.guestId === id);
      setGuestInvoices(filteredInvoices);

      const filteredPayments = allPayments.filter(p => filteredInvoices.some(inv => inv.invoiceId === p.invoiceId));
      setGuestPayments(filteredPayments);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGuestData();
  }, [id]);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    if (!fullName.trim() || !phone.trim()) {
      alert("Name and Phone Number are required.");
      return;
    }

    const payload = {
      guestId: isNew ? null : id,
      fullName,
      phone,
      email,
      dateOfBirth,
      anniversaryDate,
      idType,
      idNumber,
      address,
      city,
      state,
      pinCode,
      nationality,
      isVip,
      internalNotes: JSON.stringify(guestNotes)
    };

    setLoading(true);
    try {
      const saved = await saveGuest(payload, user);
      if (saved) {
        if (isNew) {
          navigate(`/guests/${saved.guestId}`);
        } else {
          setEditMode(false);
          await loadGuestData();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVip = async () => {
    if (isNew) {
      setIsVip(!isVip);
      return;
    }
    const updatedVal = !isVip;
    setIsVip(updatedVal);
    await saveGuest({ ...guest, isVip: updatedVal }, user);
    await logAction(user, "Updated", "Guests", id, `VIP Status toggled to ${updatedVal}`, guest);
  };

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      author: user ? user.fullName : "Staff Member",
      timestamp: new Date().toISOString(),
      text: newNoteText.trim()
    };
    const updatedNotes = [newNote, ...guestNotes];
    setGuestNotes(updatedNotes);
    setNewNoteText("");

    if (!isNew) {
      await saveGuest({
        ...guest,
        internalNotes: JSON.stringify(updatedNotes)
      }, user);
    }
  };

  if (loading && !guest) {
    return <div className="p-8 text-center text-slate-400 font-bold">Loading guest profile...</div>;
  }

  const getInitials = (name) => {
    if (!name) return "G";
    return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="space-y-6 text-slate-805 animate-fade-in">
      
      {/* Standardized Page Header with Inline Back Button */}
      <div className="pms-page-header">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/guests")} 
            className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 p-2 text-slate-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="pms-page-header-title">{isNew ? "New Guest Profile" : guest?.fullName || "Guest Profile"}</h1>
            <p className="pms-page-header-subtitle">{isNew ? "Register a new guest profile details" : "Manage guest profile credentials, stay logs and billing records"}</p>
          </div>
        </div>
      </div>

      {/* HEADER SUMMARY CARD */}
      {!isNew && guest && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-premium p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center font-bold text-2xl shadow-sm ${guest.isVip ? "bg-[#B71C1C] text-white" : "bg-slate-600 text-white"}`}>
              {getInitials(guest.fullName)}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-slate-800 font-serif">{guest.fullName}</h2>
                {guest.isVip && (
                  <span className="bg-yellow-100 text-yellow-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-full flex items-center">
                    <Star className="h-3.5 w-3.5 mr-0.5 fill-yellow-800" /> VIP
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">Guest ID: {guest.guestId} | Created: {new Date(guest.createdAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex space-x-8 text-xs border-l border-slate-100 pl-6 hidden md:flex">
            <div>
              <span className="block text-slate-405 uppercase font-bold text-[10px]">Total Stays</span>
              <span className="text-lg font-black text-slate-800 mt-1 block">{guest.totalStays || 0} stays</span>
            </div>
            <div>
              <span className="block text-slate-405 uppercase font-bold text-[10px]">Total Revenue</span>
              <span className="text-lg font-black text-[#B71C1C] mt-1 block">₹{(guest.totalSpent || 0).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button 
              onClick={handleToggleVip}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition-colors ${
                guest.isVip 
                  ? "border-red-200 text-red-650 hover:bg-red-50 bg-red-50/50" 
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 bg-white"
              }`}
            >
              {guest.isVip ? "Revoke VIP Tag" : "Promote VIP"}
            </button>
            <button 
              onClick={() => navigate(`/bookings/create?guestId=${guest.guestId}`)}
              className="bg-[#B71C1C] hover:bg-[#9B1515] text-white px-3.5 py-2 rounded-lg text-xs font-bold shadow flex items-center space-x-1"
            >
              <Plus className="h-4 w-4" />
              <span>Book Stay</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB MENU */}
      {!isNew && (
        <div className="flex border-b border-slate-250 bg-white px-4 rounded-xl border border-slate-200 shadow-premium">
          {["overview", "bookings", "invoices", "payments", "documents", "notes"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-4 font-bold text-xs uppercase tracking-wider border-b-2 -mb-px transition-all ${
                activeTab === tab 
                  ? "border-[#B71C1C] text-[#B71C1C]" 
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* TAB VIEW PORT */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-premium p-6">
        
        {/* Overview Tab */}
        {(activeTab === "overview" || isNew) && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {isNew ? "Guest Registration Form" : "Guest Credentials Profile"}
              </h3>
              {!isNew && (
                <button
                  type="button"
                  onClick={() => setEditMode(!editMode)}
                  className="text-xs font-bold text-[#B71C1C] hover:underline flex items-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>{editMode ? "Cancel Editing" : "Edit Profile"}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="space-y-4 text-xs">
                <h4 className="text-[10px] font-bold text-[#B71C1C] uppercase tracking-widest">Personal Details</h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Full Name*</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!editMode}
                    className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Phone Number*</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={!editMode}
                    className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!editMode}
                    className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">DOB</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      disabled={!editMode}
                      className="w-full border border-slate-200 rounded p-2 disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Anniversary</label>
                    <input
                      type="date"
                      value={anniversaryDate}
                      onChange={(e) => setAnniversaryDate(e.target.value)}
                      disabled={!editMode}
                      className="w-full border border-slate-200 rounded p-2 disabled:bg-slate-50"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <h4 className="text-[10px] font-bold text-[#B71C1C] uppercase tracking-widest">Verification & Address</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ID Type</label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      disabled={!editMode}
                      className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                    >
                      <option value="Aadhaar Card">Aadhaar Card</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ID Card No*</label>
                    <input
                      type="text"
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      disabled={!editMode}
                      className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                      placeholder="Verified ID card"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Street Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={!editMode}
                    className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      disabled={!editMode}
                      className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pincode</label>
                    <input
                      type="text"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      disabled={!editMode}
                      className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">State</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      disabled={!editMode}
                      className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nationality</label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      disabled={!editMode}
                      className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <h4 className="text-[10px] font-bold text-[#B71C1C] uppercase tracking-widest">Preferences</h4>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Room Category Preference</label>
                  <select 
                    disabled={!editMode}
                    className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                  >
                    <option value="none">No specific preference</option>
                    {roomTypes.map(t => (
                      <option key={t.roomTypeId} value={t.roomTypeId}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Dietary preferences</label>
                  <input
                    type="text"
                    disabled={!editMode}
                    placeholder="e.g. Vegetarian diet / Diabetic needs"
                    className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Floor Level Preference</label>
                  <input
                    type="text"
                    disabled={!editMode}
                    placeholder="e.g. Low floor preferred"
                    className="w-full border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none disabled:bg-slate-50 font-medium"
                  />
                </div>
              </div>

            </div>

            {editMode && (
              <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (isNew) navigate("/guests");
                    else setEditMode(false);
                  }}
                  className="px-4 py-2 border border-slate-200 text-slate-650 rounded-lg text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#B71C1C] hover:bg-[#9B1515] text-white rounded-lg text-xs font-bold shadow flex items-center space-x-1"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Profile</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* Tab 2: Bookings */}
        {!isNew && activeTab === "bookings" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider border-b border-slate-100 pb-2">Stay reservations</h3>
            {guestBookings.length === 0 ? (
              <p className="text-xs text-slate-450 py-6 text-center">No bookings found for this customer.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                      <th className="py-2.5 px-3">Booking ID</th>
                      <th className="py-2.5 px-3">Room assigned</th>
                      <th className="py-2.5 px-3">Stay Dates</th>
                      <th className="py-2.5 px-3 text-center">Nights</th>
                      <th className="py-2.5 px-3 text-right">Stay Total</th>
                      <th className="py-2.5 px-3 text-right">Advance Paid</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {guestBookings.map(b => (
                      <tr key={b.bookingId}>
                        <td className="py-2.5 px-3 font-bold text-[#B71C1C]">{b.bookingId}</td>
                        <td className="py-2.5 px-3">Room {b.roomId || "Unassigned"}</td>
                        <td className="py-2.5 px-3">{b.checkInDate} to {b.checkOutDate}</td>
                        <td className="py-2.5 px-3 text-center">{b.nightsCount}</td>
                        <td className="py-2.5 px-3 text-right">₹{b.grandTotal.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right text-green-700">₹{(b.advancePaid || 0).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right text-red-650">₹{(b.balanceDue || 0).toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === "Checked In" ? "bg-green-100 text-green-800" :
                            b.status === "Confirmed" ? "bg-blue-100 text-blue-800" :
                            b.status === "Checked Out" ? "bg-gray-100 text-gray-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Invoices */}
        {!isNew && activeTab === "invoices" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider border-b border-slate-100 pb-2">Stay Invoices</h3>
            {guestInvoices.length === 0 ? (
              <p className="text-xs text-slate-450 py-6 text-center">No invoices found for this guest.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                      <th className="py-2.5 px-3">Invoice ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Linked Booking</th>
                      <th className="py-2.5 px-3 text-right">Gross Total</th>
                      <th className="py-2.5 px-3 text-right">Paid Amount</th>
                      <th className="py-2.5 px-3 text-right">Balance Due</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {guestInvoices.map(inv => (
                      <tr key={inv.invoiceId}>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{inv.invoiceId}</td>
                        <td className="py-2.5 px-3">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#B71C1C]">{inv.bookingId}</td>
                        <td className="py-2.5 px-3 text-right">₹{inv.grandTotal.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right text-green-700">₹{inv.paidAmount.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 text-right text-red-650">₹{inv.balanceDue.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === "Paid" ? "bg-green-100 text-green-800" :
                            inv.status === "Partial" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button 
                            onClick={() => navigate(`/billing/invoices/${inv.invoiceId}`)}
                            className="text-red-750 hover:text-red-800 font-bold hover:underline"
                          >
                            Preview Invoice
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Payments */}
        {!isNew && activeTab === "payments" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider border-b border-slate-100 pb-2">Transactions History</h3>
            {guestPayments.length === 0 ? (
              <p className="text-xs text-slate-450 py-6 text-center">No payment transactions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                      <th className="py-2.5 px-3">Transaction ID</th>
                      <th className="py-2.5 px-3">Payment Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Reference ID</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                    {guestPayments.map(p => (
                      <tr key={p.paymentId}>
                        <td className="py-2.5 px-3 font-mono text-slate-550">{p.paymentId}</td>
                        <td className="py-2.5 px-3">{new Date(p.paymentDate).toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-green-700">₹{p.amount.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 px-3 capitalize">{p.paymentMode}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{p.referenceId || "—"}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-650 text-[9px] font-bold">
                            {p.paymentType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === "Completed" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Documents */}
        {!isNew && activeTab === "documents" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider">Attached Verification Documents</h3>
              <button className="border border-slate-200 hover:bg-slate-50 text-xs font-semibold py-1.5 px-3 rounded flex items-center">
                <Upload className="h-4 w-4 mr-1 text-slate-500" />
                Upload Document
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {guest.idNumber ? (
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex flex-col justify-between h-44">
                  <div className="flex items-center space-x-2">
                    <FileCheck className="h-8 w-8 text-[#B71C1C]" />
                    <div>
                      <h4 className="font-bold text-sm text-slate-805">{guest.idType}</h4>
                      <p className="text-[10px] text-slate-400">Government-verified ID card</p>
                    </div>
                  </div>
                  <div className="bg-white border border-slate-100 p-2.5 rounded font-mono text-center text-xs font-bold text-slate-700">
                    {guest.idNumber}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Uploaded: {new Date(guest.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-455 col-span-3 text-center py-8">No document files attached.</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Notes */}
        {!isNew && activeTab === "notes" && (
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-slate-805 uppercase tracking-wider border-b border-slate-100 pb-2">Internal Staff Notes</h3>

            <div className="space-y-3">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Write stay logs or notes for reception duty..."
                rows="3"
                className="w-full text-xs border border-slate-200 rounded p-2 focus:ring-1 focus:ring-red-600 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleAddNote}
                  className="bg-[#B71C1C] hover:bg-[#9B1515] text-white px-3.5 py-1.5 rounded text-xs font-bold shadow flex items-center space-x-1"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Attach Staff Note</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {guestNotes.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No notes recorded.</p>
              ) : (
                guestNotes.map((note, index) => (
                  <div key={index} className="pt-3 first:pt-0">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mb-1">
                      <span>{note.author}</span>
                      <span>{new Date(note.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-700 italic bg-slate-50 border border-slate-100 p-2.5 rounded-lg">
                      "{note.text}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
