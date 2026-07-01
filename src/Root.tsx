import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ChatReel} from './ChatReel';
import {Wireframe} from './Wireframe';
import {chatPropsSchema, ChatProps, DEFAULT_PROPS, DEFAULT_ITEMS} from './schema';
import {buildTimeline, outroFrames} from './timeline';
import {LockScreen} from './components/LockScreen';
import {lockScreenFor} from './lockscreen';
import {IntroDisclaimer} from './components/IntroDisclaimer';
import {INTRO_DISCLAIMERS} from './introDisclaimers';
import {IntroChat, IntroChatProps, prepareIntroChat, introChatDuration} from './Intro';
import {pickDisclaimer} from './introDisclaimers';
import {KeyboardPreview} from './components/KeyboardPreview';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const defaultProps: ChatProps = {
  ...DEFAULT_PROPS,
  items: DEFAULT_ITEMS,
};

/** Default props for the full intro→chat composition (the lock-screen reveal). */
const introChatProps: IntroChatProps = {
  ...defaultProps,
  intro: {
    disclaimer: pickDisclaimer('demo'),
    lock: {...lockScreenFor('demo'), wallpaper: 'wallpapers/rome.jpg', darkWallpaper: false},
    // these are derived from the chat in calculateMetadata — just fallbacks here
    guestName: 'Giulia',
    guestSubtitle: 'Villa a Roma',
    guestPhoto: 'faces/face2.jpg',
    message: '',
    markerSec: 1.44,
  },
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ChatReel"
      component={ChatReel}
      schema={chatPropsSchema}
      defaultProps={defaultProps}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={300}
      calculateMetadata={({props}) => {
        const {durationInFrames} = buildTimeline(props.items, {
          fps: FPS,
          speed: props.speed,
          typingFor: props.typingFor,
          keyboard: props.keyboard,
        });
        return {
          durationInFrames: durationInFrames + outroFrames(props.outro, FPS),
          fps: FPS,
          width: WIDTH,
          height: HEIGHT,
        };
      }}
    />
  );
};

export const RootWithWireframe: React.FC = () => (
  <>
    <RemotionRoot />
    <Composition id="HeaderWireframe" component={Wireframe} fps={30} width={1080} height={940} durationInFrames={1} />
    <Composition
      id="IntroDisclaimer"
      component={IntroDisclaimer}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={150}
      defaultProps={{text: INTRO_DISCLAIMERS[0]}}
    />
    <Composition
      id="LockScreen"
      component={LockScreen}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={90}
      defaultProps={{
        data: {...lockScreenFor('demo-michelle'), wallpaper: 'wallpapers/rome.jpg', darkWallpaper: false},
        guestName: 'Michelle',
        guestSubtitle: 'Co-host on 10 listings',
        guestPhoto: 'faces/face2.jpg',
        message: 'Hi',
      }}
    />
    <Composition
      id="Keyboard"
      component={KeyboardPreview}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={1}
      defaultProps={{mode: 'letters' as const, pressedKey: 'g'}}
    />
    <Composition
      id="IntroChat"
      component={IntroChat}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={900}
      defaultProps={introChatProps as never}
      calculateMetadata={({props}) => {
        const prepared = prepareIntroChat(props as IntroChatProps, FPS);
        return {
          durationInFrames: introChatDuration(prepared, FPS),
          props: prepared,
          fps: FPS,
          width: WIDTH,
          height: HEIGHT,
        };
      }}
    />
  </>
);

registerRoot(RootWithWireframe);
