export type GraviteDefaut = 'Mineure' | 'Majeure' | 'Critique' | 'Bloquante';

export interface DefautProduit {
  ID: number;
  Code_defaut: string;
  Description: string;
  Cout_min: number | null;
  Date_creation: string | null;
  Date_modification: string | null;
  Commentaire: string | null;
}

export interface DefautProcess {
  ID: number;
  Date_defaut: string;
  ID_Article: number;
  Code_article: string;
  Code_defaut: string;
  Description_defaut: string;
  ID_Poste: number | null;
  Gravite: GraviteDefaut;
  Quantite_concernee: number;
  Impact_production: number | null;
  Date_creation: string | null;
  Commentaire: string | null;
}
