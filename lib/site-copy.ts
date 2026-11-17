/** Shared user-facing strings — one tagline, no repeated pitch copy. */

export const SITE_NAME = 'ObscuraVT'

export const SITE_TAGLINE = 'Find VTubers by vibe and tag, not sub count.'

export const SITE_HERO = 'Find VTubers by vibe and tag, not sub count.'

export const SITE_DESCRIPTION =
  'Find VTubers by vibe, tags and clips, not sub count. Every clip links back to the creator.'


/** Public X account for feedback and profile-link requests. Handle is the single source. */
const X_HANDLE = 'blujayrx'
const X_AT_HANDLE = `@${X_HANDLE}`

export const SITE_CONTACT = {
  handle: X_HANDLE,
  atHandle: X_AT_HANDLE,
  url: `https://x.com/${X_HANDLE}`,
} as const

export const TESTING_BANNER = {
  label: '◈ EARLY TESTING',
  body: 'ObscuraVT is currently in early testing. Things may break.',
  feedback: `Report feedback to ${X_AT_HANDLE} on X`,
} as const

export const EMPTY = {
  clips: 'No clips yet.',
  circle: 'Add creators from Discover to see their activity here.',
  circleQuiet: 'Nothing new from your Circle right now.',
  schedule: 'No schedule on file.',
  bets: 'No open bets.',
  cmdmi: 'No active goal.',
  notifications: 'No notifications.',
  weekly: 'Loading digest…',
  digestOffline: 'Digest unavailable.',
} as const
/** Dossier folio controls and honest empty states; no invented world records. */
export const DOSSIER = {
  open: 'Open dossier',
  close: 'Close dossier',
  pages: 'Dossier pages',
  profile: 'Profile',
  subjectArchive: 'ObscuraVT / Subject Archive',
  archiveTab: 'Subject Archive',
  codename: 'Codename',
  handle: 'Handle',
  filedUnder: 'Filed under',
  platform: 'Platform',
  partOf: 'Part of',
  snapshot: 'Subject snapshot',
  noSnapshot: 'No subject snapshot on file.',
  onRecord: 'FILE ON RECORD',
  subjectRecord: 'Subject record / 01',
  previous: '← Previous',
  next: 'Next →',
  swipeHint: 'Swipe left for the next page · right to go back',
  world: 'World',
  clips: 'Clips',
  art: 'Art',
  lore: 'Lore',
  characters: 'Characters',
  noLore: 'No world lore on file.',
  noCharacters: 'No characters on file.',
  collective: 'Collective on file',
  members: 'Members',
  artEmpty: 'No art on file.',
  artUnavailable: 'Art is temporarily unavailable.',
  artTitle: 'Collected art',
  artImage: 'Fan art',
  artExpand: 'Expand artwork',
  artSource: 'View source',
  submittedBy: 'Submitted by',
  artAll: 'Gallery →',
  clipsAll: 'All clips →',
  claimed: '● CLAIMED FILE',
  unclaimed: '● UNCLAIMED FILE',
  requestLink: `Is this you? Message ${X_AT_HANDLE} on X to get this profile linked to your account.`,
  /** Dossier button to the /claim page (CMO spec, Nov 16 2026). */
  claimCta: 'CLAIM THIS FILE →',
  pictures: 'Pictures',
  picturesOpen: 'Open post on X',
} as const

/** Add-a-VTuber form — paste a profile link, then edit anything that was pulled. */
/** One line on /bets. Scraps only come from site activity (see /shop restock copy) and only
 * buy site titles; there is no payment or cash-out path in the app. */
export const BETS_SCRAPS_NOTE =
  "Scraps are ObscuraVT's own play currency. You earn them on the site, they only work here, and they can't be bought or cashed out."

/** Discover map first-visit hint, second line. The niche line restates the Add VTuber
 * niche step (VTUBER_SUBMIT.steps.niche.instruction) for people browsing. */
export const DISCOVER_MAP_HINT = {
  vibe: 'Personality constellations — not genre buckets.',
  niche: 'Niche rooms — find creators by exactly what makes them different.',
}

