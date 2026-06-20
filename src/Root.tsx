import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {ChatReel} from './ChatReel';
import {Wireframe} from './Wireframe';
import {chatPropsSchema, ChatProps, DEFAULT_PROPS, SAMPLE_SCRIPT} from './schema';
import {parseScript} from './parseScript';
import {buildTimeline} from './timeline';

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

const defaultProps: ChatProps = {
  ...DEFAULT_PROPS,
  items: parseScript(SAMPLE_SCRIPT, {
    hostName: DEFAULT_PROPS.hostName,
    participants: DEFAULT_PROPS.participants,
  }),
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
        return {durationInFrames, fps: FPS, width: WIDTH, height: HEIGHT};
      }}
    />
  );
};

export const RootWithWireframe: React.FC = () => (
  <>
    <RemotionRoot />
    <Composition id="HeaderWireframe" component={Wireframe} fps={30} width={1080} height={940} durationInFrames={1} />
  </>
);

registerRoot(RootWithWireframe);
