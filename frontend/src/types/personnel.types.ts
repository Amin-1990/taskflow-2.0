/**
 * Types et Interfaces pour la gestion du Personnel
 */

export interface Personnel {
  ID: number;
  Nom_prenom: string;
  Matricule: string;
  Qr_code?: string;
  Email?: string;
  Date_embauche: string;        // YYYY-MM-DD
  Date_naissance?: string;       // YYYY-MM-DD
  Poste: 'Operateur' | 'Chef de ligne' | 'Responsable QC' | 'Maintenance';
  Statut: 'actif' | 'inactif';
  Type_contrat: 'CDI' | 'CDD' | 'Stage' | 'Contrat temporaire';
  Date_fin_contrat?: string;     // YYYY-MM-DD
  Site_affectation?: string;
  Numero_CNSS?: string;
  Adresse?: string;
  Ville?: string;
  Code_postal?: string;
  Telephone?: string;
  Commentaire?: string;
}

export interface PersonnelFilters {
  search?: string;               // Nom, Matricule, Email
  statut?: 'actif' | 'inactif';
  poste?: Personnel['Poste'];
  site?: string;
  type_contrat?: Personnel['Type_contrat'];
  dateEmbaucheMin?: string;
  dateEmbaucheMax?: string;
}

export interface PersonnelStats {
  totalEmployes: number;
  actifs: number;
  inactifs: number;
  parPoste: Record<string, number>;
  parSite: Record<string, number>;
  parContrat: Record<string, number>;
  averageAnciennete: number;     // en mois
}

export interface PersonnelImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    matricule: string;
    error: string;
  }>;
}

export interface PersonnelAuditLog {
  id: number;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  matricule: string;
  changedBy: string;
  changedAt: string;
  changes?: Record<string, any>;
}

// Enums
export const POSTE_OPTIONS = [
  'Operateur',
  'Chef de ligne',
  'Responsable QC',
  'Maintenance'
] as const;

export const STATUT_OPTIONS = ['actif', 'inactif'] as const;

export const TYPE_CONTRAT_OPTIONS = [
  'CDI',
  'CDD',
  'Stage',
  'Contrat temporaire'
] as const;

// Utilitaires
export const getDefaultPersonnelData = (): Partial<Personnel> => ({
  Statut: 'actif',
  Poste: 'Operateur',
  Type_contrat: 'CDI',
  Date_embauche: new Date().toISOString().split('T')[0]
});

export const getPersonnelAge = (dateNaissance?: string): number | null => {
  if (!dateNaissance) return null;
  const today = new Date();
  const birthDate = new Date(dateNaissance);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const getAnciennete = (dateEmbauche: string): string => {
  const today = new Date();
  const hireDate = new Date(dateEmbauche);
  const diffTime = Math.abs(today.getTime() - hireDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);
  
  if (diffYears > 0) {
    return `${diffYears} an${diffYears > 1 ? 's' : ''}`;
  } else if (diffMonths > 0) {
    return `${diffMonths} mois`;
  } else {
    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  }
};
