import {ChatItem} from './schema';

/**
 * Turn a pasted plain-text script into structured chat items.
 *
 * Format (one item per line):
 *   Host: Hello there            -> a message from the host (left/grey or you)
 *   Guest: Hi! What time?        -> a message from the guest
 *   # Today                      -> a centered date separator
 *   +❤️                          -> attaches a reaction to the previous message
 *
 * Rules:
 *  - The label before the first ":" decides the side. "host"/"owner" => host,
 *    "guest"/"tourist"/"me"/"you" => guest. The host's/guest's real names also
 *    work as labels (e.g. "Sofia:" or "Maria:").
 *  - A line without a recognized label continues the previous speaker.
 *  - Blank lines are ignored.
 */
const HOST_WORDS = ['host', 'owner', 'cohost', 'co-host', 'h'];
const GUEST_WORDS = ['guest', 'tourist', 'traveler', 'traveller', 'booker', 'me', 'you', 'g'];

const firstWord = (s: string) => s.trim().toLowerCase().split(/\s+/)[0] ?? '';

export const parseScript = (
  script: string,
  names: {hostName?: string; guestName?: string} = {},
): ChatItem[] => {
  const hostFirst = firstWord(names.hostName ?? '');
  const guestFirst = firstWord(names.guestName ?? '');
  const lines = script.split(/\r?\n/);
  const items: ChatItem[] = [];
  let lastSender: 'host' | 'guest' = 'host';

  const lastMessage = () => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].type === 'message') return items[i] as Extract<ChatItem, {type: 'message'}>;
    }
    return null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Date separator: "# Today"
    if (line.startsWith('#')) {
      const label = line.replace(/^#+\s*/, '').trim();
      if (label) items.push({type: 'separator', label});
      continue;
    }

    // Reaction: "+❤️" attaches to the previous message
    if (line.startsWith('+') && line.length <= 6) {
      const emoji = line.slice(1).trim();
      const prev = lastMessage();
      if (prev && emoji) prev.reaction = emoji;
      continue;
    }

    const colonIdx = line.indexOf(':');
    let sender: 'host' | 'guest' | null = null;
    let text = line;

    if (colonIdx > 0 && colonIdx <= 24) {
      const label = line.slice(0, colonIdx).trim().toLowerCase();
      const body = line.slice(colonIdx + 1).trim();
      if (HOST_WORDS.includes(label) || (hostFirst && label === hostFirst)) {
        sender = 'host';
        text = body;
      } else if (GUEST_WORDS.includes(label) || (guestFirst && label === guestFirst)) {
        sender = 'guest';
        text = body;
      }
    }

    if (sender === null) {
      sender = lastSender; // continuation
      text = line;
    }
    if (!text) continue;

    items.push({type: 'message', sender, text});
    lastSender = sender;
  }

  return items;
};
