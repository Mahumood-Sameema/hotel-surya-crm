import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  Check, 
  User, 
  Bed, 
  CreditCard, 
  FileText, 
  AlertCircle 
} from "lucide-react";
import { 
  getBookings, 
  getGuests, 
  getRooms, 
  getRoomTypes, 
  updateBooking, 
  updateRoomStatus, 
  saveGuest,
  createPayment
} from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function CheckIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = usePmsAuth();

  // Extract bookingId if redirected from lists
  const queryParams = new URLSearchParams(location.search);
  const targetBookingId = queryParams.get("bookingId");

  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);

  // Selections
  const [selectedBookingId, setSelectedBookingId] = useState(targetBookingId || "");
  const [booking, setBooking] = useState(null);
  const [guest, setGuest] = useState(null);

  // Form Fields
  const [guestForm, setGuestForm] = useState({
    idType: "Aadhaar Card",
    idNumber: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    nationality: "Indian"
  });

  const [checkInRoomId, setCheckInRoomId] = useState("");
  const [collectAmount, setCollectAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [referenceId, setReferenceId] = useState("");

  const loadInitialData = async () => {
    try {
      const [allBookings, allGuests, allRooms, allRoomTypes] = await Promise.all([
        getBookings(),
        getGuests(),
        getRooms(),
        getRoomTypes()
      ]);

      // Only care about Confirmed (Reserved) bookings for check-in
      const arrivals = allBookings.filter(b => b.status === "Confirmed");
      setConfirmedBookings(arrivals);
      setGuests(allGuests);
      setRooms(allRooms);
      setRoomTypes(allRoomTypes);

      if (targetBookingId) {
        const foundB = allBookings.find(b => b.bookingId === targetBookingId);
        if (foundB) {
          setBooking(foundB);
          setCheckInRoomId(foundB.roomId || "");
          const foundG = allGuests.find(g => g.guestId === foundB.guestId);
          if (foundG) {
            setGuest(foundG);
            setGuestForm({
              idType: foundG.idType || "Aadhaar Card",
              idNumber: foundG.idNumber || "",
              address: foundG.address || "",
              city: foundG.city || "",
              state: foundG.state || "",
              pinCode: foundG.pinCode || "",
              nationality: foundG.nationality || "Indian"
            });
          }
        }
      }
    } catch (err) {
      console.error("CheckIn load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [targetBookingId]);

  // Handle manual booking selection in form
  const handleBookingChange = (e) => {
    const bId = e.target.value;
    setSelectedBookingId(bId);
    setErrorMsg("");
    
    if (!bId) {
      setBooking(null);
      setGuest(null);
      return;
    }

    const foundB = confirmedBookings.find(b => b.bookingId === bId);
    if (foundB) {
      setBooking(foundB);
      setCheckInRoomId(foundB.roomId || "");
      const foundG = guests.find(g => g.guestId === foundB.guestId);
      if (foundG) {
        setGuest(foundG);
        setGuestForm({
          idType: foundG.idType || "Aadhaar Card",
          idNumber: foundG.idNumber || "",
          address: foundG.address || "",
          city: foundG.city || "",
          state: foundG.state || "",
          pinCode: foundG.pinCode || "",
          nationality: foundG.nationality || "Indian"
        });
      }
    }
  };

  const getRoomTypeName = (roomTypeId) => {
    const rt = roomTypes.find(t => t.roomTypeId === roomTypeId);
    return rt ? rt.name : "Unknown Category";
  };

  const getGuestName = (guestId) => {
    const g = guests.find(guest => guest.guestId === guestId);
    return g ? g.fullName : "Unknown Guest";
  };

  const availableRoomsOfCategory = rooms.filter(r => 
    r.roomTypeId === booking?.roomTypeId && 
    (r.status === "available" || r.status === "cleaning" || r.roomId === booking?.roomId)
  );

  const nextStep = async () => {
    setErrorMsg("");
    if (activeStep === 1) {
      if (!booking) {
        setErrorMsg("Please select an active reservation to check in.");
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      // Validate Guest Profile Data
      if (!guestForm.idNumber) {
        setErrorMsg("Guest Identification Number is required for police verification checks.");
        return;
      }
      if (!guestForm.address || !guestForm.city) {
        setErrorMsg("Complete address and city are required for operational records.");
        return;
      }
      
      // Save updated guest profile details
      try {
        await saveGuest({
          ...guest,
          ...guestForm
        }, user);
        setActiveStep(3);
      } catch (err) {
        setErrorMsg("Failed to save updated guest profile: " + err.message);
      }
    } else if (activeStep === 3) {
      // Validate Room Assignment
      if (!checkInRoomId) {
        setErrorMsg("Please select and assign a physical room number.");
        return;
      }
      setActiveStep(4);
    }
  };

  const prevStep = () => {
    setActiveStep(prev => Math.max(1, prev - 1));
  };

  const handleCompleteCheckIn = async () => {
    setErrorMsg("");
    try {
      setLoading(true);

      // 1. Process payment if recorded
      if (collectAmount > 0) {
        await createPayment({
          bookingId: booking.bookingId,
          invoiceId: `SR-INV-${booking.bookingId.split("-")[2]}`, // Synchronized invoice ID
          amount: Number(collectAmount),
          paymentMode,
          referenceId,
          paymentType: "Advance"
        }, user);
      }

      // 2. Perform room status changes
      // Release old room if pre-assigned room changed
      if (booking.roomId && booking.roomId !== checkInRoomId) {
        await updateRoomStatus(booking.roomId, "available", `Check-in re-assignment from ${booking.bookingId}`, user);
      }
      // Assign physical room to 'occupied'
      await updateRoomStatus(checkInRoomId, "occupied", `Checked In guest for ${booking.bookingId}`, user);

      // 3. Update booking status to Checked In
      await updateBooking(booking.bookingId, {
        roomId: checkInRoomId,
        status: "Checked In",
        actualCheckIn: new Date().toISOString()
      }, user);

      setSuccessMsg(`Guest check-in for booking ${booking.bookingId} completed successfully!`);
      setTimeout(() => {
        navigate("/bookings");
      }, 1500);
    } catch (err) {
      setErrorMsg("Failed to complete check-in: " + err.message);
      setLoading(false);
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
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
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
            <h1 className="pms-page-header-title">Check-In Wizard</h1>
            <p className="pms-page-header-subtitle">Perform check-in procedures, verify IDs, and assign keys</p>
          </div>
        </div>
      </div>

      {/* Step Indicator Progress Bar */}
      <div className="flex justify-between items-center rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        {[
          { step: 1, label: "Select Arrival", icon: FileText },
          { step: 2, label: "Verify Identity", icon: User },
          { step: 3, label: "Room Placement", icon: Bed },
          { step: 4, label: "Prepayment Ledger", icon: CreditCard }
        ].map((s) => (
          <div key={s.step} className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
              activeStep === s.step 
                ? "bg-red-800 text-white" 
                : activeStep > s.step 
                  ? "bg-green-600 text-white" 
                  : "bg-gray-100 text-gray-400"
            }`}>
              {activeStep > s.step ? <Check className="h-4 w-4" /> : s.step}
            </div>
            <span className={`hidden text-xs font-semibold sm:inline ${
              activeStep === s.step ? "text-red-850" : "text-gray-500"
            }`}>{s.label}</span>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800 border border-red-155">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-800 border border-green-155">
          <Check className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Step content panels */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        
        {/* Step 1: Select Booking Arrival */}
        {activeStep === 1 && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Select Booking for Check-In</h2>
            <p className="text-xs text-gray-500">Pick from today's scheduled arrivals to initiate check-in processes.</p>
            
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pending Arrivals</label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-red-500 focus:outline-none bg-white"
                value={selectedBookingId}
                onChange={handleBookingChange}
              >
                <option value="">-- Select Pending Arrival Reservation --</option>
                {confirmedBookings.map(b => (
                  <option key={b.bookingId} value={b.bookingId}>
                    {b.bookingId} - {getGuestName(b.guestId)} (Room: {b.roomId ? `Room ${b.roomId}` : "Unassigned"} | {getRoomTypeName(b.roomTypeId)})
                  </option>
                ))}
              </select>
            </div>

            {booking && (
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Guest Profile</p>
                  <p className="font-bold text-gray-800 mt-0.5">{getGuestName(booking.guestId)}</p>
                  <p className="text-xs text-gray-600 mt-1">Adults: {booking.adultsCount} | Children: {booking.childrenCount || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Stay Schedule</p>
                  <p className="font-bold text-gray-800 mt-0.5">{booking.checkInDate} to {booking.checkOutDate}</p>
                  <p className="text-xs text-gray-600 mt-1">Nights: {booking.nightsCount} | Category: {getRoomTypeName(booking.roomTypeId)}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Verification of ID details */}
        {activeStep === 2 && guest && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Verify Identity Card & Address</h2>
            <p className="text-xs text-gray-500">Update complete guest profile details required for hotel registration book.</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-gray-500">Verification ID Type *</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none"
                  value={guestForm.idType}
                  onChange={e => setGuestForm({...guestForm, idType: e.target.value})}
                >
                  <option>Aadhaar Card</option>
                  <option>Passport</option>
                  <option>Driving License</option>
                  <option>Voter ID</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500">ID Number / Serial *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none"
                  value={guestForm.idNumber}
                  onChange={e => setGuestForm({...guestForm, idNumber: e.target.value})}
                  placeholder="ID verification code"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-500">Address *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none"
                  value={guestForm.address}
                  onChange={e => setGuestForm({...guestForm, address: e.target.value})}
                  placeholder="Street details"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500">City *</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none"
                  value={guestForm.city}
                  onChange={e => setGuestForm({...guestForm, city: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500">State</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none"
                  value={guestForm.state}
                  onChange={e => setGuestForm({...guestForm, state: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500">Pin Code</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none"
                  value={guestForm.pinCode}
                  onChange={e => setGuestForm({...guestForm, pinCode: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500">Nationality</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none"
                  value={guestForm.nationality}
                  onChange={e => setGuestForm({...guestForm, nationality: e.target.value})}
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Room Placement Selection */}
        {activeStep === 3 && booking && (
          <div className="space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">Room Assignment & Key Allocation</h2>
            <p className="text-xs text-gray-500">Assign a physical room matching the booked category type.</p>

            <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
              <span className="text-3xs font-semibold uppercase text-gray-400">Booked Room Type</span>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{getRoomTypeName(booking.roomTypeId)}</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Rooms ({availableRoomsOfCategory.length})</label>
              <select
                className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-red-500 focus:outline-none bg-white"
                value={checkInRoomId}
                onChange={e => setCheckInRoomId(e.target.value)}
              >
                <option value="">-- Choose Physical Room --</option>
                {availableRoomsOfCategory.map(r => (
                  <option key={r.roomId} value={r.roomId}>
                    Room {r.roomNumber} - Floor {r.floor} ({r.status})
                  </option>
                ))}
              </select>
              {availableRoomsOfCategory.length === 0 && (
                <p className="mt-2 text-xs text-red-800 font-semibold">Warning: No vacant rooms of this category. Consider upgrade or releasing cleaning blocks.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Collect Advance Ledger Prepayment */}
        {activeStep === 4 && booking && (
          <div className="space-y-6">
            <h2 className="font-serif text-lg font-bold text-gray-900">Collect Advance Prepayment</h2>
            <p className="text-xs text-gray-500">Record check-in deposit ledger payment to reduce checkout balances.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                <span className="text-4xs font-bold text-gray-400 uppercase">Grand Total Cost</span>
                <p className="text-lg font-bold text-gray-800 mt-1">₹{booking.grandTotal}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 border border-gray-200">
                <span className="text-4xs font-bold text-gray-400 uppercase">Previously Paid</span>
                <p className="text-lg font-bold text-green-700 mt-1">₹{booking.advancePaid || 0}</p>
              </div>
              <div className="rounded-lg bg-red-50/50 p-4 border border-red-100">
                <span className="text-4xs font-bold text-red-800 uppercase">Current Balance Due</span>
                <p className="text-lg font-bold text-red-800 mt-1">₹{booking.balanceDue}</p>
              </div>
            </div>

            <div className="border-t border-gray-150 pt-4 space-y-4">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Record Check-In Prepayment</h3>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500">Deposit Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={booking.balanceDue}
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none font-semibold text-gray-800"
                    value={collectAmount}
                    onChange={e => setCollectAmount(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500">Payment Mode</label>
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none bg-white"
                    value={paymentMode}
                    onChange={e => setPaymentMode(e.target.value)}
                  >
                    <option>UPI</option>
                    <option>Cash</option>
                    <option>Credit Card</option>
                    <option>Debit Card</option>
                    <option>Net Banking</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500">Transaction ID / Ref</label>
                  <input
                    type="text"
                    className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm focus:outline-none"
                    value={referenceId}
                    onChange={e => setReferenceId(e.target.value)}
                    placeholder="Reference code"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-8 flex justify-between border-t border-gray-150 pt-4">
          <button
            type="button"
            onClick={prevStep}
            disabled={activeStep === 1}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-650 hover:bg-gray-50 disabled:opacity-40"
          >
            Back
          </button>
          
          {activeStep < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="rounded-lg bg-red-800 px-5 py-2 text-sm font-semibold text-white hover:bg-red-900 transition-colors"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCompleteCheckIn}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 shadow-md"
            >
              Complete Check-In & Occupy Room
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
