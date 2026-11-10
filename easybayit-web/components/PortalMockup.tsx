"use client";

export default function PortalMockup() {
  const features = [
    { icon: "₪", label: "Incassi in tempo reale", desc: "Ogni pagamento registrato istantaneamente" },
    { icon: "📋", label: "Spese documentate", desc: "Ogni uscita con ricevuta allegata" },
    { icon: "📄", label: "Contratti sempre aggiornati", desc: "Firmati, archiviati, in italiano" },
    { icon: "📊", label: "Report mensile PDF", desc: "Pronto il 5 di ogni mese" },
  ];

  return (
    <div className="bg-[#111118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl w-full max-w-[480px]">
      {/* Top bar */}
      <div className="bg-[#0A0A0F] px-4 py-3 flex items-center gap-2 border-b border-white/5">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs text-[#9B9589] font-mono">Portale Proprietari</span>
      </div>

      {/* Nav */}
      <div className="flex gap-1 px-4 pt-4 pb-2">
        {["Dashboard", "Proprietà", "Documenti", "Assistenza"].map((tab, i) => (
          <span
            key={tab}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              i === 0 ? "bg-[#E8A87C]/15 text-[#E8A87C]" : "text-[#9B9589]"
            }`}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="px-4 pb-4">
        {/* Welcome */}
        <p className="text-xs text-[#9B9589] mb-3">
          Benvenuto, <span className="text-[#F5F4F0] font-medium">Marco R.</span> · Novembre 2026
        </p>

        {/* Summary boxes */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-[#0A0A0F] rounded-xl p-3 border border-white/5">
            <p className="text-[9px] text-[#9B9589] uppercase tracking-wider mb-1">Incassato</p>
            <p className="text-lg font-black text-[#E8A87C]">₪18.400</p>
            <p className="text-[9px] text-[#4A7C59]">+2.3% vs mese prec.</p>
          </div>
          <div className="bg-[#0A0A0F] rounded-xl p-3 border border-white/5">
            <p className="text-[9px] text-[#9B9589] uppercase tracking-wider mb-1">Spese</p>
            <p className="text-lg font-black text-[#F5F4F0]">₪1.260</p>
            <p className="text-[9px] text-red-400">3 voci documentate</p>
          </div>
          <div className="bg-[#0A0A0F] rounded-xl p-3 border border-[#E8A87C]/20 col-span-2">
            <p className="text-[9px] text-[#9B9589] uppercase tracking-wider mb-1">Netto mensile</p>
            <p className="text-2xl font-black text-[#E8A87C]">₪17.140</p>
          </div>
        </div>

        {/* Properties list */}
        <p className="text-[9px] text-[#9B9589] uppercase tracking-wider mb-2">Proprietà</p>
        <div className="space-y-1.5">
          {[
            { name: "Apt 4B — Ben Gurion St.", status: "Occupato", rent: "₪5.800" },
            { name: "Apt 7A — Dizengoff", status: "Occupato", rent: "₪6.200" },
            { name: "Studio — Jaffa", status: "Breve", rent: "₪6.400" },
          ].map((prop, i) => (
            <div key={i} className="flex items-center justify-between bg-[#0A0A0F] rounded-lg px-3 py-2 border border-white/5">
              <div>
                <p className="text-xs text-[#F5F4F0] font-medium">{prop.name}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${prop.status === "Breve" ? "bg-[#4A7C59]/20 text-[#4A7C59]" : "bg-[#E8A87C]/10 text-[#E8A87C]"}`}>
                  {prop.status}
                </span>
              </div>
              <span className="text-sm font-bold text-[#F5F4F0]">{prop.rent}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
