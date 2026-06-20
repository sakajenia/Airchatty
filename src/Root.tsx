import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ChatReel} from './ChatReel';
import {chatPropsSchema, ChatProps, DEFAULT_PROPS, SAMPLE_SCRIPT} from './schema';
import {parseScript} from './parseScript';
import {buildTimeline} from './timeline';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

// Default props for the Studio: parse the built-in sample conversation.
const defaultProps: ChatProps = {
  ...DEFAULT_PROPS,
  messages: parseScript(SAMPLE_SCRIPT, DEFAULT_PROPS.hostName),
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
      // Auto-size the video to the conversation length from the props.
      calculateMetadata={({props}) => {
        const {durationInFrames} = buildTimeline(props.messages, {
          fps: FPS,
          speed: props.speed,
          youSide: props.youSide,
        });
        return {durationInFrames, fps: FPS, width: WIDTH, height: HEIGHT};
      }}
    />
  );
};

registerRoot(RemotionRoot);
