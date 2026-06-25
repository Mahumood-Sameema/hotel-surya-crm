import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  UserPlus, 
  Search, 
  Calendar, 
  Calculator, 
  Bed, 
  Check, 
  AlertCircle,
  Users
} from "lucide-react";
import { 
  getGuests, 
  getRooms, 
  getRoomTypes, 
  createBooking, 
  saveGuest, 
  getSettings 
} from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function CreateBooking() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = usePmsAuth();
  
  // Extract state if redirected from a website booking request or guest profile
  const queryParams = new URLSearchParams(location.search);
  const requestLeadId = queryParams.get("leadId");
  const requestGuestId = queryParams.get("guestId") || "";
  const requestGuestName = queryParams.get("guestName") || "";
  const requestPhone = queryParams.get("phone") || "";
  const requestEmail = queryParams.get("email") || "";
  const requestRoomTypeId = queryParams.get("roomTypeId") || "";
  const requestCheckIn = queryParams.get("checkIn") || "";
  const requestCheckOut = queryParams.get("checkOut") || "";

  // Core Data Lists
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [taxSettings, setTaxSettings] = useState({ cgstRate: 6, sgstRate: 6 }); // Fallback 12% total GST

  // Loading States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Guest Selection / Creation State
  const [guestSearch, setGuestSearch] = useState(requestGuestName);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  
  // New Guest Fields
  const [newGuestData, setNewGuestData] = useState({
    fullName: requestGuestName,
    phone: requestPhone,
    email: requestEmail,
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

  // Booking Form State
  const [bookingData, setBookingData] = useState({
    roomTypeId: requestRoomTypeId || "",
    roomId: "",
    checkInDate: requestCheckIn || new Date().toISOString().split("T")[0],
    checkOutDate: requestCheckOut || new Date(Date.now() + 86400000).toISOString().split("T")[0],
    adultsCount: 2,
    childrenCount: 0,
    source: "Walk-In",
    specialRequests: "",
    ratePerNight: 0,
    customRate: false,
    discountType: "amount",
    discountValue: 0,
    advancePaid: 0,
    status: "Confirmed"
  });

  // Calculations
  const [nightsCount, setNightsCount] = useState(1);
  const [subTotal, setSubTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gList, rList, rtList, settings] = await Promise.all([
          getGuests(),
          getRooms(),
          getRoomTypes(),
          getSettings()
        ]);
        setGuests(gList);
        setRooms(rList);
        setRoomTypes(rtList);
        if (settings) {
          setTaxSettings({
            cgstRate: settings.cgstRate ?? 6,
            sgstRate: settings.sgstRate ?? 6
          });
        }

        // If redirected with an explicit guest ID
        if (requestGuestId) {
          const matched = gList.find(g => g.guestId === requestGuestId);
          if (matched) {
            setSelectedGuest(matched);
            setGuestSearch(matched.fullName);
          }
        } else if (requestGuestName) {
          // If redirected from website request with details
          const matched = gList.find(g => g.phone === requestPhone);
          if (matched) {
            setSelectedGuest(matched);
            setGuestSearch(matched.fullName);
          } else {
            setShowNewGuestForm(true);
          }
        }
      } catch (err) {
        console.error("Error loading create booking data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [requestGuestId, requestGuestName, requestPhone]);

  // Calculate Nights Count
  useEffect(() => {
    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const checkIn = new Date(bookingData.checkInDate);
      const checkOut = new Date(bookingData.checkOutDate);
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      const nights = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
      setNightsCount(nights);
    }
  }, [bookingData.checkInDate, bookingData.checkOutDate]);

  // Set default base price when room type changes
  useEffect(() => {
    if (bookingData.roomTypeId && !bookingData.customRate) {
      const selectedType = roomTypes.find(rt => rt.roomTypeId === bookingData.roomTypeId);
      if (selectedType) {
        setBookingData(prev => ({
          ...prev,
          ratePerNight: selectedType.basePrice,
          roomId: "" // Reset room selection when room type changes
        }));
      }
    }
  }, [bookingData.roomTypeId, roomTypes, bookingData.customRate]);

  // Pricing calculations
  useEffect(() => {
    const rawSubtotal = (Number(bookingData.ratePerNight) || 0) * nightsCount;
    setSubTotal(rawSubtotal);

    let calculatedDiscount = 0;
    if (bookingData.discountType === "amount") {
      calculatedDiscount = Number(bookingData.discountValue) || 0;
    } else {
      calculatedDiscount = Math.round((rawSubtotal * (Number(bookingData.discountValue) || 0)) / 100);
    }
    setDiscountAmount(calculatedDiscount);

    const taxableAmount = Math.max(0, rawSubtotal - calculatedDiscount);
    const totalGstRate = taxSettings.cgstRate + taxSettings.sgstRate;
    const gst = Math.round((taxableAmount * totalGstRate) / 100);
    setGstAmount(gst);

    const total = taxableAmount + gst;
    setGrandTotal(total);

    const balance = Math.max(0, total - (Number(bookingData.advancePaid) || 0));
    setBalanceDue(balance);
  }, [bookingData.ratePerNight, nightsCount, bookingData.discountType, bookingData.discountValue, bookingData.advancePaid, taxSettings]);

  // Filter rooms by room type and status
  const availableRooms = rooms.filter(room => {
    const isSameType = room.roomTypeId === bookingData.roomTypeId;
    // Room is available or currently cleaning/ready (receptionist can override cleaning to check in)
    const isAvailable = room.status === "available" || room.status === "cleaning";
    return isSameType && isAvailable;
  });

  const handleGuestSearchChange = (e) => {
    const val = e.target.value;
    setGuestSearch(val);
    setSelectedGuest(null);
    setShowGuestDropdown(true);
    setShowNewGuestForm(false);
  };

  const selectExistingGuest = (g) => {
    setSelectedGuest(g);
    setGuestSearch(g.fullName);
    setShowGuestDropdown(false);
    setErrorMsg("");
  };

  const handleSaveNewGuest = async (e) => {
    e.preventDefault();
    if (!newGuestData.fullName || !newGuestData.phone) {
      setErrorMsg("Full Name and Phone are required for new guests.");
      return;
    }
    try {
      setSubmitting(true);
      const saved = await saveGuest(newGuestData, user);
      setSelectedGuest(saved);
      setGuestSearch(saved.fullName);
      setShowNewGuestForm(false);
      // Reload guests list to include the new one
      const updatedList = await getGuests();
      setGuests(updatedList);
      setSuccessMsg("New guest profile registered successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg("Failed to save guest: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedGuest) {
      setErrorMsg("Please select or create a guest profile first.");
      return;
    }
    if (!bookingData.roomTypeId) {
      setErrorMsg("Please select a Room Type.");
      return;
    }
    if (!bookingData.roomId) {
      setErrorMsg("Please assign a physical room number.");
      return;
    }

    try {
      setSubmitting(true);
      
      const payload = {
        guestId: selectedGuest.guestId,
        roomId: bookingData.roomId,
        roomTypeId: bookingData.roomTypeId,
        bookingRequestId: requestLeadId || null,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        actualCheckIn: bookingData.status === "Checked In" ? new Date().toISOString() : null,
        actualCheckOut: null,
        nightsCount,
        adultsCount: Number(bookingData.adultsCount),
        childrenCount: Number(bookingData.childrenCount),
        source: bookingData.source,
        specialRequests: bookingData.specialRequests,
        ratePerNight: Number(bookingData.ratePerNight),
        extraCharges: [],
        subTotal,
        discountType: bookingData.discountType,
        discountValue: Number(bookingData.discountValue),
        discountAmount,
        gstRate: taxSettings.cgstRate + taxSettings.sgstRate,
        gstAmount,
        grandTotal,
        advancePaid: Number(bookingData.advancePaid),
        balanceDue,
        status: bookingData.status
      };

      // Create Booking!
      await createBooking(payload, user);

      setSuccessMsg("Booking created successfully!");
      setTimeout(() => {
        navigate("/bookings");
      }, 1500);
    } catch (err) {
      setErrorMsg("Error creating booking: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Filter guests autocomplete list
  const filteredGuests = guestSearch.trim() === "" 
    ? [] 
    : guests.filter(g => 
        g.fullName.toLowerCase().includes(guestSearch.toLowerCase()) || 
        g.phone.includes(guestSearch)
      ).slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="pms-page-header">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="pms-page-header-title">New Reservation</h1>
            <p className="pms-page-header-subtitle">Create a new booking and assign room placement</p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800 border border-red-150">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-800 border border-green-150">
          <Check className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Forms */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Section 1: Guest Selection */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-red-800" /> Guest Details
            </h2>

            {!showNewGuestForm ? (
              <div className="space-y-4">
                <div className="relative">
                  <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Search Guest (Name or Mobile)
                  </label>
                  <div className="relative">
                    <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Type guest name or phone number..."
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-32 text-sm focus:border-red-500 focus:outline-none"
                      value={guestSearch}
                      onChange={handleGuestSearchChange}
                      onFocus={() => setShowGuestDropdown(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewGuestForm(true)}
                      className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-red-50 px-3 py-1 text-xs font-semibold text-red-850 hover:bg-red-100 transition-colors !h-7"
                    >
                      <UserPlus className="h-3.5 w-3.5" /> New Guest
                    </button>
                  </div>

                  {/* Dropdown Auto-suggest */}
                  {showGuestDropdown && filteredGuests.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                      <ul className="py-1">
                        {filteredGuests.map(g => (
                          <li key={g.guestId}>
                            <button
                              type="button"
                              onClick={() => selectExistingGuest(g)}
                              className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-gray-50"
                            >
                              <div>
                                <span className="font-semibold text-gray-800">{g.fullName}</span>
                                {g.isVip && <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-3xs font-medium text-amber-800">VIP</span>}
                                <span className="block text-xs text-gray-500">{g.city || "No City"}, {g.nationality}</span>
                              </div>
                              <span className="text-xs text-gray-600 font-mono">{g.phone}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {showGuestDropdown && guestSearch.trim() !== "" && filteredGuests.length === 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white p-3 text-center text-sm text-gray-500 shadow-lg">
                      No matching guests found. Click <strong>New Guest</strong> to register this guest.
                    </div>
                  )}
                </div>

                {selectedGuest && (
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-200 flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{selectedGuest.fullName}</p>
                      <p className="text-xs text-gray-600">Mobile: {selectedGuest.phone} | Email: {selectedGuest.email || "N/A"}</p>
                      <p className="text-xs text-gray-500 mt-1">ID: {selectedGuest.idType} - {selectedGuest.idNumber || "No ID Saved"}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedGuest(null);
                        setGuestSearch("");
                      }}
                      className="text-xs font-semibold text-red-650 hover:underline"
                    >
                      Clear Selection
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Inline New Guest Creation Form */
              <form onSubmit={handleSaveNewGuest} className="space-y-4 rounded-lg bg-red-50/30 p-4 border border-red-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider">Quick Guest Registration</h3>
                  <button
                    type="button"
                    onClick={() => setShowNewGuestForm(false)}
                    className="text-xs font-semibold text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Full Name *</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-red-500 focus:outline-none"
                      required
                      value={newGuestData.fullName}
                      onChange={e => setNewGuestData({...newGuestData, fullName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Phone Number *</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-red-500 focus:outline-none"
                      required
                      value={newGuestData.phone}
                      onChange={e => setNewGuestData({...newGuestData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Email Address</label>
                    <input
                      type="email"
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-red-500 focus:outline-none"
                      value={newGuestData.email}
                      onChange={e => setNewGuestData({...newGuestData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">Nationality</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-red-500 focus:outline-none"
                      value={newGuestData.nationality}
                      onChange={e => setNewGuestData({...newGuestData, nationality: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">ID Type</label>
                    <select
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-red-500 focus:outline-none"
                      value={newGuestData.idType}
                      onChange={e => setNewGuestData({...newGuestData, idType: e.target.value})}
                    >
                      <option>Aadhaar Card</option>
                      <option>Passport</option>
                      <option>Driving License</option>
                      <option>Voter ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600">ID Number</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-sm focus:border-red-500 focus:outline-none"
                      value={newGuestData.idNumber}
                      onChange={e => setNewGuestData({...newGuestData, idNumber: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewGuestForm(false)}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-md bg-red-800 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-900 disabled:bg-gray-400"
                  >
                    Register & Select Guest
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Section 2: Room Placement & Schedule */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="font-serif text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bed className="h-5 w-5 text-red-800" /> Room Selection
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-In Date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                  value={bookingData.checkInDate}
                  onChange={e => setBookingData({...bookingData, checkInDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Check-Out Date</label>
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                  value={bookingData.checkOutDate}
                  onChange={e => setBookingData({...bookingData, checkOutDate: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Room Type Category</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                  value={bookingData.roomTypeId}
                  onChange={e => setBookingData({...bookingData, roomTypeId: e.target.value})}
                >
                  <option value="">-- Choose Category --</option>
                  {roomTypes.map(rt => (
                    <option key={rt.roomTypeId} value={rt.roomTypeId}>
                      {rt.name} (Base: ₹{rt.basePrice}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Assign Room ({availableRooms.length} available)
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                  value={bookingData.roomId}
                  onChange={e => setBookingData({...bookingData, roomId: e.target.value})}
                  disabled={!bookingData.roomTypeId}
                >
                  <option value="">-- Assign Physical Room --</option>
                  {availableRooms.map(room => (
                    <option key={room.roomId} value={room.roomId}>
                      Room {room.roomNumber} (Floor {room.floor} - {room.status})
                    </option>
                  ))}
                </select>
                {!bookingData.roomTypeId && (
                  <p className="mt-1 text-3xs text-gray-400">Select Room Type first to see available rooms</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Adults Count</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                  value={bookingData.adultsCount}
                  onChange={e => setBookingData({...bookingData, adultsCount: e.target.value === "" ? "" : Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Children Count</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                  value={bookingData.childrenCount}
                  onChange={e => setBookingData({...bookingData, childrenCount: e.target.value === "" ? "" : Number(e.target.value)})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking Source</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                  value={bookingData.source}
                  onChange={e => setBookingData({...bookingData, source: e.target.value})}
                >
                  <option>Walk-In</option>
                  <option>Website</option>
                  <option>OTA (Booking.com/Agoda)</option>
                  <option>Direct Call</option>
                  <option>Corporate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Initial Booking Status</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                  value={bookingData.status}
                  onChange={e => setBookingData({...bookingData, status: e.target.value})}
                >
                  <option value="Confirmed">Confirmed (Reserved)</option>
                  <option value="Checked In">Check-In Immediately (Occupied)</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Special Requests / Notes</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-red-500 focus:outline-none"
                rows="2"
                placeholder="Airport pick-up, extra bed, dietary restrictions, non-smoking, etc."
                value={bookingData.specialRequests}
                onChange={e => setBookingData({...bookingData, specialRequests: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Right 1 Column: Billing summary widget */}
        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sticky top-6">
            <h2 className="font-serif text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-red-800" /> Billing Summary
            </h2>

            <div className="space-y-4 border-b border-gray-150 pb-4">
              
              {/* Daily Rate Configurator */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate per night (₹)</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    className="w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-red-500 focus:outline-none"
                    value={bookingData.ratePerNight}
                    onChange={e => setBookingData({...bookingData, ratePerNight: e.target.value === "" ? "" : Number(e.target.value), customRate: true})}
                  />
                </div>
                {bookingData.customRate && (
                  <button 
                    type="button" 
                    onClick={() => setBookingData(p => ({ ...p, customRate: false }))} 
                    className="text-4xs text-red-750 font-semibold mt-1 hover:underline block"
                  >
                    Reset to room type default rate
                  </button>
                )}
              </div>

              <div className="flex justify-between text-sm text-gray-600">
                <span>Room tariff:</span>
                <span className="font-semibold">₹{bookingData.ratePerNight} × {nightsCount} night(s)</span>
              </div>

              <div className="flex justify-between text-sm text-gray-800">
                <span>Room Subtotal:</span>
                <span className="font-bold text-gray-900">₹{subTotal}</span>
              </div>

              {/* Discount selection */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <label className="block text-4xs font-semibold text-gray-400 uppercase">Discount Type</label>
                  <select
                    className="mt-1 w-full rounded-md border border-gray-300 p-1 text-xs focus:outline-none"
                    value={bookingData.discountType}
                    onChange={e => setBookingData({...bookingData, discountType: e.target.value})}
                  >
                    <option value="amount">Fixed (₹)</option>
                    <option value="percent">Percentage (%)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-4xs font-semibold text-gray-400 uppercase">Value</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-md border border-gray-300 p-1 text-xs focus:outline-none"
                    value={bookingData.discountValue}
                    onChange={e => setBookingData({...bookingData, discountValue: e.target.value === "" ? "" : Number(e.target.value)})}
                  />
                </div>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-sm text-red-700">
                  <span>Discount:</span>
                  <span>- ₹{discountAmount}</span>
                </div>
              )}

              {/* Tax Breakdowns */}
              <div className="border-t border-dashed border-gray-200 pt-2 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>CGST ({taxSettings.cgstRate}%):</span>
                  <span>₹{Math.round(gstAmount / 2)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>SGST ({taxSettings.sgstRate}%):</span>
                  <span>₹{Math.round(gstAmount / 2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 font-medium">
                  <span>Total GST ({taxSettings.cgstRate + taxSettings.sgstRate}%):</span>
                  <span>₹{gstAmount}</span>
                </div>
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-4 pt-4">
              <div className="flex justify-between text-base font-bold text-gray-900">
                <span>Grand Total:</span>
                <span className="text-lg text-red-800">₹{grandTotal}</span>
              </div>

              {/* Payment ledger */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Advance / Deposit Paid (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  className="mt-1 w-full rounded-lg border border-gray-350 p-2 text-sm focus:border-red-500 focus:outline-none"
                  value={bookingData.advancePaid}
                  onChange={e => setBookingData({...bookingData, advancePaid: e.target.value === "" ? "" : Number(e.target.value)})}
                />
              </div>

              <div className="flex justify-between border-t border-gray-150 pt-3 text-sm font-bold">
                <span className="text-gray-700">Balance Due:</span>
                <span className={`text-base ${balanceDue > 0 ? "text-amber-800" : "text-green-800"}`}>
                  ₹{balanceDue}
                </span>
              </div>

              <button
                type="button"
                onClick={handleFormSubmit}
                disabled={submitting}
                className="w-full rounded-lg bg-red-850 py-3 font-semibold text-white shadow-sm hover:bg-red-900 transition-colors disabled:bg-gray-400"
              >
                {submitting ? "Booking Rooms..." : "Confirm & Save Booking"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
