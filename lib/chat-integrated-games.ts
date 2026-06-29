export interface GameResource {
  name: string
  description: string
  link: string
  tags: string[]
}

export const CHAT_INTEGRATED_GAMES: GameResource[] = [
  { name: 'Jackbox Party Pack', description: 'Chat votes and submits answers via phone browser — works great for big audiences.', link: 'https://www.jackboxgames.com/', tags: ['party', 'voice-optional', 'large chat'] },
  { name: 'Twitch Plays', description: 'Chat commands control gameplay directly via chat messages — classic chaos format.', link: 'https://en.wikipedia.org/wiki/Twitch_Plays_Pok%C3%A9mon', tags: ['chaos', 'classic', 'any chat size'] },
  { name: 'StreamElements / Streamlabs Chat Games', description: 'Built-in mini-games triggered by chat commands during downtime.', link: 'https://streamelements.com/', tags: ['passive', 'economy', 'easy setup'] },
  { name: 'Crowd Control', description: 'Viewers spend channel points to directly affect gameplay in supported games.', link: 'https://crowdcontrol.live/', tags: ['chaos', 'channel points', 'supported games only'] },
  { name: 'Marbles on Stream', description: 'Chat spawns marbles in a physics race — channel points or free entry, winner picks the next segment.', link: 'https://marcetastic.itch.io/marbles-on-stream', tags: ['racing', 'channel points', 'free'] },
  { name: 'Codenames (Horsepaste)', description: 'Chat helps guess word grids in teams — great for variety and zatsudan co-streams.', link: 'https://horsepaste.com/', tags: ['word game', 'team', 'browser'] },
  { name: 'Skribbl.io', description: 'Drawing and guessing in browser — chat can submit words or join as players.', link: 'https://skribbl.io/', tags: ['drawing', 'browser', 'low setup'] },
  { name: 'Gartic Phone', description: 'Telephone-style drawing game — great for collab streams or chat participation rounds.', link: 'https://garticphone.com/', tags: ['drawing', 'collab', 'low pressure'] },
  { name: 'GeoGuessr (community maps)', description: 'Chat votes on map location or direction — works as a spectator game with a host driver.', link: 'https://www.geoguessr.com/', tags: ['exploration', 'voting', 'variety'] },
  { name: 'Among Us', description: 'Chat can vote on suspects in spectator mode, or join in for variety streams.', link: 'https://www.innersloth.com/games/among-us/', tags: ['social deduction', 'multiplayer'] },
  { name: 'Lethal Company (spectator chaos)', description: 'Chat votes on doors, items, or routes while the streamer survives — high tension variety.', link: 'https://store.steampowered.com/app/1966720/Lethal_Company/', tags: ['horror', 'voting', 'spectator'] },
  { name: 'Wheel of Names / Chat Roulette', description: 'Spin a wheel populated by chat usernames or suggestions — simple, high engagement.', link: 'https://wheelofnames.com/', tags: ['simple', 'any chat size', 'free'] },
  { name: 'Twitch Rivals Chat Modes', description: 'Official Twitch extensions where chat influences in-game events during Rivals broadcasts.', link: 'https://www.twitch.tv/rivals', tags: ['official', 'events', 'extension'] },
  { name: 'Forsen-style Chat Polls', description: 'Use !poll commands via bots like Nightbot or StreamElements to let chat decide what happens next.', link: 'https://nightbot.tv/', tags: ['decision-making', 'bot required'] },
  { name: 'Bongo Cat / Soundboard Triggers', description: 'Chat redeems channel points or types commands to trigger sounds and overlays.', link: 'https://bongo.cat/', tags: ['soundboard', 'redeems', 'overlay'] },
]