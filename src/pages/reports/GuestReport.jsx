import React, { useState, useEffect } from "react";
import { 
  Users, 
  Sparkles, 
  TrendingUp,
  MapPin,
  ChevronRight
} from "lucide-react";
import { getGuests } from "../../services/pmsDbService";

export default function GuestReport() {
  const [loading, setLoading] = useState(true);
  const [guests, setGuests] = useState([]);

  // Stats
  const [stats, setStats] = useState({
    totalGuests: 0,
    vipGuestsCount: 0,
    standardGuestsCount: 0,
    avgSpentPerGuest: 0
  });

  const [topGuests, setTopGuests] = useState([]);
  const [cityDistribution, setCityDistribution] = useState([]);

  const loadData = async () => {
    try {
      const gList = await getGuests();
      setGuests(gList);

      const total = gList.length;
      const vips = gList.filter(g => g.isVip).length;
      const standards = total - vips;
      
      const totalSpent = gList.reduce((sum, g) => sum + (g.totalSpent || 0), 0);
      const avgSpent = total > 0 ? Math.round(totalSpent / total) : 0;

      setStats({
        totalGuests: total,
        vipGuestsCount: vips,
        standardGuestsCount: standards,
        avgSpentPerGuest: avgSpent
      });

      // Sort and list top 5 guests
      const sortedBySpent = [...gList].sort((a,b) => (b.totalSpent || 0) - (a.totalSpent || 0)).slice(0, 5);
      setTopGuests(sortedBySpent);

      // Group cities
      const cities = {};
      gList.forEach(g => {
        const city = g.city || "Other";
        cities[city] = (cities[city] || 0) + 1;
      });

      const cityList = Object.keys(cities).map(name => ({
        name,
        count: cities[name],
        pct: total > 0 ? Math.round((cities[name] / total) * 100) : 0
      })).sort((a,b) => b.count - a.count).slice(0, 4);

      setCityDistribution(cityList);

    } catch (e) {
      console.error("GuestReport failed to calculate:", e);
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

  return (
    <div className="space-y-6 text-slate-800 animate-fade-in">
      {/* Page Header */}
      <div className="pms-page-header">
        <div>
          <h1 className="pms-page-header-title">Guest Insights</h1>
          <p className="pms-page-header-subtitle">Demographic reports, VIP guest rosters, and customer value logs</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Total Guests */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Total Registered Guests</span>
            <div className="rounded-lg bg-red-50 p-2 text-red-800">
              <Users className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalGuests}</h3>
            <p className="text-xs text-gray-500 mt-1">Unique profiles in CRM database</p>
          </div>
        </div>

        {/* Standard Guests */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Standard Guest Profiles</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-800">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">{stats.standardGuestsCount}</h3>
            <p className="text-xs text-gray-500 mt-1">Regular guest accounts</p>
          </div>
        </div>

        {/* Avg Spent */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-2xs font-bold text-gray-400 uppercase tracking-widest">Average Spent per Guest</span>
            <div className="rounded-lg bg-green-50 p-2 text-green-800">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">₹{stats.avgSpentPerGuest}</h3>
            <p className="text-xs text-gray-500 mt-1">Average guest lifetime value</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Top Guest List */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-gray-900">Top Loyal Guests (By Revenue)</h3>
          
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Guest Profile</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3 text-center">Stays Count</th>
                  <th className="px-4 py-3 text-right">Lifetime Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {topGuests.map((g, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3 flex items-center gap-2">
                      <div>
                        <div className="font-bold text-gray-900">{g.fullName}</div>
                        <div className="text-3xs text-gray-500 font-mono">{g.phone}</div>
                      </div>
                      {g.isVip && (
                        <span className="inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-4xs font-medium text-amber-800 uppercase">VIP</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs">{g.city || "N/A"}, {g.nationality}</td>
                    <td className="px-4 py-3 text-center font-semibold text-gray-800">{g.totalStays || 0}</td>
                    <td className="px-4 py-3 text-right font-bold text-red-800">₹{g.totalSpent || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Location Demographics */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-red-800" /> Geographic Ratios
          </h3>
          
          <div className="space-y-4 pt-4">
            {cityDistribution.map((city, idx) => {
              const bgColors = ["bg-red-800", "bg-blue-600", "bg-green-600", "bg-amber-600"];
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{city.name}</span>
                    <span>{city.pct}% ({city.count} profiles)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full ${bgColors[idx % bgColors.length]}`} style={{ width: `${city.pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
