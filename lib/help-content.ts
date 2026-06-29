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
        a: 'A VTuber discovery site. Browse by vibe tags, clips, and dossiers — not subscriber count.',
      },
      {
        q: 'Do I need an account?',
        a: 'Browse without signing in. Create a free account to bet, clip, earn Vault Scraps, and customize your dashboard.',
      },
      {
        q: 'How do I find VTubers here?',
        a: 'Use Discover (tags or maps), Search, or the Find My Oshi quiz. Clips link back to each creator\'s channel.',
      },
      {
        q: 'What are Vault Scraps?',
        a: 'In-site currency for bets, shop items, and CMDI pledges. Earn them via daily bonus, tag validation, and winning bets.',
      },
    ],
  },
  {
    id: 'your-circle',
    title: 'Your Circle',
    items: [
      {
        q: 'What is Your Circle?',
        a: 'Creators you follow. Their CMDI goals, memes, Q&A, and schedule votes appear in one feed on your dashboard.',
      },
      {
        q: 'How do I add someone to my Circle?',
        a: 'Open a dossier and tap Add to Circle. Pin the Your Circle widget on your home page.',
      },
      {
        q: 'Can I customize my home page?',
        a: 'Yes. Use the customize control to add, remove, or reorder dashboard widgets.',
      },
      {
        q: 'What shows up in notifications?',
        a: 'Bet results, CMDI updates, Q&A, memes, karaoke, and schedule votes from creators in your Circle.',
      },
    ],
  },
  {
    id: 'chat-made-me-do-it',
    title: 'Chat Made Me Do It',
    items: [
      {
        q: 'What is Chat Made Me Do It?',
        a: 'Fans submit stream ideas. The creator picks one and sets a scraps goal. Funded goals become streams.',
      },
      {
        q: 'How do I submit an idea?',
        a: 'Sign in, open a creator\'s fan corner or CMDI board, and post a title plus details.',
      },
      {
        q: 'What are pledges?',
        a: 'Spend Vault Scraps toward an active goal. When funded_amount hits goal_amount, the stream is locked in.',
      },
      {
        q: 'I\'m a VTuber — how do I run it?',
        a: 'Claim your profile, open CMDI from Creator Dashboard, pick an idea, and set a scraps goal.',
      },
    ],
  },
  {
    id: 'fan-corner',
    title: 'Fan Corner',
    items: [
      {
        q: 'What is the Fan Corner?',
        a: 'Per-dossier hub for memes, fan art, karaoke, Q&A, predictions, and schedule votes.',
      },
      {
        q: 'How do clips work?',
        a: 'Submit clips with a timestamp and platform link. Community upvotes; every clip links to the original upload.',
      },
      {
        q: 'What are community bets?',
        a: 'Wager scraps on stream outcomes. Winners split the pool when the bet resolves. See the Bets page.',
      },
      {
        q: 'Can I submit memes or fan art?',
        a: 'Yes — from a dossier\'s fan corner. Fan art can be an image or Twitter/X link.',
      },
    ],
  },
  {
    id: 'creators-and-analytics',
    title: 'Creators and Analytics',
    items: [
      {
        q: 'How do I claim my VTuber profile?',
        a: 'Use the claim flow on your dossier or Creator Dashboard. Not listed yet? Nominate yourself.',
      },
      {
        q: 'What is the Creator Dashboard?',
        a: 'Hub for claimed profiles: schedule, CMDI, fan art, collab, resources, and analytics.',
      },
      {
        q: 'What does the Analytics page show?',
        a: 'Circle followers, memes, fan art, karaoke, Q&A, CMDI, and clips — activity on ObscuraVT only.',
      },
      {
        q: 'How are tags assigned?',
        a: 'Community and admin-curated tags. Validate tags in the Tag Validator to improve Discover placement.',
      },
    ],
  },
  {
    id: 'collab-and-corpo',
    title: 'Collab and Corpo',
    items: [
      {
        q: 'What is the Collab page?',
        a: 'Vibe match %, community overlap, blind collab, and schedule comparer between creators.',
      },
      {
        q: 'What are Corpo collectives?',
        a: 'Shared pages for small groups. Members show a recommended strip on each other\'s dossiers.',
      },
      {
        q: 'How do I create a collective?',
        a: 'Sign in, open Corpo Collectives, name it, pick members, and publish.',
      },
      {
        q: 'Is ObscuraVT trying to be a talent agency?',
        a: 'No. It\'s a discovery and community layer — no exclusivity or revenue splits.',
      },
    ],
  },
  {
    id: 'bets-and-predictions',
    title: 'Bets and Predictions',
    items: [
      {
        q: 'How do community bets work?',
        a: 'Pick an outcome and wager Vault Scraps. After wagering closes, fans vote to resolve. Winners split the pool.',
      },
      {
        q: 'What is the voting phase?',
        a: 'Open "Needs your vote" on the Bets page, pick the correct outcome, and submit.',
      },
      {
        q: 'Stream predictions on dossiers',
        a: 'Per-creator prediction bets. They appear in Your Circle and work like global bets.',
      },
      {
        q: 'Can I lose all my scraps?',
        a: 'Lost wagers are gone. Daily bonus, tag streaks, and winning bets help you recover.',
      },
    ],
  },
  {
    id: 'vault-scraps',
    title: 'Vault Scraps',
    items: [
      {
        q: 'How do I earn Vault Scraps?',
        a: 'Daily bonus (+250), tag validation streaks, winning bets, and achievements.',
      },
      {
        q: 'What can I spend scraps on?',
        a: 'Bets, CMDI pledges, and shop cosmetics. Scraps stay on ObscuraVT.',
      },
      {
        q: 'Where is my transaction history?',
        a: 'My Profile shows a scraps ledger — bonuses, shop, pledges, and bets.',
      },
      {
        q: 'Do creators get paid in scraps?',
        a: 'No. Scraps are fan-side currency. The goal is attention back to creators\' real channels.',
      },
    ],
  },
  {
    id: 'stream-resources',
    title: 'Stream Resources',
    items: [
      {
        q: 'What is on the Stream Resources page?',
        a: 'Chat-integrated games, setup tools, and a debut checklist.',
      },
      {
        q: 'Can I add my stream schedule?',
        a: 'Claimed creators post schedule slots on their dossier. Fans can propose times via schedule votes.',
      },
      {
        q: 'Where do submitted clips link?',
        a: 'Every clip requires a platform URL with a timestamp. ObscuraVT links out to the original.',
      },
      {
        q: 'Any tips for getting discovered?',
        a: 'Keep tags accurate, encourage clip submissions, and stay active in community features.',
      },
    ],
  },
]