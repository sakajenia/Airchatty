import {Config} from '@remotion/cli/config';

// Render settings used by `npm run dev` (Remotion Studio) and `npm run render`.
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
// H.264 MP4 is the most broadly compatible output for social platforms.
Config.setCodec('h264');
