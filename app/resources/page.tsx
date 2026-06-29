'use client'

import { Gamepad2, ExternalLink, Monitor, CheckSquare } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { PageBackNav } from '@/components/vault/page-back-nav'
import { VaultDivider, VaultPanel } from '@/components/vault/vault-surfaces'
import { CHAT_INTEGRATED_GAMES, type GameResource } from '@/lib/chat-integrated-games'

const STREAM_TOOLS: GameResource[] = [
  { name: 'OBS Studio', description: 'Free, open-source broadcaster — the standard for VTuber streaming.', link: 'https://obsproject.com/', tags: ['free', 'essential', 'capture'] },
  { name: 'VTube Studio', description: 'Face-tracked Live2D avatar control with props, hotkeys, and plugin ecosystem.', link: 'https://denchisoft.com/', tags: ['Live2D', 'tracking', 'props'] },
  { name: 'VSeeFace', description: 'Free VRM avatar tracking alternative — great for 3D models and indie budgets.', link: 'https://www.vseeface.icu/', tags: ['VRM', '3D', 'free'] },
  { name: 'Warudo', description: 'Node-based overlay engine for reactive alerts, widgets, and stream effects.', link: 'https://warudo.app/', tags: ['overlays', 'alerts', 'widgets'] },
  { name: 'StreamElements / Streamlabs', description: 'Alerts, overlays, tipping, and bot commands in one dashboard.', link: 'https://streamelements.com/', tags: ['alerts', 'monetization', 'bots'] },
  { name: 'Lalal.ai Voice Clean', description: 'AI noise suppression for cleaner mic audio without a pricey interface.', link: 'https://www.lalal.ai/', tags: ['audio', 'noise gate'] },
]

const DEBUT_CHECKLIST: string[] = [
  'Pick your model format (Live2D, 3D/VRM, PNGtuber) and rigging artist',
  'Set up OBS scenes: gameplay, chatting, BRB, starting soon',
  'Test tracking + mic levels on a private stream before going live',
  'Write a 2–3 sentence bio and pick 3–5 vibe tags for the Star Map',
  'Schedule your debut on the VTuber page schedule tab',
  'Prepare 2–3 chat games or segment ideas for dead air',
  'Link your Twitch/YouTube in your ObscuraVT dossier',
  'Submit clips after streams so fans can discover you off-platform',
]

function ResourceList({ items }: { items: GameResource[] }) {
  return (
    <div className="space-y-3">
      {items.map(game => (
        <a
          key={game.name}
          href={game.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
        >
          <VaultPanel className="p-4 flex items-start justify-between gap-4 hover:border-vault-gold/30 transition-all">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-vault-cream group-hover:text-vault-gold transition-colors">{game.name}</h3>
              <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground mb-2">{game.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {game.tags.map(tag => (
                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground border border-border">{tag}</span>
              ))}
            </div>
          </div>
          </VaultPanel>
        </a>
      ))}
    </div>
  )
}

function ChatIntegratedGamesTab() {
  return (
    <>
      <ResourceList items={CHAT_INTEGRATED_GAMES} />
      <p className="text-xs text-muted-foreground text-center mt-6">
        Missing a banger? Tell us — this list is community-fed.
      </p>
    </>
  )
}

function StreamToolsTab() {
  return <ResourceList items={STREAM_TOOLS} />
}

function DebutChecklistTab() {
  return (
    <VaultPanel className="p-6">
      <p className="text-sm text-muted-foreground mb-4">Pre-debut sanity check. Not gospel — but it closes the usual gaps.</p>
      <ul className="space-y-3">
        {DEBUT_CHECKLIST.map((item, i) => (
          <li key={item} className="flex items-start gap-3 text-sm text-vault-cream">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-vault-gold/15 text-vault-gold text-xs font-semibold">{i + 1}</span>
            {item}
          </li>
        ))}
      </ul>
    </VaultPanel>
  )
}

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PageBackNav fallbackHref="/" />
      <div className="mb-6">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1">
          Stream Resources
        </GlitchHeading>
        <p className="text-muted-foreground text-sm">Tools, games, and debut prep — no corporate fluff.</p>
      </div>
      <VaultDivider className="mb-6" />

      <Tabs defaultValue="chat-games">
        <TabsList className="mb-6 bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="chat-games" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <Gamepad2 className="h-4 w-4 mr-1" /> Chat Integrated Games
          </TabsTrigger>
          <TabsTrigger value="stream-tools" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <Monitor className="h-4 w-4 mr-1" /> Stream Setup
          </TabsTrigger>
          <TabsTrigger value="debut" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <CheckSquare className="h-4 w-4 mr-1" /> Debut Checklist
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chat-games">
          <ChatIntegratedGamesTab />
        </TabsContent>
        <TabsContent value="stream-tools">
          <StreamToolsTab />
        </TabsContent>
        <TabsContent value="debut">
          <DebutChecklistTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}