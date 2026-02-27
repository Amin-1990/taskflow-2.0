# Bug Fix Summary - Quantity Update Issue

## Issues Identified

### 1. Unknown Column 'Statut' Error
**Problem**: Multiple SQL errors in server logs:
```
Unknown column 'Statut' in 'field list'
```

**Root Cause**: 
- The code was trying to UPDATE/SELECT a `Statut` column that doesn't exist in the `commandes` table
- References were in:
  - `commande.service.js` - Lines 97, 288, 402 (UPDATE statements)
  - `commande.controller.js` - Line 783 (SELECT statement)
  - `commande.service.js` - Line 214 (WHERE clause)

**Solution**:
1. Removed all `UPDATE commandes SET Statut = ?, Date_fin = NOW()` statements
2. Replaced with: `UPDATE commandes SET Date_fin = NOW()` 
3. Changed `getCommandesEnCours()` to use `Date_fin IS NULL` instead of `Statut != 'Terminée'`
4. Updated SELECT query in `getEmballageStats` to retrieve `Date_fin` instead of non-existent `Statut`

### 2. Quantity Validation Too Strict
**Problem**: Errors like:
```
Quantité emballée (235) ne peut pas dépasser cible (230)
Quantité emballée (257) ne peut pas dépasser cible (230)
```

**Root Cause**:
- The validation in `updateQuantiteEmballe()` was preventing users from packing more quantity than the calculated target
- This is too restrictive because:
  - Users may legitimately receive/pack more than initially forecasted
  - The validation prevented updates once the threshold was exceeded

**Solution**:
- Removed the validation check that enforced: `newQuantite <= limiteCible`
- Users can now pack any quantity without upper bound restrictions
- The system tracks the actual packed quantity in `Quantite_emballe`

## Files Modified

1. **backend/src/services/commande.service.js**
   - Removed 3 UPDATE statements setting non-existent `Statut` column
   - Removed validation that prevented exceeding target quantity
   - Modified `getCommandesEnCours()` to use `Date_fin IS NULL`

2. **backend/src/controllers/commande.controller.js**
   - Updated `getEmballageStats` query to select `Date_fin` instead of `c.Statut`

## Behavior Changes

### Before
- Packing operations would fail if quantity exceeded the target from planning_hebdo
- Status tracking relied on non-existent `Statut` column
- In-progress orders were checked via `Statut != 'Terminée'`

### After
- Users can pack any quantity (no upper bound enforced)
- Status is tracked via `Date_fin` field:
  - `Date_fin = NULL` → Order is in progress
  - `Date_fin IS NOT NULL` → Order is closed
- Quantity validation only checks positive numbers, not upper bounds
- Automatic closure still occurs when `Quantite_emballe >= target`

## Testing Recommendations

1. Test basic quantity update (should now work without validation errors)
2. Test packing quantity > target (should be allowed)
3. Test automatic order closure when target is reached
4. Verify `getEmballageStats` returns correct stats
5. Check that `getCommandesEnCours` returns only orders with `Date_fin IS NULL`

## Notes

- The idempotency deduplication mechanism remains in place (5-minute window)
- Audit logging is preserved
- Transaction rollback on errors is preserved
- Planning synchronization (`_syncPlanningHebdo`) continues to work
