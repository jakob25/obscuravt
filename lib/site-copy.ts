/** Shared user-facing strings — one tagline, no repeated pitch copy. */

export const SITE_NAME = 'ObscuraVT'

export const SITE_TAGLINE = 'Find VTubers by vibe and tag, not sub count.'

export const SITE_HERO = 'Find VTubers by vibe and tag, not sub count.'

export const SITE_DESCRIPTION =
  'Browse dossiers, clips, and community bets. Every clip links back to the creator.'

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
  pictures: 'Pictures',
  picturesOpen: 'Open post on X',
} as const

/** Add-a-VTuber form — paste a profile link, then edit anything that was pulled. */
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
      title: 'Tags',
      instruction: "Pick a constellation and any vibe tags that fit. You can skip this if you're not sure.",
    },
    review: {
      title: 'Review',
      instruction: "Look over the nomination, then submit it. It stays off the maps until it's approved.",
    },
  },
  skipLink: 'Enter details by hand',
  next: 'Next',
  back: 'Back',
  signIn: 'Sign in',
  stepOf: (current: number, total: number) => `Step ${current} of ${total}`,
  submittedTitle: 'Submitted for review!',
  submittedBody: 'Your VTuber will appear on the maps once approved.',
  reviewedBeforeMaps: 'Submissions are reviewed before appearing on the maps.',
} as const
