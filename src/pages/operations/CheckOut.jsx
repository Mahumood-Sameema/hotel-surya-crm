import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  CreditCard, 
  Printer, 
  Check, 
  AlertCircle,
  TrendingUp,
  Receipt
} from "lucide-react";
import { 
  getBookings, 
  getGuests, 
  getRooms, 
  getRoomTypes, 
  updateBooking, 
  updateRoomStatus, 
  createPayment,
  getInvoices,
  getSettings
} from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function CheckOut() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = usePmsAuth();

  // Extract bookingId if passed from lists
  const queryParams = new URLSearchParams(location.search);
  const targetBookingId = queryParams.get("bookingId");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Data Lists
  const [activeBookings, setActiveBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [taxSettings, setTaxSettings] = useState({ cgstRate: 6, sgstRate: 6 });

  // Selected Booking
  const [selectedBookingId, setSelectedBookingId] = useState(targetBookingId || "");
  const [booking, setBooking] = useState(null);
  const [guest, setGuest] = useState(null);

  // Extra Charges ledger
  const [extraCharges, setExtraCharges] = useState([]);
  const [newCharge, setNewCharge] = useState({ description: "", amount: "" });

  // Additional Checkout Discount
  const [checkoutDiscount, setCheckoutDiscount] = useState(0);

  // Settlement Fields
  const [paymentMode, setPaymentMode] = useState("UPI");
  const [referenceId, setReferenceId] = useState("");

  // Calculated ledger states
  const [subTotal, setSubTotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [balanceDue, setBalanceDue] = useState(0);

  const loadData = async () => {
    try {
      const [allBookings, allGuests, allRooms, allRoomTypes, settings] = await Promise.all([
        getBookings(),
        getGuests(),
        getRooms(),
        getRoomTypes(),
        getSettings()
      ]);

      // Only care about Checked In bookings for checkout
      const activeStays = allBookings.filter(b => b.status === "Checked In");
      setActiveBookings(activeStays);
      setGuests(allGuests);
      setRooms(allRooms);
      setRoomTypes(allRoomTypes);
      if (settings) {
        setTaxSettings({
          cgstRate: settings.cgstRate ?? 6,
          sgstRate: settings.sgstRate ?? 6
        });
      }

      if (targetBookingId) {
        const foundB = allBookings.find(b => b.bookingId === targetBookingId);
        if (foundB) {
          setBooking(foundB);
          setExtraCharges(foundB.extraCharges || []);
          const foundG = allGuests.find(g => g.guestId === foundB.guestId);
          if (foundG) setGuest(foundG);
        }
      }
    } catch (err) {
      console.error("CheckOut load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [targetBookingId]);

  // Recalculate invoice details dynamically when pricing variables change
  useEffect(() => {
    if (!booking) return;

    // Subtotal: Base room rate * nights + sum of extra charges
    const baseRoomSubtotal = booking.ratePerNight * booking.nightsCount;
    const extrasSum = extraCharges.reduce((sum, item) => sum + Number(item.amount), 0);
    const rawSubtotal = baseRoomSubtotal + extrasSum;
    setSubTotal(rawSubtotal);

    // Discount Amount: Original booking discount + checkout additional discount
    let initialDiscount = 0;
    if (booking.discountType === "amount") {
      initialDiscount = booking.discountValue;
    } else {
      initialDiscount = Math.round((baseRoomSubtotal * booking.discountValue) / 100);
    }
    const totalDiscount = initialDiscount + Number(checkoutDiscount);
    setDiscountAmount(totalDiscount);

    // GST: Taxable amount * (CGST + SGST)
    const taxableAmount = Math.max(0, rawSubtotal - totalDiscount);
    const totalGstRate = taxSettings.cgstRate + taxSettings.sgstRate;
    const gst = Math.round((taxableAmount * totalGstRate) / 100);
    setGstAmount(gst);

    // Grand Total & Balance
    const total = taxableAmount + gst;
    setGrandTotal(total);

    const balance = Math.max(0, total - (booking.advancePaid || 0));
    setBalanceDue(balance);
  }, [booking, extraCharges, checkoutDiscount, taxSettings]);

  const handleBookingSelect = (e) => {
    const bId = e.target.value;
    setSelectedBookingId(bId);
    setErrorMsg("");
    setCheckoutDiscount(0);

    if (!bId) {
      setBooking(null);
      setGuest(null);
      setExtraCharges([]);
      return;
    }

    const foundB = activeBookings.find(b => b.bookingId === bId);
    if (foundB) {
      setBooking(foundB);
      setExtraCharges(foundB.extraCharges || []);
      const foundG = guests.find(g => g.guestId === foundB.guestId);
      if (foundG) setGuest(foundG);
    }
  };

  const addExtraChargeItem = () => {
    if (!newCharge.description || !newCharge.amount || Number(newCharge.amount) <= 0) {
      setErrorMsg("Please enter a valid description and positive amount.");
      return;
    }
    setErrorMsg("");
    setExtraCharges(prev => [...prev, {
      id: "chg_" + Math.random().toString(36).substring(2, 7),
      description: newCharge.description,
      amount: Number(newCharge.amount)
    }]);
    setNewCharge({ description: "", amount: "" });
  };

  const removeExtraChargeItem = (id) => {
    setExtraCharges(prev => prev.filter(c => c.id !== id));
  };

  const handleCompleteCheckout = async () => {
    setErrorMsg("");
    try {
      setLoading(true);

      // 1. Record settlement payment transaction if balance remains
      if (balanceDue > 0) {
        await createPayment({
          bookingId: booking.bookingId,
          invoiceId: `SR-INV-${booking.bookingId.split("-")[2]}`,
          amount: balanceDue,
          paymentMode,
          referenceId,
          paymentType: "Final Settlement"
        }, user);
      }

      // 2. Perform room status change (transition to 'cleaning')
      if (booking.roomId) {
        await updateRoomStatus(booking.roomId, "cleaning", `Checked Out guest from ${booking.bookingId}`, user);
      }

      // 3. Save finalized booking ledger and status
      const totalDiscountValue = (booking.discountType === "amount" ? booking.discountValue : 0) + Number(checkoutDiscount);
      
      const checkOutPayload = {
        extraCharges,
        subTotal,
        discountType: "amount", // Normalize to fixed discount amount at checkout
        discountValue: totalDiscountValue,
        discountAmount,
        gstAmount,
        grandTotal,
        advancePaid: grandTotal, // Settlement sets total payments paid to grand total
        balanceDue: 0,
        status: "Checked Out",
        actualCheckOut: new Date().toISOString()
      };

      await updateBooking(booking.bookingId, checkOutPayload, user);

      setSuccessMsg(`Guest check-out for booking ${booking.bookingId} finalized successfully!`);
      
      // Navigate directly to the printable Invoice details page
      setTimeout(async () => {
        const invoices = await getInvoices();
        const inv = invoices.find(i => i.bookingId === booking.bookingId);
        if (inv) {
          navigate(`/billing/invoices/${inv.invoiceId}`);
        } else {
          navigate("/bookings");
        }
      }, 1500);
    } catch (err) {
      setErrorMsg("Failed to complete check-out: " + err.message);
      setLoading(false);
    }
  };

  const getGuestName = (guestId) => {
    const g = guests.find(guest => guest.guestId === guestId);
    return g ? g.fullName : "Unknown Guest";
  };

  const getRoomName = (roomId) => {
    const r = rooms.find(room => room.roomId === roomId);
    return r ? `Room ${r.roomNumber}` : "Not Assigned";
  };

  const getRoomTypeName = (roomTypeId) => {
    const rt = roomTypes.find(t => t.roomTypeId === roomTypeId);
    return rt ? rt.name : "Unknown Category";
  };

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
            <h1 className="pms-page-header-title">Check-Out & Settlement</h1>
            <p className="pms-page-header-subtitle">Calculate final room invoice, add extras, and settle bills</p>
          </div>
        </div>
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

      {/* Select active guest stay */}
      {!targetBookingId && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Active Stays (Checked In)</label>
          <select
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-red-500 focus:outline-none bg-white"
            value={selectedBookingId}
            onChange={handleBookingSelect}
          >
            <option value="">-- Choose Guest Occupying Room --</option>
            {activeBookings.map(b => (
              <option key={b.bookingId} value={b.bookingId}>
                {b.bookingId} - {getGuestName(b.guestId)} (Room: {b.roomId ? `Room ${b.roomId}` : "Unassigned"} | {getRoomTypeName(b.roomTypeId)})
              </option>
            ))}
          </select>
        </div>
      )}

      {booking && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Stay summary & Incidentals */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* Stay Summary details */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-red-800" /> Stay Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-650">
                <div>
                  <p className="text-3xs font-bold text-gray-400 uppercase">Guest Details</p>
                  <p className="font-bold text-gray-900 mt-0.5">{getGuestName(booking.guestId)}</p>
                  {guest && <p className="text-xs text-gray-500 mt-1">ID: {guest.idType} - {guest.idNumber}</p>}
                </div>
                <div>
                  <p className="text-3xs font-bold text-gray-400 uppercase">Room Details</p>
                  <p className="font-bold text-gray-900 mt-0.5">{getRoomName(booking.roomId)}</p>
                  <p className="text-xs text-gray-500 mt-1">{getRoomTypeName(booking.roomTypeId)} @ ₹{booking.ratePerNight}/night</p>
                </div>
                <div>
                  <p className="text-3xs font-bold text-gray-400 uppercase">Stay Schedule</p>
                  <p className="font-semibold text-gray-800 mt-0.5">{booking.checkInDate} to {booking.checkOutDate}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Duration: {booking.nightsCount} Night(s)</p>
                </div>
                <div>
                  <p className="text-3xs font-bold text-gray-400 uppercase">Special Request Note</p>
                  <p className="text-xs text-gray-600 mt-0.5 italic">{booking.specialRequests || "No special requests"}</p>
                </div>
              </div>
            </div>

            {/* Extra Incidentals Panel */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-serif text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-red-800" /> Extra Charges & Incidentals
              </h2>
              <p className="text-xs text-gray-500 mb-4">Add room service, laundry bills, restaurant receipts, or extra beds charged to room.</p>

              {/* Added Incidentals List */}
              <div className="divide-y divide-gray-150 border-b border-gray-150 mb-4">
                {extraCharges.length > 0 ? (
                  extraCharges.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 text-sm">
                      <div>
                        <p className="font-semibold text-gray-850">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-gray-900">₹{item.amount}</span>
                        <button
                          type="button"
                          onClick={() => removeExtraChargeItem(item.id)}
                          className="text-red-700 hover:text-red-900 transition-colors p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-4 text-center text-xs text-gray-400">No incidentals added yet.</p>
                )}
              </div>

              {/* Incidental add fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    placeholder="Description (e.g. Room Service Dinner)"
                    className="w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                    value={newCharge.description}
                    onChange={e => setNewCharge({...newCharge, description: e.target.value})}
                  />
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Amount (₹)"
                    className="w-full rounded-md border border-gray-300 p-2 text-xs focus:outline-none"
                    value={newCharge.amount}
                    onChange={e => setNewCharge({...newCharge, amount: e.target.value})}
                  />
                  <button
                    type="button"
                    onClick={addExtraChargeItem}
                    className="bg-red-800 hover:bg-red-900 text-white rounded-md px-3 font-semibold text-xs transition-colors shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Settle Invoice Summary */}
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sticky top-6">
              <h2 className="font-serif text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-800" /> Settle Ledger
              </h2>

              <div className="space-y-3.5 border-b border-gray-150 pb-4 text-sm text-gray-650">
                <div className="flex justify-between">
                  <span>Room Tariff ({booking.nightsCount} nights):</span>
                  <span>₹{booking.ratePerNight * booking.nightsCount}</span>
                </div>
                {extraCharges.length > 0 && (
                  <div className="flex justify-between">
                    <span>Incidental Extras:</span>
                    <span>₹{extraCharges.reduce((sum, item) => sum + Number(item.amount), 0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-100 pt-2">
                  <span>Ledger Subtotal:</span>
                  <span>₹{subTotal}</span>
                </div>

                {/* Additional Checkout Discount field */}
                <div className="pt-2">
                  <label className="block text-4xs font-semibold text-gray-400 uppercase">Checkout Additional Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-md border border-gray-350 p-2 text-xs focus:outline-none"
                    value={checkoutDiscount}
                    onChange={e => setCheckoutDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-750 font-medium">
                    <span>Total Discount applied:</span>
                    <span>- ₹{discountAmount}</span>
                  </div>
                )}

                {/* GST splits */}
                <div className="border-t border-dashed border-gray-200 pt-2 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>CGST ({taxSettings.cgstRate}%):</span>
                    <span>₹{Math.round(gstAmount / 2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SGST ({taxSettings.sgstRate}%):</span>
                    <span>₹{Math.round(gstAmount / 2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-gray-700">
                    <span>Total GST Taxes ({taxSettings.cgstRate + taxSettings.sgstRate}%):</span>
                    <span>₹{gstAmount}</span>
                  </div>
                </div>

                <div className="flex justify-between font-bold text-gray-900 border-t border-gray-150 pt-2 text-base">
                  <span>Grand Total Bill:</span>
                  <span className="text-red-800">₹{grandTotal}</span>
                </div>

                <div className="flex justify-between font-bold text-green-700 border-t border-gray-100 pt-1">
                  <span>Total Payments Paid:</span>
                  <span>₹{booking.advancePaid || 0}</span>
                </div>
              </div>

              {/* Settlement section */}
              <div className="space-y-4 pt-4">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-gray-900">Remaining Balance:</span>
                  <span className={`text-lg ${balanceDue > 0 ? "text-amber-850" : "text-green-800"}`}>
                    ₹{balanceDue}
                  </span>
                </div>

                {balanceDue > 0 ? (
                  <div className="space-y-3 rounded-lg bg-gray-50 p-3 border border-gray-150">
                    <span className="text-4xs font-bold text-gray-400 uppercase block">Record final settlement payment</span>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-4xs font-semibold text-gray-500 uppercase">Method</label>
                        <select
                          className="mt-1 w-full rounded-md border border-gray-300 p-1.5 text-xs bg-white focus:outline-none"
                          value={paymentMode}
                          onChange={e => setPaymentMode(e.target.value)}
                        >
                          <option>UPI</option>
                          <option>Cash</option>
                          <option>Credit Card</option>
                          <option>Debit Card</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-4xs font-semibold text-gray-500 uppercase">Reference</label>
                        <input
                          type="text"
                          placeholder="Ref ID"
                          className="mt-1 w-full rounded-md border border-gray-350 p-1.5 text-xs focus:outline-none"
                          value={referenceId}
                          onChange={e => setReferenceId(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-green-50 p-3 border border-green-150 flex items-center gap-2 text-green-800 text-xs font-semibold">
                    <Check className="h-4 w-4 shrink-0" /> Bill is fully settled! Ready to check-out.
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCompleteCheckout}
                  className="w-full rounded-lg bg-red-850 py-3 text-sm font-semibold text-white shadow hover:bg-red-900 transition-colors"
                >
                  Confirm Settlement & Check-Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
