import React from 'react';
import {Composition} from 'remotion';
import {IstanbulFilm} from './IstanbulFilm';

export const Root: React.FC = () => <Composition
  id="IstanbulFilm"
  component={IstanbulFilm}
  durationInFrames={7 * 60 * 24}
  fps={24}
  width={1920}
  height={1080}
/>;
