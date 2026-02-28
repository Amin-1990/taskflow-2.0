# Instructions de Migration - ID_Operateur

## Problème
La colonne `ID_Operateur` n'existe pas dans la table `defauts_process`.

## Solution
Exécutez cette commande SQL dans votre base de données MySQL:

```sql
ALTER TABLE defauts_process 
ADD COLUMN ID_Operateur INT NULL AFTER ID_Poste,
ADD CONSTRAINT fk_defauts_process_operateur 
FOREIGN KEY (ID_Operateur) REFERENCES personnel(ID) ON DELETE SET NULL;
```

## Instructions
1. Ouvrez votre client MySQL (phpMyAdmin, MySQL Workbench, CLI, etc.)
2. Sélectionnez la base de données `taskflow`
3. Exécutez la commande SQL ci-dessus
4. Redémarrez le serveur Node.js
5. Testez à nouveau l'ajout de non-conformités

## Vérification
Après la migration, vérifiez que la colonne a bien été créée:

```sql
DESCRIBE defauts_process;
```

Vous devriez voir `ID_Operateur` dans la liste des colonnes.

## Fichier de migration
Le fichier SQL se trouve à: `backend/src/migrations/add_id_operateur_to_defauts_process.sql`
