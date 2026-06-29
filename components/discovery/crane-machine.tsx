'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Gift, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { VaultPanel } from '@/components/vault/vault-surfaces'
import type { DiscoveryPrize } from '@/lib/discovery-games'
import { shuffle } from '@/lib/discovery-games'

type Phase = 'idle' | 'dropping' | 'grabbing' | 'returning'

interface Props {
  prizes: DiscoveryPrize[]
}

const LANE_COUNT = 5
const CATCH_BASE_CHANCE = 0.42

export function CraneMachine({ prizes }: Props) {
  const [lanePrizes, setLanePrizes] = useState<DiscoveryPrize[]>([])
  const [clawLane, setClawLane] = useState(2)
  const [phase, setPhase] = useState<Phase>('idle')
  const [caught, setCaught] = useState<DiscoveryPrize | null>(null)
  const [message, setMessage] = useState('')
  const [recording, setRecording] = useState(false)
  const railRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prizes.length === 0) return
    const shuffled = shuffle(prizes)
    const lanes: DiscoveryPrize[] = []
    for (let i = 0; i < LANE_COUNT; i++) {
      lanes.push(shuffled[i % shuffled.length])
    }
    setLanePrizes(lanes)
  }, [prizes])

  const move = (dir: -1 | 1) => {
    if (phase !== 'idle') return
    setClawLane(l => Math.max(0, Math.min(LANE_COUNT - 1, l + dir)))
  }

  const recordCatch = useCallback(async (prize: DiscoveryPrize) => {
    setRecording(true)
    try {
      await fetch('/api/discovery-games/crane', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ vtuberId: prize.id }),
      })
    } catch { /* non-blocking */ }
    finally { setRecording(false) }
  }, [])

  const drop = async () => {
    if (phase !== 'idle' || lanePrizes.length === 0) return
    setCaught(null)
    setMessage('')
    setPhase('dropping')

    await new Promise(r => setTimeout(r, 700))
    setPhase('grabbing')

    const target = lanePrizes[clawLane]
    const alignmentBonus = 0.15
    const success = Math.random() < CATCH_BASE_CHANCE + alignmentBonus

    await new Promise(r => setTimeout(r, 500))

    if (success && target) {
      setCaught(target)
      setMessage(`Caught ${target.name}!`)
      void recordCatch(target)
    } else {
      setMessage('Missed — try again.')
    }

    setPhase('returning')
    await new Promise(r => setTimeout(r, 600))
    setPhase('idle')
  }

  const clawLeft = `${(clawLane / (LANE_COUNT - 1)) * 100}%`

  if (prizes.length === 0) {
    return (
      <VaultPanel className="p-8 text-center text-muted-foreground">
        No prizes in the machine yet. Approve more dossiers in the archive.
      </VaultPanel>
    )
  }

  return (
    <div className="space-y-6">
      <VaultPanel className="relative overflow-hidden p-0 border-vault-gold/25 bg-gradient-to-b from-vault-deep to-[#0a0812]">
        <div className="border-b border-vault-gold/20 px-4 py-2 flex items-center justify-between bg-vault-gold/5">
          <span className="text-xs font-stamp tracking-widest text-vault-gold uppercase">Vault Crane</span>
          <Gift className="h-4 w-4 text-vault-gold" />
        </div>

        <div ref={railRef} className="relative h-56 md:h-64">
          <div
            className="absolute top-0 z-20 flex flex-col items-center transition-[left] duration-300 ease-out"
            style={{ left: clawLeft, transform: 'translateX(-50%)' }}
          >
            <div className="w-0.5 h-8 bg-vault-bronze/80" />
            <div
              className={`flex flex-col items-center transition-transform duration-500 ${
                phase === 'dropping' || phase === 'grabbing' ? 'translate-y-24 md:translate-y-28' : ''
              }`}
            >
              <div className="h-3 w-10 rounded-sm bg-vault-gold/80 border border-vault-gold" />
              <div className="flex gap-1 -mt-0.5">
                <div className="h-4 w-1.5 bg-vault-cream/70 rounded-b" />
                <div className="h-5 w-1.5 bg-vault-cream/70 rounded-b" />
                <div className="h-4 w-1.5 bg-vault-cream/70 rounded-b" />
              </div>
              {caught && phase !== 'idle' && (
                <img
                  src={caught.avatarUrl}
                  alt=""
                  className="h-8 w-8 rounded-full border-2 border-vault-gold mt-1 object-cover"
                />
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 md:h-36 border-t-2 border-vault-bronze/40 bg-vault-deep/80">
            <div className="grid h-full grid-cols-5 gap-1 p-2">
              {lanePrizes.map((prize, i) => (
                <div
                  key={`${prize.id}-${i}`}
                  className={`flex flex-col items-center justify-end rounded-lg border p-1 transition-colors ${
                    clawLane === i && phase === 'idle'
                      ? 'border-vault-gold/50 bg-vault-gold/10'
                      : 'border-border/40 bg-muted/10'
                  }`}
                >
                  <img
                    src={prize.avatarUrl}
                    alt={prize.name}
                    className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover border border-vault-bronze/40"
                  />
                  <span className="text-[9px] text-muted-foreground truncate w-full text-center mt-1">
                    {prize.name.split(' ')[0]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 px-4 py-4 border-t border-border/50">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="border-vault-bronze/40"
            onClick={() => move(-1)}
            disabled={phase !== 'idle' || clawLane === 0}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            onClick={drop}
            disabled={phase !== 'idle'}
            className="min-w-[140px] bg-vault-gold hover:bg-vault-amber text-vault-deep font-semibold"
          >
            {phase === 'idle' ? 'Drop claw' : <Loader2 className="h-4 w-4 animate-spin" />}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="border-vault-bronze/40"
            onClick={() => move(1)}
            disabled={phase !== 'idle' || clawLane === LANE_COUNT - 1}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </VaultPanel>

      {message && (
        <p className={`text-sm text-center ${caught ? 'text-vault-gold' : 'text-muted-foreground'}`}>
          {recording ? 'Recording catch… ' : ''}{message}
        </p>
      )}

      {caught && phase === 'idle' && (
        <VaultPanel className="p-5 text-center">
          <img
            src={caught.avatarUrl}
            alt={caught.name}
            className="h-20 w-20 rounded-full mx-auto border-2 border-vault-gold object-cover mb-3"
          />
          <h3 className="font-bold text-vault-cream">{caught.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{caught.bio}</p>
          <Button asChild size="sm" className="mt-4 bg-vault-gold text-vault-deep">
            <Link href={`/vtuber/${caught.id}`}>View dossier →</Link>
          </Button>
        </VaultPanel>
      )}
    </div>
  )
}