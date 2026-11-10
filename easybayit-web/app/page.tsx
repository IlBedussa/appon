"use client";

import Navbar from "@/components/Navbar";
import FadeUp from "@/components/FadeUp";
import AnimatedCounter from "@/components/AnimatedCounter";
import DashboardMockup from "@/components/DashboardMockup";
import WhatsappMockup from "@/components/WhatsappMockup";
import PortalMockup from "@/components/PortalMockup";
import { motion } from "framer-motion";
import {
  Eye,
  Clock,
  Wrench,
  FileCheck,
  ChevronDown,
  ArrowRight,
  Zap,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

// ─── Section: Hero ───────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      {/* Gradient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E8A87C]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[#4A7C59]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 w-full py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-6"
            >
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E8A87C]/10 border border-[#E8A87C]/20 text-[#E8A87C] text-xs font-semibold uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8A87C] animate-pulse" />
                Property management in Israele · dal 2016
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-[72px] md:text-[90px] font-black leading-[0.95] tracking-tight text-[#F5F4F0] mb-6"
            >
              Il tuo
              <br />
              immobile.
              <br />
              <span className="text-[#E8A87C]">Affittato.</span>
              <br />
              Sempre.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-[#9B9589] text-lg leading-relaxed mb-10 max-w-lg"
            >
              Da 10 anni gestiamo 150 appartamenti con gli stessi tecnici di
              fiducia. Ogni mese ricevi un report con ogni shekel, ogni
              contratto, ogni intervento.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-wrap gap-4 mb-14"
            >
              <a
                href="#contatto"
                className="px-7 py-3.5 bg-[#E8A87C] text-[#0A0A0F] font-bold rounded-full hover:bg-[#E8A87C]/90 transition-all hover:scale-105 shadow-lg shadow-[#E8A87C]/20"
              >
                Ricevi una proposta
              </a>
              <a
                href="#portale"
                className="px-7 py-3.5 text-[#F5F4F0] font-medium hover:text-[#E8A87C] transition-colors flex items-center gap-2 group"
              >
                Guarda il portale
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-wrap gap-8 pt-8 border-t border-white/5"
            >
              {[
                { number: 150, suffix: "", label: "Appartamenti gestiti" },
                { number: 10, suffix: "+", label: "Anni di esperienza" },
                { number: 0, suffix: "", label: "Mesi sfitti" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-4xl font-black text-[#F5F4F0]">
                    <AnimatedCounter to={stat.number} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-[#9B9589] mt-1">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex justify-center lg:justify-end"
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] text-[#9B9589] uppercase tracking-widest">Scorri</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <ChevronDown size={16} className="text-[#9B9589]" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ─── Section: Il Problema ─────────────────────────────────────────────────────
function IlProblema() {
  const cards = [
    {
      icon: <Eye size={22} className="text-[#E8A87C]" />,
      problem: "Cosa sta succedendo?",
      desc: "Incassi poco chiari, aggiornamenti incompleti. Scopri cosa è successo nel tuo appartamento solo quando qualcosa va storto.",
    },
    {
      icon: <Clock size={22} className="text-[#E8A87C]" />,
      problem: "L'inquilino sta pagando?",
      desc: "Paura del ritardo, nessuna visibilità sui versamenti. Aspetti il bonifico senza sapere se sta per arrivare.",
    },
    {
      icon: <Wrench size={22} className="text-[#E8A87C]" />,
      problem: "Chi decide sulle riparazioni?",
      desc: "Ogni guasto diventa una trattativa. Preventivi che non capisci, decisioni che non puoi controllare a distanza.",
    },
  ];

  return (
    <section className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <h2 className="text-[48px] md:text-[56px] font-bold text-[#F5F4F0] mb-16 max-w-xl leading-tight">
            La distanza non è sempre geografica.
          </h2>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className="group bg-[#111118] border border-white/5 rounded-2xl p-7 hover:border-[#E8A87C]/30 hover:scale-[1.02] transition-all duration-300 cursor-default">
                <div className="w-11 h-11 rounded-xl bg-[#E8A87C]/10 flex items-center justify-center mb-5">
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold text-[#F5F4F0] italic mb-3">
                  &ldquo;{card.problem}&rdquo;
                </h3>
                <p className="text-[#9B9589] leading-relaxed">{card.desc}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: La Soluzione ─────────────────────────────────────────────────────
function LaSoluzione() {
  const features = [
    {
      icon: <FileCheck size={28} className="text-[#E8A87C]" />,
      title: "Onestà verificabile",
      sub: "Ogni spesa ha un documento",
      desc: "Ricevuta, fattura, foto: ogni centesimo speso per il tuo appartamento ha una prova allegata. Niente spese misteriose, niente preventivi gonfiati.",
      visual: (
        <div className="bg-[#0A0A0F] rounded-xl p-5 border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#4A7C59]/20 flex items-center justify-center">
              <FileCheck size={16} className="text-[#4A7C59]" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#F5F4F0]">Manutenzione impianto</p>
              <p className="text-[10px] text-[#9B9589]">3 Nov 2026</p>
            </div>
            <span className="ml-auto text-sm font-bold text-[#F5F4F0]">₪340</span>
          </div>
          {["📸 Foto prima-dopo.jpg", "🧾 Fattura idraulico.pdf", "✅ Approvato da te"].map((item, i) => (
            <div key={i} className="text-xs text-[#9B9589] py-1.5 border-b border-white/5 last:border-0">
              {item}
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: <Zap size={28} className="text-[#E8A87C]" />,
      title: "Tecnologia che toglie lavoro",
      sub: "Prezzi monitorati, report automatici",
      desc: "Il portale aggiorna i dati in tempo reale. Il report mensile arriva puntuale il 5 di ogni mese. Tu apri il PDF e hai tutto — senza chiamate, senza WhatsApp di emergenza.",
      visual: (
        <div className="bg-[#0A0A0F] rounded-xl p-5 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#9B9589]">Report — Ottobre 2026</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4A7C59]/20 text-[#4A7C59]">Consegnato</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Incassi", v: "₪18.400", bar: 95 },
              { label: "Spese", v: "₪1.260", bar: 7 },
              { label: "Netto", v: "₪17.140", bar: 88 },
            ].map((row) => (
              <div key={row.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#9B9589]">{row.label}</span>
                  <span className="text-[#F5F4F0] font-medium">{row.v}</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#E8A87C] rounded-full" style={{ width: `${row.bar}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      icon: <TrendingUp size={28} className="text-[#E8A87C]" />,
      title: "10 anni, 150 appartamenti",
      sub: "Zero mesi sfitti",
      desc: "Non è fortuna. È una rete costruita in un decennio: tecnici affidabili, inquilini selezionati, contratti in ordine. Il risultato? Nessun appartamento rimasto vuoto da quando esiste Easybayit.",
      visual: (
        <div className="bg-[#0A0A0F] rounded-xl p-5 border border-white/5">
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { n: "150", l: "Appartamenti" },
              { n: "10+", l: "Anni" },
              { n: "0", l: "Mesi sfitti" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-2xl font-black text-[#E8A87C]">{s.n}</div>
                <div className="text-[10px] text-[#9B9589] mt-0.5">{s.l}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] text-[#9B9589]">Tasso di occupazione storico</span>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#4A7C59] rounded-full w-[100%]" />
            </div>
            <p className="text-right text-[10px] text-[#4A7C59] mt-1">100%</p>
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="chi-siamo" className="py-28 px-6 bg-[#111118]/50">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <h2 className="text-[48px] md:text-[56px] font-bold text-[#F5F4F0] mb-20 max-w-xl leading-tight">
            Persone di fiducia.
            <br />
            <span className="text-[#E8A87C]">Numeri che puoi controllare.</span>
          </h2>
        </FadeUp>

        <div className="space-y-20">
          {features.map((feat, i) => (
            <FadeUp key={i} delay={0.1}>
              <div className={`grid md:grid-cols-2 gap-12 items-center ${i % 2 === 1 ? "md:[direction:rtl]" : ""}`}>
                <div className={i % 2 === 1 ? "[direction:ltr]" : ""}>
                  <div className="w-14 h-14 rounded-2xl bg-[#E8A87C]/10 flex items-center justify-center mb-5">
                    {feat.icon}
                  </div>
                  <p className="text-[#E8A87C] text-sm font-semibold mb-2 uppercase tracking-wider">{feat.sub}</p>
                  <h3 className="text-3xl font-bold text-[#F5F4F0] mb-4">{feat.title}</h3>
                  <p className="text-[#9B9589] text-lg leading-relaxed">{feat.desc}</p>
                </div>
                <div className={i % 2 === 1 ? "[direction:ltr]" : ""}>{feat.visual}</div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Servizi ─────────────────────────────────────────────────────────
function Servizi() {
  const services = [
    {
      tag: "Più richiesto",
      title: "Affitto gestito",
      desc: "Troviamo l'inquilino, firmiamo il contratto, incassiamo il canone. Gestiamo ogni comunicazione, ogni riparazione, ogni rinnovo. Tu ricevi il netto ogni mese.",
      features: ["Selezione inquilini", "Contratto in italiano e ebraico", "Incasso e bonifico mensile", "Report dettagliato"],
      gradient: "from-[#E8A87C]/20 via-transparent to-transparent",
      cta: "Scopri →",
    },
    {
      tag: "Per chi viaggia",
      title: "Custodia privata",
      desc: "L'appartamento non è affittato ma deve restare curato. Visite programmate, report fotografico mensile, casa pronta al tuo arrivo.",
      features: ["Visite bisettimanali", "Report fotografico", "Gestione bollette", "Pronto all'arrivo"],
      gradient: "from-[#4A7C59]/15 via-transparent to-transparent",
      cta: "Scopri →",
    },
    {
      tag: "Massimo rendimento",
      title: "Affitti brevi",
      desc: "Il tuo appartamento su Airbnb, Booking e Yad2. Ospiti seguiti in italiano, ebraico e inglese. Fiscalità israeliana in ordine.",
      features: ["Annunci multipiattaforma", "Check-in/out gestito", "Comunicazione trilingue", "Rendicontazione fiscale"],
      gradient: "from-[#E8A87C]/10 via-[#4A7C59]/5 to-transparent",
      cta: "Scopri →",
    },
  ];

  return (
    <section id="servizi" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <div className="mb-16">
            <span className="text-[#E8A87C] text-sm font-semibold uppercase tracking-widest">Servizi</span>
            <h2 className="text-[48px] md:text-[56px] font-bold text-[#F5F4F0] mt-2 leading-tight">
              Tre modi di prenderci
              <br />
              cura della tua casa.
            </h2>
          </div>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {services.map((s, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div className="group bg-[#111118] border border-white/5 rounded-2xl overflow-hidden hover:border-[#E8A87C]/25 hover:scale-[1.02] transition-all duration-300 h-full flex flex-col">
                {/* Gradient header */}
                <div className={`h-32 bg-gradient-to-br ${s.gradient} flex items-end px-6 pb-4`}>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/10 text-[#F5F4F0] font-medium uppercase tracking-wider">
                    {s.tag}
                  </span>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <h3 className="text-2xl font-bold text-[#F5F4F0] mb-3">{s.title}</h3>
                  <p className="text-[#9B9589] leading-relaxed mb-5 flex-1">{s.desc}</p>

                  <ul className="space-y-2 mb-6">
                    {s.features.map((f, fi) => (
                      <li key={fi} className="flex items-center gap-2 text-sm text-[#9B9589]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#E8A87C] shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <a
                    href="#contatto"
                    className="inline-flex items-center gap-1 text-sm text-[#E8A87C] font-semibold group-hover:gap-2 transition-all"
                  >
                    {s.cta} <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Come Lavoriamo ──────────────────────────────────────────────────
function ComeLavoriamo() {
  const steps = [
    { n: "01", title: "Ti ascoltiamo", desc: "Una call gratuita per capire la tua situazione, i tuoi obiettivi, le tue preoccupazioni." },
    { n: "02", title: "Definiamo il perimetro", desc: "Proposta scritta, senza asterischi. Saprai esattamente cosa facciamo e quanto costa." },
    { n: "03", title: "Prendiamo in carico", desc: "Fotosopralluogo, inventario, chiavi. Dal giorno X il tuo appartamento è nelle nostre mani." },
    { n: "04", title: "Tu mantieni il controllo", desc: "Portale accesso 24/7, report mensile, risposta entro 2 ore lavorative a qualsiasi domanda." },
  ];

  return (
    <section className="py-28 px-6 bg-[#111118]/50">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <span className="text-[#E8A87C] text-sm font-semibold uppercase tracking-widest">Come lavoriamo</span>
          <h2 className="text-[48px] md:text-[56px] font-bold text-[#F5F4F0] mt-2 mb-16 leading-tight max-w-xl">
            Quattro passi.
            <br />
            Poi il resto è nostro.
          </h2>
        </FadeUp>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, i) => (
            <FadeUp key={i} delay={i * 0.12}>
              <motion.div
                className="bg-[#0A0A0F] border border-white/5 rounded-2xl p-6 hover:border-[#E8A87C]/20 transition-all"
                whileHover={{ scale: 1.02 }}
              >
                <div className="text-5xl font-black text-[#E8A87C] mb-4 leading-none">{step.n}</div>
                <h3 className="text-lg font-bold text-[#F5F4F0] mb-2">{step.title}</h3>
                <p className="text-sm text-[#9B9589] leading-relaxed">{step.desc}</p>
              </motion.div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: Portale Proprietari ─────────────────────────────────────────────
function PortaleProprietari() {
  const features = [
    { icon: "₪", label: "Incassi in tempo reale", desc: "Ogni pagamento registrato istantaneamente" },
    { icon: "📋", label: "Spese documentate", desc: "Ogni uscita con ricevuta allegata" },
    { icon: "📄", label: "Contratti aggiornati", desc: "In italiano, sempre leggibili" },
    { icon: "📊", label: "Report mensile PDF", desc: "Pronto il 5 di ogni mese" },
  ];

  return (
    <section id="portale" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeUp>
            <span className="text-[#E8A87C] text-sm font-semibold uppercase tracking-widest">Portale proprietari</span>
            <h2 className="text-[48px] md:text-[56px] font-bold text-[#F5F4F0] mt-2 mb-6 leading-tight">
              Ogni shekel
              <br />
              ha una storia.
              <br />
              <span className="text-[#E8A87C]">Qui la leggi.</span>
            </h2>
            <p className="text-[#9B9589] text-lg leading-relaxed mb-10">
              Un portale costruito per chi vuole capire, non solo vedere. Numeri chiari, documenti scaricabili, cronologia completa di ogni appartamento.
            </p>
            <div className="space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 rounded-xl bg-[#E8A87C]/10 flex items-center justify-center text-lg shrink-0 group-hover:bg-[#E8A87C]/20 transition-colors">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-[#F5F4F0] font-semibold">{f.label}</p>
                    <p className="text-sm text-[#9B9589]">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="flex justify-center lg:justify-end">
              <PortalMockup />
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Manutenzione ─────────────────────────────────────────────────────
function Manutenzione() {
  return (
    <section className="py-28 px-6 bg-[#111118]/50">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <FadeUp delay={0.1}>
            <div className="flex justify-center">
              <WhatsappMockup />
            </div>
          </FadeUp>

          <FadeUp>
            <span className="text-[#E8A87C] text-sm font-semibold uppercase tracking-widest">Manutenzione</span>
            <h2 className="text-[48px] md:text-[56px] font-bold text-[#F5F4F0] mt-2 mb-6 leading-tight">
              Un messaggio
              <br />
              WhatsApp.
              <br />
              <span className="text-[#E8A87C]">Un tecnico di fiducia.</span>
            </h2>
            <p className="text-[#9B9589] text-lg leading-relaxed mb-8">
              Lavorano con noi da anni. Conoscono i tuoi appartamenti. Non si inventano problemi. E quando finiscono, mandano le foto.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Risposta entro", value: "2h" },
                { label: "Tecnici fidati", value: "12+" },
                { label: "Preventivo prima", value: "Sempre" },
                { label: "Foto post-lavoro", value: "✓" },
              ].map((item, i) => (
                <div key={i} className="bg-[#0A0A0F] border border-white/5 rounded-xl p-4">
                  <div className="text-xl font-black text-[#E8A87C]">{item.value}</div>
                  <div className="text-xs text-[#9B9589] mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

// ─── Section: Piattaforme ─────────────────────────────────────────────────────
function Piattaforme() {
  const platforms = ["Yad2", "Madlan", "Airbnb", "Booking.com", "Facebook Marketplace"];

  return (
    <section className="py-20 px-6 border-y border-white/5">
      <div className="max-w-7xl mx-auto text-center">
        <FadeUp>
          <p className="text-[#9B9589] text-sm uppercase tracking-widest mb-8">Il tuo annuncio, ovunque conta.</p>
          <div className="flex flex-wrap justify-center gap-4">
            {platforms.map((p, i) => (
              <span
                key={i}
                className="px-5 py-2.5 bg-[#111118] border border-white/8 rounded-full text-sm text-[#F5F4F0] font-medium hover:border-[#E8A87C]/30 hover:text-[#E8A87C] transition-all cursor-default"
              >
                {p}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Section: Prezzi ──────────────────────────────────────────────────────────
function Prezzi() {
  const plans = [
    {
      name: "Affitto gestito",
      price: "% sull'affitto incassato",
      priceNote: "[da definire]",
      desc: "Il servizio completo. Dall'inquilino al bonifico mensile.",
      features: ["Ricerca inquilino", "Contratto bilingue", "Incasso e rendiconto", "Gestione manutenzione", "Report mensile"],
      cta: "Chiedi un preventivo",
      featured: false,
    },
    {
      name: "Custodia privata",
      price: "Canone mensile fisso",
      priceNote: "[da definire]",
      desc: "La casa curata anche quando non è affittata.",
      features: ["Visite programmate", "Report fotografico", "Gestione bollette", "Pronto al tuo arrivo"],
      cta: "Chiedi un preventivo",
      featured: true,
    },
    {
      name: "Affitti brevi",
      price: "% sul fatturato",
      priceNote: "[da definire]",
      desc: "Massimizza il rendimento con Airbnb e Booking.",
      features: ["Annunci ottimizzati", "Gestione ospiti 24/7", "Comunicazione trilingue", "Rendiconto fiscale"],
      cta: "Chiedi un preventivo",
      featured: false,
    },
  ];

  return (
    <section id="prezzi" className="py-28 px-6">
      <div className="max-w-7xl mx-auto">
        <FadeUp>
          <span className="text-[#E8A87C] text-sm font-semibold uppercase tracking-widest">Prezzi</span>
          <h2 className="text-[48px] md:text-[56px] font-bold text-[#F5F4F0] mt-2 mb-4 leading-tight">
            Quanto costa.
            <br />
            Senza asterischi.
          </h2>
          <p className="text-[#9B9589] text-lg mb-16">
            Nessun vincolo: puoi recedere con{" "}
            <em className="text-[#9B9589]/60">[X giorni]</em> di preavviso.
          </p>
        </FadeUp>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan, i) => (
            <FadeUp key={i} delay={i * 0.1}>
              <div
                className={`rounded-2xl p-7 border h-full flex flex-col transition-all hover:scale-[1.02] ${
                  plan.featured
                    ? "bg-[#E8A87C]/5 border-[#E8A87C]/30"
                    : "bg-[#111118] border-white/5 hover:border-[#E8A87C]/20"
                }`}
              >
                {plan.featured && (
                  <span className="text-[10px] px-3 py-1 rounded-full bg-[#E8A87C]/20 text-[#E8A87C] font-semibold uppercase tracking-wider self-start mb-4">
                    Più richiesto
                  </span>
                )}
                <h3 className="text-xl font-bold text-[#F5F4F0] mb-2">{plan.name}</h3>
                <div className="mb-1">
                  <span className="text-lg font-bold text-[#E8A87C]">{plan.price}</span>
                </div>
                <p className="text-sm text-[#9B9589]/60 italic mb-4">{plan.priceNote}</p>
                <p className="text-sm text-[#9B9589] mb-6 flex-1">{plan.desc}</p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className="flex items-center gap-2 text-sm text-[#9B9589]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contatto"
                  className={`w-full py-3 rounded-full text-sm font-semibold text-center transition-all ${
                    plan.featured
                      ? "bg-[#E8A87C] text-[#0A0A0F] hover:bg-[#E8A87C]/90"
                      : "border border-white/10 text-[#F5F4F0] hover:border-[#E8A87C]/30"
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: FAQ ─────────────────────────────────────────────────────────────
function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  const faqs = [
    {
      q: "Come evitate i mesi sfitti?",
      a: "In 10 anni abbiamo costruito una rete di potenziali inquilini, agenti e referenze. Iniziamo a cercare prima ancora che l'appartamento si liberi. Statisticamente, ogni nostro appartamento trova inquilino entro 3 settimane.",
    },
    {
      q: "Perché la manutenzione costa meno?",
      a: "Lavoriamo con gli stessi idraulici, elettricisti e muratori da anni. Ci fanno tariffe preferenziali perché garantiamo continuità di lavoro. Il risparmio lo trasferiamo a te, con ricevuta.",
    },
    {
      q: "Posso vedere tutto quello che succede?",
      a: "Sì. Il portale proprietari è aggiornato in tempo reale. Ogni pagamento, ogni spesa, ogni documento è lì, scaricabile, in italiano.",
    },
    {
      q: "In quale lingua operate?",
      a: "In italiano per comunicare con te. In ebraico per contratti, tecnici e autorità locali. In inglese per gli affitti brevi. Tutto tradotto quando necessario.",
    },
    {
      q: "Cosa succede se l'inquilino non paga?",
      a: "Gestiamo noi il contatto, il sollecito e, se necessario, le procedure legali con i nostri avvocati di riferimento. Ti teniamo informato a ogni passaggio.",
    },
    {
      q: "Posso recedere dal contratto?",
      a: "Sì, con preavviso definito nel contratto. Non ci sono penali né vincoli nascosti. Se non sei soddisfatto, ci fai sapere.",
    },
    {
      q: "Come vengono selezionati gli inquilini?",
      a: "Verifica dell'impiego o del reddito, referenze dai precedenti proprietari, e un colloquio. Firmiamo un contratto in italiano e in ebraico, valido legalmente in Israele.",
    },
    {
      q: "Posso affidarvi solo la manutenzione?",
      a: "Sì. Puoi scegliere solo il servizio di custodia e manutenzione, senza gestione dell'affitto. Contattaci per un preventivo su misura.",
    },
  ];

  return (
    <section className="py-28 px-6 bg-[#111118]/50">
      <div className="max-w-3xl mx-auto">
        <FadeUp>
          <h2 className="text-[48px] md:text-[56px] font-bold text-[#F5F4F0] mb-16 leading-tight">
            Domande frequenti.
          </h2>
        </FadeUp>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <FadeUp key={i} delay={i * 0.04}>
              <div className="border border-white/5 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <span className="text-[#F5F4F0] font-medium">{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-[#9B9589] shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`}
                  />
                </button>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-6 pb-5"
                  >
                    <p className="text-[#9B9589] leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Section: CTA Finale ──────────────────────────────────────────────────────
function CTAFinale() {
  return (
    <section id="contatto" className="py-28 px-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#E8A87C]/5 via-transparent to-[#4A7C59]/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#E8A87C]/3 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative">
        <FadeUp>
          <h2 className="text-[56px] md:text-[80px] font-black text-[#F5F4F0] leading-tight mb-6">
            La tua casa.
            <br />
            Il tuo <span className="text-[#E8A87C]">controllo.</span>
            <br />
            Il resto, a noi.
          </h2>
          <p className="text-[#9B9589] text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
            Raccontaci il tuo appartamento. Ti diciamo cosa possiamo fare e quanto costa, senza impegno.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a
              href="mailto:info@easybayit.com"
              className="px-10 py-4 bg-[#E8A87C] text-[#0A0A0F] font-bold text-lg rounded-full hover:bg-[#E8A87C]/90 hover:scale-105 transition-all shadow-xl shadow-[#E8A87C]/20"
            >
              Raccontaci la tua casa →
            </a>
          </div>

          {/* Contact info */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center text-sm text-[#9B9589]">
            <span>📧 info@easybayit.com</span>
            <span>📱 WhatsApp disponibile</span>
            <span>🕐 Risposta entro 2 ore lavorative</span>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Section: Footer ──────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-white/5 py-16 px-6 bg-[#0A0A0F]">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-10 mb-12">
          {/* Logo + tagline */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-1 mb-3">
              <span className="text-xl font-black text-[#F5F4F0]">easybayit</span>
              <span className="w-2 h-2 rounded-full bg-[#E8A87C]" />
            </div>
            <p className="text-sm text-[#9B9589] leading-relaxed">
              Property management in Israele per proprietari italiani. Dal 2016.
            </p>
            <div className="flex gap-2 mt-4">
              {["IT", "HE", "EN"].map((lang) => (
                <span
                  key={lang}
                  className="px-2.5 py-1 text-[10px] font-semibold border border-white/10 rounded text-[#9B9589] hover:text-[#E8A87C] hover:border-[#E8A87C]/30 cursor-pointer transition-colors"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Servizi */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9589] mb-4">Servizi</p>
            <ul className="space-y-2.5">
              {["Affitto gestito", "Custodia privata", "Affitti brevi", "Manutenzione", "Portale proprietari"].map((item) => (
                <li key={item}>
                  <a href="#servizi" className="text-sm text-[#9B9589] hover:text-[#F5F4F0] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Azienda */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9589] mb-4">Azienda</p>
            <ul className="space-y-2.5">
              {["Chi siamo", "Come lavoriamo", "Prezzi", "FAQ", "Blog"].map((item) => (
                <li key={item}>
                  <a href="#chi-siamo" className="text-sm text-[#9B9589] hover:text-[#F5F4F0] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legale */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#9B9589] mb-4">Legale</p>
            <ul className="space-y-2.5">
              {["Privacy Policy", "Termini di servizio", "Cookie Policy"].map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-[#9B9589] hover:text-[#F5F4F0] transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 text-xs text-[#9B9589]/60 leading-relaxed">
              <p>Easybayit Ltd.</p>
              <p>Tel Aviv, Israele</p>
              <p>P.IVA / ח.פ. [placeholder]</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#9B9589]/60">
            © {new Date().getFullYear()} Easybayit Ltd. — Tutti i diritti riservati.
          </p>
          <p className="text-xs text-[#9B9589]/40">
            Costruito con ♥ per i proprietari italiani in Israele
          </p>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <IlProblema />
      <LaSoluzione />
      <Servizi />
      <ComeLavoriamo />
      <PortaleProprietari />
      <Manutenzione />
      <Piattaforme />
      <Prezzi />
      <FAQ />
      <CTAFinale />
      <Footer />
    </main>
  );
}
