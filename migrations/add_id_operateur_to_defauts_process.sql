-- Migration: Ajouter la colonne ID_Operateur à la table defauts_process
-- Date: 2024
-- Description: Ajoute le support du suivi de l'opérateur qui a signalé le défaut

ALTER TABLE defauts_process 
ADD COLUMN ID_Operateur INT NULL AFTER ID_Poste,
ADD CONSTRAINT fk_defauts_process_operateur 
FOREIGN KEY (ID_Operateur) REFERENCES personnel(ID) ON DELETE SET NULL;
