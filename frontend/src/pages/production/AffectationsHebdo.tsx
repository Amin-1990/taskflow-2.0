import { type FunctionComponent } from 'preact';
import { AffectationsTemps } from './AffectationsTemps';

interface AffectationsHebdoProps {
  path?: string;
}

export const AffectationsHebdo: FunctionComponent<AffectationsHebdoProps> = () => {
  return <AffectationsTemps defaultView="hebdo" />;
};

export default AffectationsHebdo;
