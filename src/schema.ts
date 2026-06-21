import {z} from 'zod';

/**
 * A chat item is either a message or a centered date separator.
 * Messages may carry an emoji reaction. The sender id is "host" (you, the dark
 * bubbles on the right) or "p0".."p3" — one of the other participants.
 */
export const messageItemSchema = z.object({
  type: z.literal('message'),
  sender: z.string(),
  text: z.string(),
  reaction: z.string().optional(),
  // Host only: an "honest" draft typed out then fully deleted before `text` is
  // typed and sent (the polite version).
  draft: z.string().optional(),
  // Host only: SEVERAL cynical drafts, each typed then deleted one after another
  // (up to 5), before the polite `text` is finally sent. Takes priority over
  // `draft` when present.
  drafts: z.array(z.string()).optional(),
  // Photo message — renders an image bubble (sent separately from any text).
  photo: z.string().optional(),
  // false → the message is already on screen when recording starts (no typing
  // / no "…" dots). Used for the very first message of the conversation.
  animate: z.boolean().optional(),
});
export const separatorItemSchema = z.object({
  type: z.literal('separator'),
  label: z.string(),
});
export const chatItemSchema = z.discriminatedUnion('type', [messageItemSchema, separatorItemSchema]);
export type MessageItem = z.infer<typeof messageItemSchema>;
export type SeparatorItem = z.infer<typeof separatorItemSchema>;
export type ChatItem = z.infer<typeof chatItemSchema>;

/** One of the other people in the chat (shown on the left). */
export const participantSchema = z.object({
  name: z.string(),
  role: z.string(), // "Booker", "Co-host", …
  avatar: z.string(), // public path / data-URL / http; empty => initials avatar
});
export type Participant = z.infer<typeof participantSchema>;

/**
 * Everything the ChatReel composition needs. "host" is you (dark bubbles, right,
 * types on the keyboard). The participants are the 1–4 other people you're
 * chatting with (light bubbles, left, with avatar + "Name · Role time").
 */
export const chatPropsSchema = z.object({
  items: z.array(chatItemSchema),
  hostName: z.string(),
  hostRole: z.string(),
  hostAvatar: z.string(),
  participants: z.array(participantSchema),
  // Header: a date range and a (long) listing name, joined as "date · apt" and
  // clipped with an ellipsis when too wide.
  headerDate: z.string(),
  headerApt: z.string(),
  typingFor: z.enum(['host', 'guest', 'both', 'none']),
  // Screen-recording mode: show the iPhone keyboard and have the host type.
  keyboard: z.boolean(),
  speed: z.number().min(0.3).max(3),
  sound: z.boolean(),
});
export type ChatProps = z.infer<typeof chatPropsSchema>;

/**
 * A friendly default conversation. Special lines:
 *   "# Today"   -> a centered date separator
 *   "+❤️"       -> attaches a reaction to the previous message
 * Label each line with "Host:" (you) or a participant's name.
 */
export const SAMPLE_SCRIPT = `# Today
Host: Ciao a tutti! Benvenuti a Roma 🌟 Non vedo l'ora di ospitarvi
Giulia: Grazie mille!! Siamo super emozionati 😍
Marco: A che ora possiamo fare il check-in?
Host: Dalle 15 in poi, vi mando il codice della porta 🔑
Giulia: Perfetto, siete gentilissimi 🙏
+❤️
Host: E non perdetevi la terrazza sul tetto, tramonto pazzesco 🌅`;

/** Default participants for the sample (one with an AI face, one without). */
export const DEFAULT_PARTICIPANTS: Participant[] = [
  {name: 'Giulia', role: 'Booker', avatar: 'faces/face2.jpg'},
  {name: 'Marco', role: 'Booker', avatar: ''},
];

/**
 * Default conversation demonstrating the core mechanic: the guest asks a silly
 * question, the host types the honest (rude) reply, deletes it, then sends a
 * polite one. The first message is already on screen (no animation).
 */
export const DEFAULT_ITEMS: ChatItem[] = [
  {type: 'separator', label: 'Today'},
  {type: 'message', sender: 'p0', text: 'Ciao! Scusa il disturbo 🙂', animate: false},
  {type: 'message', sender: 'p0', text: 'Dove si accendono le luci?? Non riesco a trovarle 🙈'},
  {
    type: 'message',
    sender: 'host',
    draft: 'Ma è possibile che tu non veda gli interruttori che ci sono in ogni stanza??',
    text: "Ciao! Le luci sono di fianco alla porta d'ingresso, sulla destra 😊",
  },
];

export const DEFAULT_PROPS: ChatProps = {
  items: [],
  hostName: 'Lorenzo',
  hostRole: 'Host',
  hostAvatar: 'faces/face1.jpg',
  participants: DEFAULT_PARTICIPANTS,
  headerDate: '23–29 Jun',
  headerApt: 'Villa di Prestigio Privata con Piscina e Suite',
  typingFor: 'guest',
  keyboard: true,
  speed: 1,
  sound: true,
};

/** Resolve display info for a message's sender id from the props. */
export const personFor = (sender: string, p: ChatProps): Participant => {
  if (sender === 'host') return {name: p.hostName, role: p.hostRole, avatar: p.hostAvatar};
  const idx = Number(sender.replace(/^p/, ''));
  return p.participants[idx] ?? p.participants[0] ?? {name: 'Guest', role: 'Booker', avatar: ''};
};
