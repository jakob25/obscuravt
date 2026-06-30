'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function VaultLockHomepage() {
  const [isOpening, setIsOpening] = useState(false)

  const handleUnlock = () => {
    setIsOpening(true)
    setTimeout(() => {
      window.location.href = '/discover'
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-[#0a0a14] text-[#e9dfc4] overflow-hidden">
      {/* Top Bar */}
      <div className="border-b border-[#2a2440] bg-[#0d0d14]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#d4a843] flex items-center justify-center">
              <span className="text-[#0a0a14] font-bold text-xl">O</span>
            </div>
            <div className="font-govt text-2xl tracking-[3px] text-[#d4a843]">OBSCURAVT</div>
          </div>
          <div>
            <Link 
              href="/login" 
              className="px-5 py-2 text-sm border border-[#d4a843] text-[#d4a843] hover:bg-[#d4a843] hover:text-[#0a0a14] transition-colors"
            >
              ACCESS ARCHIVE
            </Link>
          </div>
        </div>
      </div>

      {/* Giant Vault Lock Hero - Matching Login Page Style */}
      <div className="flex flex-col items-center justify-center min-h-[92dvh] px-6 pt-8 pb-16 text-center">
        
        {/* Large Mechanical Vault Lock */}
        <div 
          className={`relative w-[380px] h-[380px] mb-10 cursor-pointer transition-all duration-700 ${isOpening ? 'scale-[0.85] opacity-60' : ''}`}
          onClick={handleUnlock}
        >
          {/* Outer Ring */}
          <div className="absolute inset-0 rounded-full border-[14px] border-[#3a2f1f] bg-[#11111a]" />
          
          {/* Main Lock Body */}
          <div className="absolute inset-[22px] rounded-full border-[10px] border-[#d4a843] bg-[#0d0d14] flex items-center justify-center shadow-[inset_0_0_60px_rgba(0,0,0,0.6)]">
            
            {/* Inner Dial */}
            <div className={`relative w-40 h-40 rounded-full border-[6px] border-[#d4a843] bg-[#1a1826] flex items-center justify-center transition-transform duration-1000 ${isOpening ? 'rotate-[720deg]' : ''}`}>
              
              {/* Dial Lines */}
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-[2px] h-5 bg-[#d4a843]" 
                  style={{ 
                    transform: `rotate(${i * 30}deg) translateY(-52px)` 
                  }} 
                />
              ))}

              {/* Center Hub */}
              <div className="w-9 h-9 rounded-full bg-[#d4a843] flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-[#0d0d14]" />
              </div>
            </div>
          </div>

          {/* 8 Bolts around the lock (matching login page) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => (
            <div
              key={index}
              className={`absolute w-5 h-12 bg-[#d4a843] rounded transition-all duration-700 ${isOpening ? 'translate-x-[80px] opacity-0' : ''}`}
              style={{
                top: '50%',
                left: '50%',
                transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-148px)`,
                transformOrigin: 'center',
              }}
            >
              <div className="absolute top-1/2 left-1/2 w-3 h-3 -translate-x-1/2 -translate-y-1/2 bg-[#0d0d14] rounded-full" />
            </div>
          ))}

          {/* Subtle RGB Glitch on Lock */}
          <div className="absolute inset-0 rounded-full mix-blend-screen pointer-events-none"
               style={{
                 background: 'repeating-linear-gradient(135deg, transparent, transparent 6px, rgba(255,34,68,0.15) 6px, rgba(255,34,68,0.15) 9px)',
               }} 
          />
        </div>

        {/* Headline */}
        <h1 className="text-6xl md:text-7xl font-medium tracking-[-2px] leading-none mb-6 max-w-4xl">
          Find the VTubers<br />the Algorithms don&apos;t want you to find.
        </h1>

        <p className="max-w-md text-[#a38f6b] text-xl mb-10">
          A classified vault of raw clips, bets, and creator dossiers.
        </p>

        <button 
          onClick={handleUnlock}
          className="px-10 py-4 bg-[#d4a843] text-[#0d0d14] text-lg font-semibold rounded hover:brightness-105 active:scale-[0.985] transition-all"
        >
          UNLOCK THE ARCHIVE
        </button>

        <p className="mt-4 text-xs text-[#5a4f2e]">Click the lock or button to enter</p>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { label: "01", title: "CLIPS", desc: "Raw footage from indie creators" },
            { label: "02", title: "BETS", desc: "Community prediction markets" },
            { label: "03", title: "DISCOVERY", desc: "Find creators by vibe, not numbers" },
            { label: "04", title: "CIRCLES", desc: "Private archives with other fans" },
          ].map((item, i) => (
            <div key={i} className="border border-[#2a2440] bg-[#11111a] p-7 rounded">
              <div className="text-[#d4a843] text-xs tracking-[2px] mb-2">{item.label}</div>
              <div className="text-2xl font-medium mb-3">{item.title}</div>
              <p className="text-[#a38f6b] text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
