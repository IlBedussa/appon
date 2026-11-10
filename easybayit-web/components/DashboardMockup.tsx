"use client";

import { useState } from "react";

const tabs = ["Panoramica", "Incassi", "Spese", "Contratti"];

const barData = [
  { month: "Giu", value: 85 },
  { month: "Lug", value: 92 },
  { month: "Ago", value: 78 },
  { month: "Set", value: 95 },
  { month: "Ott", value: 88 },
  { month: "Nov", value: 100 },
];

export default function DashboardMockup() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="bg-[#111118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-full max-w-[520px]">
      {/* Header bar */}
      <div className="bg-[#0A0A0F] px-4 py-3 flex items-center gap-2 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs text-[#9B9589] font-mono">portale.easybayit.it</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === i
                ? "text-[#E8A87C] border-b-2 border-[#E8A87C]"
                : "text-[#9B9589] hover:text-[#F5F4F0]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Incassi", value: "₪18.400", color: "text-[#4A7C59]", bg: "bg-[#4A7C59]/10" },
            { label: "Spese", value: "₪1.260", color: "text-red-400", bg: "bg-red-400/10" },
            { label: "Netto", value: "₪17.140", color: "text-[#E8A87C]", bg: "bg-[#E8A87C]/10" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} rounded-xl p-3`}>
              <p className="text-[10px] text-[#9B9589] mb-1">{stat.label}</p>
              <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div className="mb-4">
          <p className="text-[10px] text-[#9B9589] mb-3">Incassi ultimi 6 mesi (₪)</p>
          <div className="flex items-end gap-2 h-28">
            {barData.map((bar) => (
              <div key={bar.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-[#E8A87C]/30 to-[#E8A87C] transition-all duration-300"
                  style={{ height: `${bar.value}%` }}
                />
                <span className="text-[9px] text-[#9B9589]">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent items */}
        <div className="space-y-2">
          <p className="text-[10px] text-[#9B9589] mb-2">Ultimi movimenti</p>
          {[
            { label: "Affitto Nov — Apt 4B", amount: "+₪5.800", type: "in" },
            { label: "Manutenzione idraulico", amount: "-₪340", type: "out" },
            { label: "Affitto Nov — Apt 7A", amount: "+₪6.200", type: "in" },
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center py-1.5 border-b border-white/5">
              <span className="text-xs text-[#F5F4F0]">{item.label}</span>
              <span className={`text-xs font-semibold ${item.type === "in" ? "text-[#4A7C59]" : "text-red-400"}`}>
                {item.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
