import {z} from 'zod';

/**
 * A chat item is either a message or a centered date separator
 * ("Today", "Wednesday", "26 May", …). Messages may carry an emoji reaction.
 */
export const messageItemSchema = z.object({
  type: z.literal('message'),
  sender: z.enum(['host', 'guest']),
  text: z.string(),
  reaction: z.string().optional(),
});
export const separatorItemSchema = z.object({
  type: z.literal('separator'),
  label: z.string(),
});
export const chatItemSchema = z.discriminatedUnion('type', [
  messageItemSchema,
  separatorItemSchema,
]);
export type MessageItem = z.infer<typeof messageItemSchema>;
export type SeparatorItem = z.infer<typeof separatorItemSchema>;
export type ChatItem = z.infer<typeof chatItemSchema>;

/**
 * Everything the ChatReel composition needs. These props are editable in
 * Remotion Studio and sent from the web app.
 */
export const chatPropsSchema = z.object({
  items: z.array(chatItemSchema),
  // The two people in the chat. The "other" person (not `youSide`) appears on
  // the left with their avatar + a "Name · Role time" label. "You" appear on
  // the right in a dark bubble with no avatar (just like the real Airbnb app).
  hostName: z.string(),
  hostRole: z.string(),
  hostAvatar: z.string(), // URL/data-URL; empty => initials avatar
  guestName: z.string(),
  guestRole: z.string(),
  guestAvatar: z.string(),
  youSide: z.enum(['guest', 'host']),
  // Centered header subtitle, e.g. "15–17 Jun · Casa Lisboa".
  headerSubtitle: z.string(),
  speed: z.number().min(0.3).max(3),
  sound: z.boolean(),
});
export type ChatProps = z.infer<typeof chatPropsSchema>;

/**
 * A friendly default conversation. Special lines:
 *   "# Today"  -> a centered date separator
 *   "+❤️"      -> attaches a reaction to the previous message
 */
export const SAMPLE_SCRIPT = `# Today
Host: Hi Maria! Welcome to Lisbon 🌸 So excited to host you
Guest: Thank you so much!! We can't wait 😍
Guest: Quick question — what time can we check in?
Host: Anytime after 3pm. I'll text you the door code that morning 🔑
Guest: Perfect, you're the best 🙏
+❤️
Host: Also don't miss the rooftop — best sunset in the city 🌅`;

export const DEFAULT_PROPS: ChatProps = {
  items: [],
  hostName: 'Sofia',
  hostRole: 'Host',
  hostAvatar: '',
  guestName: 'Maria',
  guestRole: 'Booker',
  guestAvatar: '',
  youSide: 'guest',
  headerSubtitle: '15–17 Jun · Casa Lisboa',
  speed: 1,
  sound: true,
};

/** Resolve display info for a message's sender from the props. */
export const personFor = (sender: 'host' | 'guest', p: ChatProps) =>
  sender === 'host'
    ? {name: p.hostName, role: p.hostRole, avatar: p.hostAvatar}
    : {name: p.guestName, role: p.guestRole, avatar: p.guestAvatar};