export const VTUBER_SUBMIT = {
  pasteLink: 'Paste an X, YouTube, or Twitch profile link',
  linkPlaceholder: 'twitch.tv/name',
  lookingUp: 'Pulling the profile…',
  lookupFailed: "Couldn't pull the profile. The link is saved — fill in the rest on the next step.",
  lookupX: 'Saved the X link and handle. Add the name, bio, and a picture on the next step.',
  alreadyInVault: (name: string) => `${name} is already in the Vault.`,
  alreadyNominated: (name: string) =>
    `${name} has already been nominated and is waiting for approval.`,
  alreadyUnsure: 'That handle already matches more than one creator. An admin will sort it out.',
  steps: {
    signin: {
      title: 'Sign in to nominate',
      instruction: "We'll bring you back here to finish the form.",
    },
    link: {
      title: 'Profile link',
      instruction:
        "Paste the creator's X, YouTube, or Twitch profile link and we'll pull in what we can. You can also skip this and enter the details yourself.",
    },
    details: {
      title: 'Details',
      instruction: "Check the name, handle, platform, bio, and picture. Edit anything that's wrong or missing.",
    },
    tags: {
      title: 'Vibe tags',
      instruction: "Add a few that fit, or skip if you're not sure.",
    },
    niche: {
      title: "What's your niche?",
      instruction: 'Pick the room that matches what makes you different, so fans looking for exactly that can find you.',
    },
    constellation: {
      title: 'Which constellation fits your vibe?',
      instruction: 'This is what puts you on the constellation pages and in Find My Oshi results.',
    },
    review: {
      title: 'Review',
      instruction: "Look over the nomination, then submit it. It stays off the maps until it's approved.",
    },
  },
  skipLink: 'Enter details by hand',
  skipTags: 'Skip',
  constellationLabel: 'Constellation',
  noNiche: 'No niche was picked.',
  noConstellation: 'No constellation was picked.',
  addCategory: 'Add a new category',
  addCategoryButton: 'Add',
  addCategoryHint: 'New categories are reviewed before they appear on the site.',
  categoryNew: 'New',
  closeMatch: (name: string) => `Did you mean ${name}? That's already on the list.`,
  customLimit: 'You can suggest up to 3 new categories.',
  reviewNiche: 'Niche',
  reviewConstellation: 'Constellation',
  reviewNewCategories: 'New categories',
  next: 'Next',
  back: 'Back',
  signIn: 'Sign in',
  stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
  submittedTitle: 'Submitted for review!',
  submittedBody: 'Your VTuber will appear on the maps once approved.',
  reviewedBeforeMaps: "We check each nomination to make sure it's a real VTuber channel that isn't already on the map.",
} as const

/** Homepage hero (CMO spec, Nov 16 2026). */
export const HOME_HERO = {
  title: 'Find VTubers by vibe, not sub count.',
  sub: 'Watch a clip. Open the file. Follow the channel. Free. No agency. No cut.',
  findOshi: 'FIND MY OSHI →',
  nominate: 'NOMINATE A SUBJECT →',
  fileClip: '+ FILE A CLIP',
  joinVault: '+ JOIN THE VAULT',
} as const

/** Homepage share card lines (CMO spec). The second line is the site tagline. */
export const HOME_SHARE_LINE = "THE ALGORITHM DIDN'T SHOW YOU THIS. YOU DID."

/** Find My Oshi results + share (CMO spec). */
export const OSHI_SHARE = {
  resultHeading: 'YOUR OSHI FILE // DECLASSIFIED',
  shareLabel: 'SHARE MY FILE',
} as const

/** Badge on the i-th quiz result: how closely it fits your answers, not a ranking of creators. */
export function oshiMatchBadge(i: number): string {
  return `MATCH ${String(i + 1).padStart(2, '0')}`
}

export function oshiShareText(topMatch: string): string {
  return `My oshi file came back: ${topMatch}. Matched by vibe, not sub count. Find yours →`
}

/** Per-page titles/descriptions (CMO spec). Find My Oshi's question count is filled in from the quiz data. */
export const PAGE_META = {
  findMyOshi: {
    title: 'Find My Oshi — VTuber vibe quiz · ObscuraVT',
    description: (questionCount: number) =>
      `${questionCount} questions. No follower counts. Get matched to VTubers by vibe.`,
  },
  discover: { title: 'Vibe Map — browse VTubers by personality · ObscuraVT' },
  clips: { title: 'Raw Clips — every clip links back to the creator · ObscuraVT' },
  nominator: {
    title: 'Nominate a VTuber · ObscuraVT',
    description: 'Name a VTuber the algorithm skipped. We verify, then file them.',
  },
} as const

/**
 * /claim page (CMO spec, Nov 16 2026). "What claiming does" lists only abilities that
 * owner-gated code grants today (ownsVtuber checks in app/api/schedule, cmdmi set_goal, qa,
 * karaoke status, stream-predictions, analytics, discovery-games/silhouette, collab/request,
 * vtubers/owner-edit).
 * The footer promise about take-downs is held until Jacob confirms it.
 */
export const CLAIM_PAGE = {
  title: 'CLAIM YOUR FILE',
  body: ['Your file is on record. Claiming it is free.', 'No agency. No exclusivity. No revenue split.'],
  doesTitle: 'What claiming does',
  doesIntro: 'Your file gets marked as yours ("Your dossier") and you unlock the Creator Dashboard:',
  does: [
    'Edit your file: change your bio and picture from the Creator Dashboard.',
    'Stream schedule: set your weekly stream slots.',
    'Chat Made Me Do It: run the stream ideas fans pitch and pledge scraps to.',
    'Fan Corner controls: host Q&A sessions, manage the karaoke queue, post stream predictions.',
    'Analytics: your Circle size and fan submissions on ObscuraVT.',
    'Silhouette game: set up your silhouette for the guessing game.',
    'Collab requests: send and get collab requests from other claimed creators who share a tag.',
    'Your file shows CLAIMED FILE instead of UNCLAIMED.',
  ],
  stepsTitle: 'How to claim',
  steps: [
    'Make a free ObscuraVT account.',
    `DM ${X_AT_HANDLE} on X from your VTuber account with your file link.`,
    'We check that your channel and socials link to each other, then hand you the keys.',
  ],
} as const
