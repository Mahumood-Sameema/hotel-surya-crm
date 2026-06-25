import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Mail, 
  IndianRupee, 
  Building,
  CheckCircle,
  FileText
} from "lucide-react";
import { 
  getInvoices, 
  getBookings, 
  getGuests, 
  getRooms, 
  getRoomTypes, 
  getSettings, 
  getPayments 
} from "../../services/pmsDbService";

export default function InvoiceDetail() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [booking, setBooking] = useState(null);
  const [guest, setGuest] = useState(null);
  const [room, setRoom] = useState(null);
  const [roomType, setRoomType] = useState(null);
  const [hotelSettings, setHotelSettings] = useState(null);
  const [payments, setPayments] = useState([]);

  const loadInvoiceData = async () => {
    try {
      const [invoices, bookings, guests, rooms, roomTypes, settings, allPayments] = await Promise.all([
        getInvoices(),
        getBookings(),
        getGuests(),
        getRooms(),
        getRoomTypes(),
        getSettings(),
        getPayments()
      ]);

      const inv = invoices.find(i => i.invoiceId === invoiceId);
      if (!inv) {
        console.error("Invoice not found:", invoiceId);
        setLoading(false);
        return;
      }

      setInvoice(inv);
      setHotelSettings(settings);

      const bk = bookings.find(b => b.bookingId === inv.bookingId);
      if (bk) {
        setBooking(bk);
        const g = guests.find(guest => guest.guestId === bk.guestId);
        if (g) setGuest(g);
        const r = rooms.find(rm => rm.roomId === bk.roomId);
        if (r) setRoom(r);
        const rt = roomTypes.find(t => t.roomTypeId === bk.roomTypeId);
        if (rt) setRoomType(rt);
        
        // Find payments linked to this booking
        const bkPayments = allPayments.filter(p => p.bookingId === bk.bookingId && p.status === "Completed");
        setPayments(bkPayments);
      }
    } catch (e) {
      console.error("Error loading invoice detail page:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoiceData();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  // Convert numbers to words (Simple helper for Indian Rupees)
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('00052026' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Rupees Only' : 'Rupees Only';
    return str;
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center print:hidden">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800 max-w-lg mx-auto mt-12 print:hidden">
        <h3 className="font-serif text-lg font-bold">Invoice Not Found</h3>
        <p className="text-sm mt-1">We couldn't locate invoice record {invoiceId} in local storage database.</p>
        <button onClick={() => navigate("/billing/invoices")} className="mt-4 rounded bg-red-800 text-white px-4 py-2 font-semibold text-xs">
          Back to Invoices
        </button>
      </div>
    );
  }

  const roomTariffSubtotal = booking ? booking.ratePerNight * booking.nightsCount : 0;
  const extrasSum = booking && booking.extraCharges ? booking.extraCharges.reduce((sum, item) => sum + Number(item.amount), 0) : 0;
  const taxableAmount = Math.max(0, invoice.subTotal - invoice.discountAmount);
  
  const cgstRate = hotelSettings ? hotelSettings.cgstRate : 6;
  const sgstRate = hotelSettings ? hotelSettings.sgstRate : 6;

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:space-y-0 print:p-0 print:max-w-full">
      
      {/* Action Header Panel - Hidden on Print */}
      <div className="pms-page-header print:hidden">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="rounded-lg border border-gray-300 p-2 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="pms-page-header-title">Invoice Details</h1>
            <p className="pms-page-header-subtitle">Print tax receipt or download guest billing folios</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-red-850 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-900 transition-colors"
          >
            <Printer className="h-4 w-4" /> Print Invoice (Ctrl+P)
          </button>
        </div>
      </div>

      {/* Actual Printable Invoice Body */}
      <div className="rounded-xl border border-gray-250 bg-white p-8 shadow-sm font-sans text-sm text-gray-800 print:shadow-none print:border-none print:p-0">
        
        {/* Invoice Header: Hotel Details & Title */}
        <div className="flex justify-between items-start border-b-2 border-red-800 pb-6">
          <div>
            <h2 className="font-serif text-3xl font-extrabold text-red-850 tracking-tight">HOTEL SURYA RESIDENCY</h2>
            <p className="text-xs text-gray-600 mt-1 font-medium leading-relaxed">
              Near Anna Bus Stand, Meenakshipuram,<br />
              Nagercoil, Tamil Nadu, India - 629001
            </p>
            <p className="text-xs text-gray-500 mt-1 font-semibold">
              GSTIN: {hotelSettings?.hotelGstin || "33AAAAA1111A1Z1"} | Tel: +91 4652 230400
            </p>
          </div>
          <div className="text-right">
            <h3 className="font-serif text-xl font-bold text-gray-900 uppercase tracking-widest">TAX INVOICE</h3>
            <div className="mt-3 text-xs text-gray-600 space-y-1 font-mono text-left inline-block">
              <div>Invoice No: <span className="font-bold text-gray-900">{invoice.invoiceId}</span></div>
              <div>Invoice Date: <span className="font-bold text-gray-900">{invoice.invoiceDate}</span></div>
              <div>Booking Ref: <span className="font-bold text-gray-900">{invoice.bookingId}</span></div>
            </div>
          </div>
        </div>

        {/* Invoice Columns: Guest Billing & Room Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6 border-b border-gray-200">
          <div>
            <h4 className="text-xs font-bold text-red-850 uppercase tracking-wider mb-2">Billed To (Guest details)</h4>
            {guest ? (
              <div className="space-y-1 text-xs">
                <p className="font-bold text-sm text-gray-900">{guest.fullName}</p>
                <p>{guest.address || "No address on file"}</p>
                <p>{guest.city}, {guest.state} - {guest.pinCode}</p>
                <p>Mobile: {guest.phone} | Email: {guest.email || "N/A"}</p>
                {guest.idType && <p className="text-gray-500 font-medium">ID: {guest.idType} - {guest.idNumber}</p>}
              </div>
            ) : (
              <p className="text-gray-500">No guest details connected.</p>
            )}
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-850 uppercase tracking-wider mb-2">Folio Details (Stay Placement)</h4>
            {booking ? (
              <div className="space-y-1 text-xs grid grid-cols-2">
                <div>
                  <p className="text-gray-500">Room placement:</p>
                  <p className="font-semibold text-gray-900">{room ? `Room ${room.roomNumber}` : "Room N/A"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Room type:</p>
                  <p className="font-semibold text-gray-900">{roomType ? roomType.name : "N/A"}</p>
                </div>
                <div className="mt-2">
                  <p className="text-gray-500">Check-in Date:</p>
                  <p className="font-medium text-gray-800">{booking.checkInDate}</p>
                </div>
                <div className="mt-2">
                  <p className="text-gray-500">Check-out Date:</p>
                  <p className="font-medium text-gray-800">{booking.checkOutDate}</p>
                </div>
                <div className="mt-2 col-span-2">
                  <p className="text-gray-500">Duration details:</p>
                  <p className="font-medium text-gray-900">{booking.nightsCount} Night(s) / {booking.adultsCount} Adult(s)</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No booking details connected.</p>
            )}
          </div>
        </div>

        {/* Itemized Charge Ledger Table */}
        <div className="py-6">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-300 text-gray-555 font-bold uppercase tracking-wider">
                <th className="py-2.5">S.No</th>
                <th className="py-2.5 pl-4">Description / Stay Items</th>
                <th className="py-2.5 text-right">Unit Rate (₹)</th>
                <th className="py-2.5 text-center">Qty / Nights</th>
                <th className="py-2.5 text-right pr-4">Taxable Value (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150">
              {booking && (
                <>
                  {/* Room Accommodation item */}
                  <tr>
                    <td className="py-3">1</td>
                    <td className="py-3 pl-4">
                      <div className="font-semibold text-gray-900">Room Accommodation Charge</div>
                      <div className="text-4xs text-gray-500">Tariff placement for Room {room?.roomNumber} ({roomType?.name})</div>
                    </td>
                    <td className="py-3 text-right">₹{booking.ratePerNight}</td>
                    <td className="py-3 text-center">{booking.nightsCount}</td>
                    <td className="py-3 text-right pr-4">₹{roomTariffSubtotal}</td>
                  </tr>

                  {/* Incidentals extras charges */}
                  {booking.extraCharges && booking.extraCharges.map((item, index) => (
                    <tr key={item.id || index}>
                      <td className="py-3">{index + 2}</td>
                      <td className="py-3 pl-4">
                        <div className="font-semibold text-gray-900">{item.description}</div>
                        <div className="text-4xs text-gray-500">Incidental Room charge</div>
                      </td>
                      <td className="py-3 text-right">₹{item.amount}</td>
                      <td className="py-3 text-center">1</td>
                      <td className="py-3 text-right pr-4">₹{item.amount}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Subtotals, Discounts, Taxes splits, Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-350 pt-6">
          {/* Notes & Words */}
          <div className="text-xs space-y-4">
            <div>
              <span className="font-bold text-gray-950 uppercase tracking-wider block text-3xs mb-1">Amount In Words</span>
              <p className="font-semibold text-gray-900 italic">{numberToWords(invoice.grandTotal)}</p>
            </div>
            <div className="border border-gray-200 bg-gray-50/50 rounded-lg p-3 text-3xs text-gray-500 font-medium">
              <span className="font-bold block text-gray-700 uppercase mb-1">Terms & Conditions</span>
              <ol className="list-decimal pl-3.5 space-y-0.5">
                <li>This is a computer generated invoice and requires no physical signature.</li>
                <li>All disputes are subject to Nagercoil jurisdiction only.</li>
                <li>Check-out time is 12:00 Noon. Late stays subject to charge.</li>
              </ol>
            </div>
          </div>

          {/* Settle Details columns */}
          <div className="text-xs text-gray-700 space-y-2.5 font-medium pl-0 md:pl-12">
            <div className="flex justify-between">
              <span>Ledger Subtotal:</span>
              <span>₹{invoice.subTotal}</span>
            </div>
            
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-red-800">
                <span>Discount applied:</span>
                <span>- ₹{invoice.discountAmount}</span>
              </div>
            )}

            <div className="flex justify-between font-bold text-gray-900 border-t border-gray-150 pt-2">
              <span>Taxable Value:</span>
              <span>₹{taxableAmount}</span>
            </div>

            <div className="border-t border-dashed border-gray-250 py-1.5 space-y-1 text-3xs">
              <div className="flex justify-between text-gray-500">
                <span>CGST ({cgstRate}%):</span>
                <span>₹{Math.round(invoice.gstAmount / 2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>SGST ({sgstRate}%):</span>
                <span>₹{Math.round(invoice.gstAmount / 2)}</span>
              </div>
            </div>

            <div className="flex justify-between font-extrabold text-gray-950 border-y border-gray-200 py-2.5 text-base">
              <span className="text-red-850">Invoice Grand Total:</span>
              <span className="text-red-850">₹{invoice.grandTotal}</span>
            </div>

            {/* Paid settlement transaction entries */}
            <div className="space-y-1.5 pt-1 text-3xs">
              <span className="font-bold text-gray-500 uppercase tracking-widest block mb-1">Settlement Details</span>
              {payments.map(p => (
                <div key={p.paymentId} className="flex justify-between text-gray-650">
                  <span>{new Date(p.paymentDate).toLocaleDateString("en-IN")} ({p.paymentMode} - {p.paymentType})</span>
                  <span className="font-bold text-green-700">₹{p.amount}</span>
                </div>
              ))}
              {payments.length === 0 && (
                <div className="flex justify-between text-red-750">
                  <span>No payment settled</span>
                  <span>₹0</span>
                </div>
              )}
            </div>

            <div className="flex justify-between border-t-2 border-gray-300 pt-2 font-bold text-gray-950">
              <span>Balance Due (Final):</span>
              <span className={invoice.balanceDue > 0 ? "text-amber-805" : "text-green-800"}>
                ₹{invoice.balanceDue}
              </span>
            </div>
          </div>
        </div>

        {/* Invoice Footer Signoff */}
        <div className="mt-16 flex justify-between items-end border-t border-gray-200 pt-8 text-xs font-semibold">
          <div>
            <p className="text-gray-400">Prepared By</p>
            <p className="text-gray-900 mt-4 font-bold border-t border-dashed border-gray-400 pt-1 w-40 text-center">Front Desk Staff</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">For Hotel Surya Residency</p>
            <p className="text-gray-900 mt-12 font-bold uppercase">Authorized Signatory</p>
          </div>
        </div>

      </div>
    </div>
  );
}
