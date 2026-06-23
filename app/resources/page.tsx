'use client'

import { Gamepad2, ExternalLink, BookOpen, Monitor, CheckSquare } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GlitchHeading } from '@/components/vault/glitch-heading'
import { PageBackNav } from '@/components/vault/page-back-nav'

interface GameResource {
  name: string
  description: string
  link: string
  tags: string[]
}

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

const CHAT_GAMES: GameResource[] = [
  { name: 'Jackbox Party Pack', description: 'Chat votes and submits answers via phone browser — works great for big audiences.', link: 'https://www.jackboxgames.com/', tags: ['party', 'voice-optional', 'large chat'] },
  { name: 'Twitch Plays', description: 'Chat commands control gameplay directly via chat messages — classic chaos format.', link: 'https://en.wikipedia.org/wiki/Twitch_Plays_Pok%C3%A9mon', tags: ['chaos', 'classic', 'any chat size'] },
  { name: 'StreamElements / Streamlabs Chat Games', description: 'Built-in mini-games triggered by chat commands during downtime.', link: 'https://streamelements.com/', tags: ['passive', 'economy', 'easy setup'] },
  { name: 'Crowd Control', description: 'Viewers spend channel points to directly affect gameplay in supported games.', link: 'https://crowdcontrol.live/', tags: ['chaos', 'channel points', 'supported games only'] },
  { name: 'Among Us', description: 'Chat can vote on suspects in spectator mode, or join in for variety streams.', link: 'https://www.innersloth.com/games/among-us/', tags: ['social deduction', 'multiplayer'] },
  { name: 'Gartic Phone', description: 'Telephone-style drawing game — great for collab streams or chat participation rounds.', link: 'https://garticphone.com/', tags: ['drawing', 'collab', 'low pressure'] },
  { name: 'Wheel of Names / Chat Roulette', description: 'Spin a wheel populated by chat usernames or suggestions — simple, high engagement.', link: 'https://wheelofnames.com/', tags: ['simple', 'any chat size', 'free'] },
  { name: 'Forsen-style Chat Polls', description: 'Use !poll commands via bots like Nightbot or StreamElements to let chat decide what happens next.', link: 'https://nightbot.tv/', tags: ['decision-making', 'bot required'] },
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
          className="vault-card rounded-xl p-4 flex items-start justify-between gap-4 hover:border-vault-gold/30 transition-all group block"
        >
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
        </a>
      ))}
    </div>
  )
}

function ChatGamesTab() {
  return (
    <>
      <ResourceList items={CHAT_GAMES} />
      <p className="text-xs text-muted-foreground text-center mt-6">
        Know a game that should be here? Let us know — this list grows with the community.
      </p>
    </>
  )
}

function StreamToolsTab() {
  return <ResourceList items={STREAM_TOOLS} />
}

function DebutChecklistTab() {
  return (
    <div className="vault-card rounded-xl p-6">
      <p className="text-sm text-muted-foreground mb-4">A practical pre-debut list — not exhaustive, but covers the usual gaps.</p>
      <ul className="space-y-3">
        {DEBUT_CHECKLIST.map((item, i) => (
          <li key={item} className="flex items-start gap-3 text-sm text-vault-cream">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-vault-gold/15 text-vault-gold text-xs font-semibold">{i + 1}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <PageBackNav fallbackHref="/creator" />
      <div className="mb-6">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-vault-gold" />
          Stream Resources
        </GlitchHeading>
        <p className="text-muted-foreground text-sm">Curated tools for VTubers and creators.</p>
      </div>

      <Tabs defaultValue="chat-games">
        <TabsList className="mb-6 bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="chat-games" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <Gamepad2 className="h-4 w-4 mr-1" /> Chat Games
          </TabsTrigger>
          <TabsTrigger value="stream-tools" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <Monitor className="h-4 w-4 mr-1" /> Stream Setup
          </TabsTrigger>
          <TabsTrigger value="debut" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <CheckSquare className="h-4 w-4 mr-1" /> Debut Checklist
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chat-games">
          <ChatGamesTab />
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