# Configuration du champ Opérateur pour Non-conformités Production

## État actuel
- ✅ Frontend : SelectSearch Opérateur implémenté
- ✅ Backend : Validateurs et contrôleurs prêts
- ⚠️ Base de données : Migration requise

## Étape 1 : Exécuter la Migration SQL

Exécutez la commande SQL suivante dans votre base de données MySQL:

```sql
ALTER TABLE defauts_process 
ADD COLUMN ID_Operateur INT NULL AFTER ID_Poste,
ADD CONSTRAINT fk_defauts_process_operateur 
FOREIGN KEY (ID_Operateur) REFERENCES personnel(ID) ON DELETE SET NULL;
```

### Via MySQL CLI:
```bash
mysql -u root -p taskflow < backend/src/migrations/add_id_operateur_to_defauts_process.sql
```

### Via phpMyAdmin:
1. Ouvrez phpMyAdmin
2. Sélectionnez la base de données `taskflow`
3. Allez à l'onglet SQL
4. Collez la commande SQL
5. Cliquez sur "Exécuter"

### Via MySQL Workbench:
1. Ouvrez MySQL Workbench
2. Connectez-vous à votre serveur
3. Sélectionnez la base `taskflow`
4. Créez une nouvelle requête
5. Collez la commande SQL
6. Exécutez (Ctrl+Shift+Enter)

## Étape 2 : Vérification

Vérifiez que la migration a réussi:

```sql
DESCRIBE defauts_process;
```

Vous devriez voir `ID_Operateur` dans la liste des colonnes.

## Étape 3 : Redémarrer le serveur

Après la migration, redémarrez le serveur Node.js:

```bash
# Dans le dossier backend
node server.js
```

## Étape 4 : Tester

1. Allez à http://10.0.1.6:5173/qualite/non-conformites-production
2. Cliquez sur "Ajouter non conformité"
3. Testez le SelectSearch Opérateur

## Champs du formulaire

| Champ | Type | Requis | Notes |
|-------|------|--------|-------|
| Code article | SelectSearch | ✅ | Affiche tous les articles |
| Opérateur | SelectSearch | ❌ | Nouveau champ - récupère nom du personnel |
| Poste | SelectSearch | ❌ | Affiche les postes disponibles |
| Description défaut | SelectSearch | ✅ | Sélectionne depuis lista_defauts_produit |
| Gravité | Select | ❌ | Mineure, Majeure, Critique, Bloquante |
| Quantité concernée | Number | ❌ | Par défaut 1 |
| Impact production | Number | ❌ | Optionnel |
| Commentaire | Text | ❌ | Optionnel |

## Résumé des modifications

### Frontend (déjà fait)
- ✅ Hook `usePostes.ts` pour charger les postes
- ✅ Hook `useAllArticles.ts` pour charger tous les articles
- ✅ Hook `useDefauts.ts` pour charger les défauts
- ✅ SelectSearch pour : Article, Opérateur, Poste, Défaut
- ✅ Interface `FormState` étendue

### Backend (partiellement fait, en attente de migration)
- ✅ Validateurs pour `ID_Operateur`
- ✅ Contrôleur `createDefaut` préparé (en attente de colonne)
- ✅ Contrôleur `updateDefaut` préparé (en attente de colonne)
- ✅ Queries SELECT avec LEFT JOIN `personnel`
- ⏳ Migration SQL (REQUIERT EXÉCUTION MANUELLE)

## Problème rencontré et résolution

**Erreur initiale:**
```
Erreur createDefaut: Unknown column 'ID_Operateur' in 'field list'
```

**Raison:** La colonne n'existait pas dans la table `defauts_process`

**Solution:** Exécuter la migration SQL ci-dessus pour créer la colonne

## Support
Si vous rencontrez d'autres erreurs après la migration, vérifiez:
1. Que la migration a bien été exécutée
2. Que les noms de colonnes sont corrects (ID_Operateur, pas Operateur_ID)
3. Que la contrainte de clé étrangère vers `personnel` est créée
4. Que le serveur Node.js a bien été redémarré
