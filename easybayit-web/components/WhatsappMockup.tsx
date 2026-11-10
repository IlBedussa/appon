"use client";

export default function WhatsappMockup() {
  const messages = [
    { from: "owner", text: "Ciao, il rubinetto in cucina perde. Potete mandare qualcuno?" },
    { from: "ebi", text: "Ciao Marco! Registriamo subito il ticket. Qual è l'urgenza?" },
    { from: "owner", text: "Non è urgente, ma prima si risolve meglio è" },
    { from: "ebi", text: "Perfetto. Ticket aperto 🛠️ Tecnico disponibile domani mattina 9-11. Confermo?" },
    { from: "owner", text: "Sì, ottimo!" },
    { from: "ebi", text: "✅ Confermato! Ti mando foto prima/dopo e ricevuta a lavoro ultimato." },
  ];

  return (
    <div className="bg-[#111118] border border-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full">
      {/* WhatsApp header */}
      <div className="bg-[#1a1a24] px-4 py-3 flex items-center gap-3 border-b border-white/5">
        <div className="w-9 h-9 rounded-full bg-[#E8A87C]/20 flex items-center justify-center">
          <span className="text-sm font-bold text-[#E8A87C]">EB</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#F5F4F0]">Easybayit Support</p>
          <p className="text-[10px] text-[#4A7C59]">● online</p>
        </div>
        <div className="ml-auto flex gap-2">
          <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
            <span className="text-[8px] text-[#9B9589]">📞</span>
          </div>
          <div className="w-5 h-5 rounded bg-white/5 flex items-center justify-center">
            <span className="text-[8px] text-[#9B9589]">⋮</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-2 bg-[#0A0A0F]/50">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.from === "owner" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                msg.from === "owner"
                  ? "bg-[#E8A87C]/20 text-[#F5F4F0] rounded-tr-sm"
                  : "bg-[#111118] text-[#F5F4F0] border border-white/5 rounded-tl-sm"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Ticket card */}
      <div className="mx-4 mb-4 mt-2 bg-[#111118] border border-[#E8A87C]/20 rounded-xl p-3">
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] font-semibold text-[#E8A87C] uppercase tracking-wider">Ticket #1247</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4A7C59]/20 text-[#4A7C59] font-medium">In lavorazione</span>
        </div>
        <p className="text-xs text-[#F5F4F0] font-medium mb-1">Perdita rubinetto cucina</p>
        <div className="flex gap-3 text-[10px] text-[#9B9589]">
          <span>📍 Apt 4B, Tel Aviv</span>
          <span>🔧 Idraulico</span>
          <span>⏱ Normale</span>
        </div>
      </div>

      {/* Input bar */}
      <div className="px-4 pb-4">
        <div className="bg-[#1a1a24] rounded-full px-4 py-2.5 flex items-center gap-2 border border-white/5">
          <span className="text-xs text-[#9B9589] flex-1">Scrivi un messaggio...</span>
          <span className="text-sm">😊</span>
          <div className="w-6 h-6 rounded-full bg-[#E8A87C] flex items-center justify-center">
            <span className="text-[10px] text-[#0A0A0F]">↑</span>
          </div>
        </div>
      </div>
    </div>
  );
}
