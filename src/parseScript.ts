import {ChatItem, Participant} from './schema';

/**
 * Turn a pasted plain-text script into structured chat items.
 *
 * Format (one item per line):
 *   Host: Hello there       -> a message from you (dark, right)
 *   Giulia: Hi! What time?   -> a message from the participant named "Giulia"
 *   # Today                  -> a centered date separator
 *   +❤️                      -> attaches a reaction to the previous message
 *
 * The label before the first ":" decides the sender. "host"/"me"/"you" (or the
 * host's name) => you; a participant's name => that participant. A line without
 * a recognized label continues the previous speaker.
 */
const HOST_WORDS = ['host', 'owner', 'me', 'io', 'h'];

const firstWord = (s: string) => s.trim().toLowerCase().split(/\s+/)[0] ?? '';

export const parseScript = (
  script: string,
  ctx: {hostName?: string; participants?: Participant[]} = {},
): ChatItem[] => {
  const hostFirst = firstWord(ctx.hostName ?? '');
  const participants = ctx.participants ?? [];
  const lines = script.split(/\r?\n/);
  const items: ChatItem[] = [];
  let lastSender = participants.length ? 'p0' : 'host';

  const lastMessage = () => {
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].type === 'message') return items[i] as Extract<ChatItem, {type: 'message'}>;
    }
    return null;
  };

  const senderFor = (label: string): string | null => {
    const l = label.trim().toLowerCase();
    if (HOST_WORDS.includes(l) || (hostFirst && l === hostFirst)) return 'host';
    const idx = participants.findIndex((p) => firstWord(p.name) === l);
    if (idx >= 0) return `p${idx}`;
    return null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.startsWith('#')) {
      const label = line.replace(/^#+\s*/, '').trim();
      if (label) items.push({type: 'separator', label});
      continue;
    }

    if (line.startsWith('+') && line.length <= 6) {
      const emoji = line.slice(1).trim();
      const prev = lastMessage();
      if (prev && emoji) prev.reaction = emoji;
      continue;
    }

    const colonIdx = line.indexOf(':');
    let sender: string | null = null;
    let text = line;
    if (colonIdx > 0 && colonIdx <= 24) {
      const s = senderFor(line.slice(0, colonIdx));
      if (s) {
        sender = s;
        text = line.slice(colonIdx + 1).trim();
      }
    }
    if (sender === null) {
      sender = lastSender;
      text = line;
    }
    if (!text) continue;

    items.push({type: 'message', sender, text});
    lastSender = sender;
  }

  return items;
};
