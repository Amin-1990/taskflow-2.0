import { type FunctionComponent } from 'preact';
import { AffectationsTemps } from './AffectationsTemps';

interface AffectationsChronoProps {
  path?: string;
}

export const AffectationsChrono: FunctionComponent<AffectationsChronoProps> = () => {
  return <AffectationsTemps defaultView="chrono" />;
};

export default AffectationsChrono;
