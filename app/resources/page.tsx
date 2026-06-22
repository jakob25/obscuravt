'use client'

import { Gamepad2, ExternalLink, BookOpen } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GlitchHeading } from '@/components/vault/glitch-heading'

interface GameResource {
  name: string
  description: string
  link: string
  tags: string[]
}

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

function ChatGamesTab() {
  return (
    <div className="space-y-3">
      {CHAT_GAMES.map(game => (
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
      <p className="text-xs text-muted-foreground text-center mt-6">
        Know a game that should be here? Let us know — this list grows with the community.
      </p>
    </div>
  )
}

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <GlitchHeading as="h1" className="text-2xl font-bold text-vault-cream mb-1 flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-vault-gold" />
          Stream Resources
        </GlitchHeading>
        <p className="text-muted-foreground text-sm">Curated tools for VTubers and creators.</p>
      </div>

      <Tabs defaultValue="chat-games">
        <TabsList className="mb-6 bg-muted/50">
          <TabsTrigger value="chat-games" className="data-[state=active]:bg-vault-gold/20 data-[state=active]:text-vault-gold">
            <Gamepad2 className="h-4 w-4 mr-1" /> Chat-Integrated Games
          </TabsTrigger>
        </TabsList>
        <TabsContent value="chat-games">
          <ChatGamesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}