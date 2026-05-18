/**
 * Friendly defaults so the create-mailbox / create-project dialogs
 * land prefilled — the user can submit on Enter without typing
 * anything, but can still edit if they want.
 */

const ADJECTIVES = [
  "swift",
  "calm",
  "bold",
  "bright",
  "vivid",
  "quiet",
  "rapid",
  "stoic",
  "warm",
  "lively",
  "neat",
  "wise",
  "noble",
  "deep",
  "fresh",
  "amber",
  "azure",
  "crimson",
  "golden",
  "silver",
  "humble",
  "lucid",
  "merry",
  "nimble",
  "polished",
  "candid",
  "tidy",
  "kindly",
  "gentle",
  "modest",
];

const NOUNS = [
  "river",
  "eagle",
  "pine",
  "quartz",
  "comet",
  "harbor",
  "meadow",
  "ember",
  "compass",
  "summit",
  "willow",
  "delta",
  "horizon",
  "ridge",
  "anchor",
  "beacon",
  "lantern",
  "orchid",
  "raven",
  "thistle",
  "cobalt",
  "ivory",
  "marble",
  "saffron",
  "sable",
  "linen",
  "cedar",
  "fjord",
  "atlas",
  "haven",
];

function pick<T>(arr: ReadonlyArray<T>): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Lowercase-dash two-word name: "swift-river", "amber-cedar". Stable
 * across re-renders only if the caller memoises it — re-invoking always
 * returns a new pair.
 */
export function suggestName(): string {
  return `${pick(ADJECTIVES)}-${pick(NOUNS)}`;
}

/**
 * Lowest unused port at or above the dev convention 1025, bounded by
 * 65535. Searches a `Set<number>` of taken ports.
 */
export function suggestPort(taken: ReadonlySet<number>, start = 1025): number {
  let port = start;
  while (taken.has(port) && port < 65535) port++;
  return port;
}
