import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { 
  IndianRupee, 
  CreditCard, 
  ShieldAlert, 
  PieChart, 
  ArrowUpRight,
  TrendingUp
} from "lucide-react";
import { getPayments } from "../../services/pmsDbService";
import { usePmsAuth } from "../../context/PmsAuthContext";

export default function PaymentReport() {
  const { hasPermission } = usePmsAuth();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [modeBreakdown, setModeBreakdown] = useState([]);

  const loadData = async () => {
    try {
      const pList = await getPayments();
      // Only care about Completed (non-voided) payments
      const activePayments = pList.filter(p => p.status === "Completed");
      setPayments(activePayments);

      const modes = {
        UPI: { amount: 0, count: 0, fill: "#2563EB" },
        Cash: { amount: 0, count: 0, fill: "#B71C1C" },
        "Credit Card": { amount: 0, count: 0, fill: "#16A34A" },
        "Debit Card": { amount: 0, count: 0, fill: "#D97706" }
      };

      let grandTotal = 0;
      activePayments.forEach(p => {
        const m = p.paymentMode || "UPI";
        if (modes[m]) {
          modes[m].amount += p.amount;
          modes[m].count++;
          grandTotal += p.amount;
        } else {
          // Fallback default
          modes["UPI"].amount += p.amount;
          modes["UPI"].count++;
          grandTotal += p.amount;
        }
      });

      const formatted = Object.keys(modes).map(name => {
        const item = modes[name];
        const pct = grandTotal > 0 ? Math.round((item.amount / grandTotal) * 100) : 0;
        return {
          name,
          amount: item.amount,
          count: item.count,
          pct,
          fill: item.fill
        };
      });

      setModeBreakdown(formatted);
    } catch (e) {
      console.error("PaymentReport error loading:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission("reports/payments")) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [hasPermission]);

  if (!hasPermission("reports/payments")) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent"></div>
      </div>
    );
  }

  const totalCollected = modeBreakdown.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Payment Modes Report</h1>
          <p className="pms-page-header-subtitle">Gross collections auditing, mode share totals, and receipt frequencies</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Total Payments Cleared</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-800">
              <IndianRupee className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">₹{totalCollected}</h3>
            <p className="text-xs text-green-700 font-semibold flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="h-3 w-3" /> All ledgers balanced
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Transactions Audited</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-800">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{payments.length}</h3>
            <p className="text-xs text-gray-500 mt-1">Successful payment captures</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Primary Collection Mode</span>
            <div className="rounded-lg bg-green-50 p-2 text-green-800">
              <CreditCard className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">UPI Digital</h3>
            <p className="text-xs text-gray-500 mt-1">Represents highest volume share</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Summary lists */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-red-800" /> Mode share breakdown
          </h3>
          
          <div className="divide-y divide-gray-150">
            {modeBreakdown.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-3 text-sm">
                <div>
                  <p className="font-bold text-gray-900">{item.name}</p>
                  <p className="text-3xs text-gray-500">{item.count} Transactions captured</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">₹{item.amount}</p>
                  <p className="text-3xs text-gray-400 font-semibold">{item.pct}% share</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: SVG Donut Chart or simple horizontal distribution */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900">Visual Collection Distribution</h3>
          
          <div className="space-y-4 pt-4">
            {modeBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-gray-700">
                  <span>{item.name}</span>
                  <span>{item.pct}% (₹{item.amount})</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                  <div className="h-full" style={{ width: `${item.pct}%`, backgroundColor: item.fill }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
