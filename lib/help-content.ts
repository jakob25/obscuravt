export interface HelpItem {
  q: string
  a: string
}

export interface HelpSection {
  id: string
  title: string
  items: HelpItem[]
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    items: [
      {
        q: 'What is ObscuraVT?',
        a: 'ObscuraVT is a discovery hub for VTubers and fans. Instead of ranking creators by subscriber count, it surfaces people by personality, vibe tags, and content niche. Every clip and profile links back to the creator\'s real channel.',
      },
      {
        q: 'Do I need an account?',
        a: 'You can browse Discover, clips, and profiles without signing in. Create a free account to vote on clips, place bets, earn Vault Scraps, submit nominations, and customize your home dashboard.',
      },
      {
        q: 'How do I find VTubers here?',
        a: 'Start on Discover and browse by tags, try the Find My Oshi quiz for personality matches, or use Search to look up a name or tag. You can also explore Raw Clips and follow links back to creators you like.',
      },
      {
        q: 'What are Vault Scraps?',
        a: 'Vault Scraps are ObscuraVT\'s in-site currency. You earn them through daily bonuses, tag validation, winning bets, and other community activity. Spend scraps on bets, shop cosmetics, and pledges — they never leave the platform.',
      },
    ],
  },
  {
    id: 'your-circle',
    title: 'Your Circle',
    items: [
      {
        q: 'What is Your Circle?',
        a: 'Your Circle is the set of creators you follow on your dashboard. Their Chat Made Me Do It goals, predictions, memes, Q&A, karaoke, and schedule votes show up in one feed — built around people you chose, not an algorithm.',
      },
      {
        q: 'How do I add someone to my Circle?',
        a: 'Open a creator\'s dossier and use the Add to Circle button. You can follow up to your role\'s limit. Pin the Your Circle widget on your home dashboard to see their activity first.',
      },
      {
        q: 'Can I customize my home page?',
        a: 'Yes. Your home dashboard is fully widget-based. Add, remove, reorder, or reset widgets with the customize control in the top-right. Logged-in users can shape the page around their daily habits.',
      },
      {
        q: 'What shows up in notifications?',
        a: 'Notifications cover bet results, Chat Made Me Do It updates, Q&A sessions, memes, karaoke queue changes, schedule votes, and more from creators in your Circle.',
      },
    ],
  },
  {
    id: 'chat-made-me-do-it',
    title: 'Chat Made Me Do It',
    items: [
      {
        q: 'What is Chat Made Me Do It?',
        a: 'Fans submit stream ideas on a creator\'s board. The VTuber picks one and sets a scraps goal. When fans pledge enough scraps and the goal is met, that idea becomes a stream — chat influence with receipts.',
      },
      {
        q: 'How do I submit an idea?',
        a: 'Sign in, open a creator\'s Chat Made Me Do It board from their dossier or fan corner, and post a title plus optional details. Upvote ideas you want to see happen.',
      },
      {
        q: 'What are pledges?',
        a: 'Pledges spend your Vault Scraps toward an active goal. When funded_amount hits goal_amount, the stream is locked in. Pledging signals demand — the creator committed when they set the goal.',
      },
      {
        q: 'I\'m a VTuber — how do I run it?',
        a: 'Claim your profile, open Chat Made Me Do It from Creator Dashboard, review submitted ideas, pick one, and set a scraps goal. Your Circle gets notified when a goal goes live.',
      },
    ],
  },
  {
    id: 'fan-corner',
    title: 'Fan Corner',
    items: [
      {
        q: 'What is the Fan Corner?',
        a: 'Each dossier has a fan corner for memes, fan art, karaoke requests, Q&A, stream predictions, and schedule votes. It is where fans shape the stream without spamming chat.',
      },
      {
        q: 'How do clips work?',
        a: 'Anyone can submit raw or edited clips with a timestamp and platform link. Clips are upvoted by the community and always link back to the original upload on YouTube, Twitch, or another supported platform.',
      },
      {
        q: 'What are community bets?',
        a: 'Bets are prediction markets around stream outcomes. Spend scraps on an option; when the bet resolves, winners split the pool. Browse open bets on the Bets page.',
      },
      {
        q: 'Can I submit memes or fan art?',
        a: 'Yes. Post memes from a dossier\'s fan corner. Submit fan art with an image or Twitter/X link — approved pieces stay on display with credit to the artist.',
      },
    ],
  },
  {
    id: 'creators-and-analytics',
    title: 'Creators and Analytics',
    items: [
      {
        q: 'How do I claim my VTuber profile?',
        a: 'If your profile is already in the archive, use the claim flow from your dossier or Creator Dashboard to verify ownership. If you are not listed yet, nominate yourself or ask a fan to nominate you.',
      },
      {
        q: 'What is the Creator Dashboard?',
        a: 'A hub for claimed profiles: switch active profiles, jump to schedule, Chat Made Me Do It, fan art, collab tools, stream resources, and analytics.',
      },
      {
        q: 'What does the Analytics page show?',
        a: 'Circle followers, memes, fan art, karaoke queue, Q&A, Chat Made Me Do It activity, schedule votes, predictions, and clips — engagement on ObscuraVT itself, not your off-platform metrics.',
      },
      {
        q: 'How are tags assigned?',
        a: 'Tags come from the community and admin-curated canonical tag list. Fans validate tags in the Tag Validator; accurate tags improve how you appear in Discover and search.',
      },
    ],
  },
  {
    id: 'collab-and-corpo',
    title: 'Collab and Corpo',
    items: [
      {
        q: 'What is the Collab page?',
        a: 'Vibe match % compares tag overlap between creators. Community % shows how many of your Circle fans also follow them. Blind collab hides names until you reveal. Schedule comparer finds overlapping stream slots.',
      },
      {
        q: 'What are Corpo collectives?',
        a: 'Small groups get a shared collective page with member roster and cross-promo. Creators in the same corpo show a recommended strip on each other\'s dossiers — Twitch-group simple, not agency contracts.',
      },
      {
        q: 'How do I create a collective?',
        a: 'Sign in, open Corpo Collectives, create a name and slug, pick members from the directory, and publish. Owners can edit bio and members later.',
      },
      {
        q: 'Is ObscuraVT trying to be a talent agency?',
        a: 'No. ObscuraVT is a discovery and community layer. It helps fans find you and helps you find collab partners — no exclusivity or revenue splits.',
      },
    ],
  },
  {
    id: 'bets-and-predictions',
    title: 'Bets and Predictions',
    items: [
      {
        q: 'How do community bets work?',
        a: 'Open a bet, pick an outcome, and wager Vault Scraps. When wagering closes, fans vote on what actually happened. When enough votes agree, winners split the pool (minus a small house cut).',
      },
      {
        q: 'What is the voting phase?',
        a: 'After wagering, bets move to voting. Head to the Bets page, open "Needs your vote", select the correct outcome, and submit. Your vote helps resolve the slip for everyone who wagered.',
      },
      {
        q: 'Stream predictions on dossiers',
        a: 'Each dossier can host stream-specific prediction bets tied to that creator. They show up in Your Circle and work like global bets — scraps in, vote to resolve.',
      },
      {
        q: 'Can I lose all my scraps?',
        a: 'Wagers are spent when you place them. If your option loses, those scraps are gone — but daily bonuses, tag validation streaks, and winning bets help you recover.',
      },
    ],
  },
  {
    id: 'vault-scraps',
    title: 'Vault Scraps',
    items: [
      {
        q: 'How do I earn Vault Scraps?',
        a: 'Claim the daily bonus on My Profile (+250), validate tags (10-streak pays), win bets, unlock achievements, and stay active in community features.',
      },
      {
        q: 'What can I spend scraps on?',
        a: 'Bets, Chat Made Me Do It pledges, and shop cosmetics (titles, badges, frames). Scraps never leave ObscuraVT — they circulate inside the archive.',
      },
      {
        q: 'Where is my transaction history?',
        a: 'My Profile shows a scraps ledger after migration 010 — daily bonuses, shop purchases, pledges, and bet activity in one list.',
      },
      {
        q: 'Do creators get paid in scraps?',
        a: 'No. Scraps are fan-side engagement currency. The goal is to drive attention and clips back to creators\' real channels, not replace platform revenue.',
      },
    ],
  },
  {
    id: 'stream-resources',
    title: 'Stream Resources',
    items: [
      {
        q: 'What is on the Stream Resources page?',
        a: 'Chat Integrated Games (community-fed list), stream setup tools, and a debut checklist. Primary nav links here — built for indies prepping streams or fighting dead air.',
      },
      {
        q: 'Can I add my stream schedule?',
        a: 'Yes. Claimed creators can post schedule entries on their dossier so fans know when you are live. Fans can also propose times via schedule votes.',
      },
      {
        q: 'Where do submitted clips link?',
        a: 'Every clip must include a valid platform URL with a timestamp. ObscuraVT links out to the original — the goal is to drive views to your channel.',
      },
      {
        q: 'Any tips for getting discovered?',
        a: 'Keep tags accurate, encourage fans to submit clips with timestamps, and stay active in community features. Browse Discover by tags to see how similar creators are categorized.',
      },
    ],
  },
]
