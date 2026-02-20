import { type FunctionComponent } from 'preact';
import { AffectationsTemps } from './AffectationsTemps';

interface AffectationOperateurDetailProps {
  path?: string;
}

export const AffectationOperateurDetail: FunctionComponent<AffectationOperateurDetailProps> = () => {
  return <AffectationsTemps defaultView="operateurs" />;
};

export default AffectationOperateurDetail;
