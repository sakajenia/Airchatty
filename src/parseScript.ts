import {Message} from './schema';

/**
 * Turn a pasted plain-text script into structured messages.
 *
 * Format (one message per line):
 *   Host: Hello there
 *   Guest: Hi! What time is check-in?
 *
 * Rules:
 *  - The label before the first ":" decides the side.
 *  - "host" / "owner" / "h" => host side (left). Anything starting with the
 *    host's known custom name also maps to host.
 *  - "guest" / "tourist" / "me" / "you" / "g" => guest side (right).
 *  - A line WITHOUT a recognized "label:" continues the previous speaker as a
 *    new bubble (so you can paste multi-line messages naturally).
 *  - Blank lines are ignored.
 *
 * `hostName` lets a user label lines with the real host name (e.g. "Maria:")
 * and still have them recognized as the host.
 */
const HOST_WORDS = ['host', 'owner', 'h'];
const GUEST_WORDS = ['guest', 'tourist', 'traveler', 'traveller', 'me', 'you', 'g'];

const firstWord = (s: string) => s.trim().toLowerCase().split(/\s+/)[0] ?? '';

export const parseScript = (script: string, hostName = ''): Message[] => {
  const hostFirst = firstWord(hostName);
  const lines = script.split(/\r?\n/);
  const messages: Message[] = [];
  let lastSender: Message['sender'] = 'host';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const colonIdx = line.indexOf(':');
    let sender: Message['sender'] | null = null;
    let text = line;

    if (colonIdx > 0 && colonIdx <= 24) {
      const label = line.slice(0, colonIdx).trim().toLowerCase();
      const body = line.slice(colonIdx + 1).trim();
      if (HOST_WORDS.includes(label) || (hostFirst && label === hostFirst)) {
        sender = 'host';
        text = body;
      } else if (GUEST_WORDS.includes(label)) {
        sender = 'guest';
        text = body;
      }
    }

    if (sender === null) {
      // No recognized label: treat as a continuation bubble from last speaker.
      sender = lastSender;
      text = line;
    }

    if (!text) continue;
    messages.push({sender, text});
    lastSender = sender;
  }

  return messages;
};
