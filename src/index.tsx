import React from 'react';
import {Composition, registerRoot} from 'remotion';
import meta from '../public/pilot-meta.json';
import {Pilot} from './Pilot';
const Root: React.FC = () => <Composition id="HormuzPilot" component={Pilot}
 width={1920} height={1080} fps={30} durationInFrames={meta.durationFrames}
 defaultProps={{meta}} />;
registerRoot(Root);
