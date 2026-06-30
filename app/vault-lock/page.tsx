'use client'

import Link from 'next/link'

export default function VaultLockHomepage() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-[#e9dfc4] overflow-hidden">
      {/* Top Bar */}
      <div className="border-b border-[#3a2f1f] bg-[#0d0d14]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#d4a843] flex items-center justify-center">
              <span className="text-[#d4a843] text-xl font-bold">O</span>
            </div>
            <div>
              <div className="font-govt text-xl tracking-[3px] text-[#d4a843]">OBSCURAVT</div>
              <div className="text-[10px] text-[#5a4f2e] -mt-1">CLASSIFIED ARCHIVE</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="px-4 py-1.5 border border-[#5a4f2e] hover:bg-[#5a4f2e] hover:text-[#e9dfc4] transition-colors">
              ACCESS ARCHIVE
            </Link>
          </div>
        </div>
      </div>

      {/* Giant Vault Lock Hero */}
      <div className="relative flex items-center justify-center min-h-[100dvh] px-6">
        <div className="max-w-5xl w-full text-center">
          {/* Vault Lock Visual */}
          <div className="relative mx-auto mb-12 w-[420px] h-[420px] flex items-center justify-center">
            {/* Outer Vault Door */}
            <div className="absolute inset-0 rounded-full border-[14px] border-[#3a2f1f] bg-[#11111a] shadow-2xl" />
            
            {/* Inner Lock Mechanism */}
            <div className="relative z-10 w-[280px] h-[280px] rounded-full border-[12px] border-[#d4a843] bg-[#0d0d14] flex items-center justify-center shadow-[0_0_80px_rgba(212,168,67,0.15)]">
              {/* Spokes */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((rotation, i) => (
                <div
                  key={i}
                  className="absolute w-3 bg-[#d4a843]"
                  style={{
                    height: '120px',
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: 'center bottom',
                    top: '50%',
                    left: '50%',
                    marginLeft: '-6px',
                  }}
                />
              ))}

              {/* Center Dial */}
              <div className="relative z-20 w-24 h-24 rounded-full border-4 border-[#d4a843] bg-[#11111a] flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-[#d4a843]" />
              </div>
            </div>

            {/* Subtle RGB Glitch Overlay on Lock */}
            <div className="absolute inset-0 rounded-full mix-blend-screen opacity-30 pointer-events-none"
                 style={{
                   background: 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,34,68,0.4) 4px, rgba(255,34,68,0.4) 6px)',
                 }} 
            />
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl font-medium tracking-[-2.5px] leading-[0.95] mb-6">
            Find the VTubers<br />the Algorithms don&apos;t want you to find.
          </h1>

          <p className="max-w-md mx-auto text-[#a38f6b] text-lg mb-10">
            A classified archive of raw clips, community bets, and creator dossiers.
          </p>

          <div className="flex justify-center gap-4">
            <Link 
              href="/discover" 
              className="px-8 py-4 bg-[#d4a843] text-[#0d0d14] font-semibold text-lg rounded hover:brightness-105 transition-all"
            >
              ENTER THE ARCHIVE
            </Link>
            <Link 
              href="/login" 
              className="px-8 py-4 border border-[#d4a843] text-[#d4a843] font-medium text-lg rounded hover:bg-[#d4a843] hover:text-[#0d0d14] transition-all"
            >
              CLAIM YOUR FILE
            </Link>
          </div>
        </div>
      </div>

      {/* Key Sections as Classified Files */}
      <div className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "CLIPS", desc: "Raw, unfiltered moments from indie VTubers." },
            { title: "BETS", desc: "Community prediction markets on creator moments." },
            { title: "DISCOVERY", desc: "Find creators by vibe, not follower count." },
            { title: "COMMUNITY", desc: "Circles, fan corners, and shared archives." },
          ].map((item, index) => (
            <div key={index} className="border border-[#3a2f1f] bg-[#11111a] p-8 rounded-lg">
              <div className="text-[#d4a843] text-xs tracking-[2px] mb-3 font-mono">FILE {String(index + 1).padStart(2, '0')}</div>
              <div className="text-3xl font-medium mb-4">{item.title}</div>
              <p className="text-[#a38f6b] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#3a2f1f] py-8 text-center text-xs text-[#5a4f2e]">
        OBSCURAVT • CLASSIFIED VTUBER ARCHIVE
      </div>
    </div>
  )
}
