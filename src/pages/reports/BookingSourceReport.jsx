import React, { useState, useEffect } from "react";
import { 
  Globe, 
  UserPlus, 
  Phone, 
  Building, 
  BarChart3,
  PieChart
} from "lucide-react";
import { getBookings } from "../../services/pmsDbService";

export default function BookingSourceReport() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);

  // Stats
  const [sourcesList, setSourcesList] = useState([]);

  const loadData = async () => {
    try {
      const bList = await getBookings();
      setBookings(bList);

      // Group by source channel
      const channels = {
        "Walk-In": { count: 0, revenue: 0, icon: UserPlus, color: "bg-red-800", fill: "#B71C1C" },
        "Website": { count: 0, revenue: 0, icon: Globe, color: "bg-blue-600", fill: "#2563EB" },
        "OTA (Booking.com/Agoda)": { count: 0, revenue: 0, icon: BarChart3, color: "bg-green-600", fill: "#16A34A" },
        "Direct Call": { count: 0, revenue: 0, icon: Phone, color: "bg-amber-600", fill: "#D97706" },
        "Corporate": { count: 0, revenue: 0, icon: Building, color: "bg-purple-600", fill: "#9333EA" }
      };

      let grandTotalRev = 0;
      bList.forEach(b => {
        if (b.status !== "Cancelled") {
          const ch = b.source || "Walk-In";
          if (channels[ch]) {
            channels[ch].count++;
            channels[ch].revenue += b.grandTotal;
            grandTotalRev += b.grandTotal;
          } else {
            // Fallback default Walk-In
            channels["Walk-In"].count++;
            channels["Walk-In"].revenue += b.grandTotal;
            grandTotalRev += b.grandTotal;
          }
        }
      });

      const formatted = Object.keys(channels).map(name => {
        const item = channels[name];
        const pct = grandTotalRev > 0 ? Math.round((item.revenue / grandTotalRev) * 100) : 0;
        return {
          name,
          count: item.count,
          revenue: item.revenue,
          pct,
          icon: item.icon,
          color: item.color,
          fill: item.fill
        };
      });

      setSourcesList(formatted);
    } catch (e) {
      console.error("BookingSourceReport calculation error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-800 border-t-transparent"></div>
      </div>
    );
  }

  const maxRevenue = Math.max(...sourcesList.map(s => s.revenue), 1);

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Page Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Acquisition Channels</h1>
          <p className="pms-page-header-subtitle">Track reservation streams, online booking agents, and direct walk-ins metrics</p>
        </div>
      </div>

      {/* Row: Source Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Summary cards list */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-red-800" /> Channel Share & Bookings
          </h3>
          
          <div className="divide-y divide-gray-150">
            {sourcesList.map((src, idx) => {
              const IconComp = src.icon;
              return (
                <div key={idx} className="flex justify-between items-center py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-lg p-2 text-white ${src.color}`}>
                      <IconComp className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{src.name}</p>
                      <p className="text-3xs text-gray-500">{src.count} Booking(s) confirmed</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">₹{src.revenue}</p>
                    <p className="text-3xs text-gray-400 font-semibold">{src.pct}% share</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: SVG Bar Chart comparing revenue sizes */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900">Revenue Contribution Comparison</h3>
          
          <div className="h-64 pt-4">
            <svg viewBox="0 0 500 200" className="w-full h-full">
              {/* Grid Lines */}
              <line x1="120" y1="20" x2="480" y2="20" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="120" y1="95" x2="480" y2="95" stroke="#F3F4F6" strokeWidth="1" />
              <line x1="120" y1="170" x2="480" y2="170" stroke="#E5E7EB" strokeWidth="1.5" />

              {/* Horizontal Bars */}
              {sourcesList.map((src, idx) => {
                const label = src.name.length > 15 ? src.name.slice(0, 12) + "..." : src.name;
                const barHeight = 18;
                const y = 30 + idx * 30;
                const width = (src.revenue / maxRevenue) * 320;

                return (
                  <g key={idx} className="group cursor-pointer">
                    <title>{src.name}: ₹{src.revenue}</title>
                    {/* Y Axis Label */}
                    <text 
                      x="105" 
                      y={y + 13} 
                      textAnchor="end" 
                      className="text-4xs fill-gray-500 font-bold"
                    >
                      {label}
                    </text>
                    {/* Bar */}
                    <rect 
                      x="120" 
                      y={y} 
                      width={Math.max(5, width)} 
                      height={barHeight} 
                      rx="3" 
                      fill={src.fill} 
                    />
                    {/* Value inside/beside bar */}
                    <text 
                      x={120 + width + 8} 
                      y={y + 13} 
                      className="text-4xs font-semibold fill-gray-600"
                    >
                      ₹{src.revenue}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
