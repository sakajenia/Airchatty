import {z} from 'zod';

/**
 * A single chat message. `sender` is normalized to either the host or the guest.
 * The raw label the user typed (e.g. "Maria", "Host") is kept for reference.
 */
export const messageSchema = z.object({
  sender: z.enum(['host', 'guest']),
  text: z.string(),
});
export type Message = z.infer<typeof messageSchema>;

/**
 * Everything the ChatReel composition needs to render. These are the "props"
 * that are editable in Remotion Studio and sent from the web app.
 */
export const chatPropsSchema = z.object({
  // The conversation, already parsed into messages.
  messages: z.array(messageSchema),
  // Header info for the Airbnb-style chat screen.
  hostName: z.string(),
  // URL or data-URL for the host photo. Empty string => default avatar.
  hostAvatar: z.string(),
  // Which column is "you" (the right-hand, accent-colored side).
  youSide: z.enum(['guest', 'host']),
  // Pacing multiplier. 1 = normal, <1 faster, >1 slower.
  speed: z.number().min(0.3).max(3),
  // Toggle message-pop sounds + background music.
  sound: z.boolean(),
});
export type ChatProps = z.infer<typeof chatPropsSchema>;

/** A friendly default conversation so the canvas is never empty. */
export const SAMPLE_SCRIPT = `Host: Hi Maria! Welcome to Lisbon 🌸 So excited to host you
Guest: Thank you so much!! We can't wait 😍
Guest: Quick question — what time can we check in?
Host: Anytime after 3pm. I'll text you the door code that morning 🔑
Guest: Perfect, you're the best 🙏
Host: Also there's a little rooftop with sunset views — don't miss it 🌅`;

export const DEFAULT_PROPS: ChatProps = {
  messages: [], // filled in by Root via calculateMetadata/defaultProps parsing
  hostName: 'Maria · Lisbon Host',
  hostAvatar: '',
  youSide: 'guest',
  speed: 1,
  sound: true,
};
