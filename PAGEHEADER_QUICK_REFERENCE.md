# PageHeader Quick Reference Guide

## 20 Standardized Pages

### ✅ Maintenance Module (5)
1. **Interventions.tsx** - Template, Import, Export, Refresh
2. **Machines.tsx** - Template, Import, Export
3. **TypesMachine.tsx** - Import, Export
4. **DefautsTypeMachine.tsx** - Import, Export
5. **MaintenanceDashboard.tsx** - Refresh

### ✅ Production Module (3)
6. **Commandes.tsx** - Template, Import, Export
7. **Planning.tsx** - Template, Import, Export, Refresh (already had PageHeader)
8. **Semaines.tsx** - Template, Import, Export (updated Phase 2)

### ✅ Planning/Analysis Module (2)
9. **AnalyseCharge.tsx** - Export + Navigation buttons (updated Phase 3)
10. **SuiviRealisation.tsx** - Refresh + Navigation buttons (updated Phase 3)

### ✅ Admin Module (6)
11. **AdminMatrice.tsx** - Export, Refresh
12. **Dashboard.tsx** - Refresh + Period selector
13. **AdminDashboard.tsx** - Refresh
14. **AdminUsers.tsx** - Refresh + Create user
15. **AdminSessions.tsx** - Refresh (with session count)
16. **AdminAudit.tsx** - Export, Refresh

### ✅ Personnel Module (2)
17. **Pointage.tsx** - Template, Import, Export, Refresh (updated Phase 2)
18. **Horaires.tsx** - Template, Import, Export, Refresh + Add button (updated Phase 2)

### ✅ Articles Module (1)
19. **Articles.tsx** - Template, Import, Export

### ✅ Dashboard Module (1)
20. **Dashboard.tsx** - Refresh + Period selector

---

## Basic Usage

### Template Only
```tsx
import PageHeader from '../../components/common/PageHeader';

<PageHeader
  title="Page Title"
  showTemplate={true}
  onTemplate={handleDownloadTemplate}
  isDownloadingTemplate={isLoading}
/>
```

### All Standard Actions
```tsx
<PageHeader
  title="Page Title"
  subtitle="Optional subtitle"
  showTemplate={canWrite('MODULE')}
  showImport={canWrite('MODULE')}
  showExport={true}
  showRefresh={true}
  onTemplate={handleTemplate}
  onImport={() => fileInputRef.current?.click()}
  onExport={handleExport}
  onRefresh={handleRefresh}
  isDownloadingTemplate={isTemplateLoading}
  isImporting={isImporting}
  isExporting={isExporting}
  isRefreshing={isRefreshing}
/>
```

### With Custom Actions
```tsx
<PageHeader
  title="Page Title"
  showExport={true}
  onExport={handleExport}
  actions={
    <CustomButton onClick={handleAction}>
      Custom Action
    </CustomButton>
  }
/>
```

### With Navigation
```tsx
<PageHeader
  title="Analysis Page"
  showRefresh={true}
  onRefresh={handleRefresh}
  actions={
    <>
      <button onClick={() => navigate('/page1')}>Page 1</button>
      <button onClick={() => navigate('/page2')}>Page 2</button>
    </>
  }
/>
```

---

## Import Statement

```tsx
import PageHeader from '../../components/common/PageHeader';
// or from admin pages:
import PageHeader from '../../../components/common/PageHeader';
```

---

## Property Mapping

| Feature | Prop | Handler | Loading State |
|---------|------|---------|---------------|
| Template | `showTemplate` | `onTemplate` | `isDownloadingTemplate` |
| Import | `showImport` | `onImport` | `isImporting` |
| Export | `showExport` | `onExport` | `isExporting` |
| Refresh | `showRefresh` | `onRefresh` | `isRefreshing` |

---

## Common Patterns

### Pattern 1: Full CRUD Page
```tsx
<PageHeader
  title="Articles"
  subtitle={`Total: ${total}`}
  showTemplate={canWrite('ARTICLES')}
  showImport={canWrite('ARTICLES')}
  showExport={true}
  showRefresh={true}
  onTemplate={downloadTemplate}
  onImport={importClick}
  onExport={exportData}
  onRefresh={loadData}
  isDownloadingTemplate={downloading}
  isImporting={importing}
  isExporting={exporting}
  isRefreshing={false}
/>
```

### Pattern 2: Read-Only with Export
```tsx
<PageHeader
  title="Dashboard"
  showExport={true}
  onExport={exportDashboard}
  actions={<PeriodSelector ... />}
/>
```

### Pattern 3: Admin List
```tsx
<PageHeader
  title="Users"
  showRefresh={true}
  onRefresh={loadUsers}
  actions={<CreateButton ... />}
/>
```

### Pattern 4: Analysis Page
```tsx
<PageHeader
  title="Analysis"
  showRefresh={true}
  onRefresh={reload}
  actions={
    <>
      <NavButton to="/page1">Page 1</NavButton>
      <NavButton to="/page2">Page 2</NavButton>
    </>
  }
/>
```

---

## Removed Imports

These icons are now **internal to PageHeader** - remove them from your imports:

```tsx
// ❌ Remove these:
import { Download, Upload, RefreshCw } from 'lucide-preact';

// ✅ Keep only what you need:
import { Plus, Edit, Delete } from 'lucide-preact'; // for custom buttons
```

---

## File Structure

```
frontend/src/
├── components/common/
│   └── PageHeader.tsx ⭐ (The standardized component)
├── pages/
│   ├── admin/
│   │   ├── AdminMatrice.tsx ✅
│   │   ├── AdminUsers.tsx ✅
│   │   ├── AdminSessions.tsx ✅
│   │   ├── AdminAudit.tsx ✅
│   │   └── AdminDashboard.tsx ✅
│   ├── articles/
│   │   └── Articles.tsx ✅
│   ├── maintenance/
│   │   ├── Interventions.tsx ✅
│   │   ├── Machines.tsx ✅
│   │   ├── TypesMachine.tsx ✅
│   │   ├── DefautsTypeMachine.tsx ✅
│   │   └── MaintenanceDashboard.tsx ✅
│   ├── production/
│   │   ├── Commandes.tsx ✅
│   │   ├── Planning.tsx ✅
│   │   └── Semaines.tsx ✅
│   ├── planning/
│   │   ├── analyse/
│   │   │   └── AnalyseCharge.tsx ✅
│   │   └── realisation/
│   │       └── SuiviRealisation.tsx ✅
│   ├── personnel/
│   │   ├── Pointage.tsx ✅
│   │   └── Horaires.tsx ✅
│   ├── Dashboard.tsx ✅
│   └── (4 remaining pages - out of scope)
```

---

## Checklist for New Pages

When creating a new page with standard actions:

- [ ] Import PageHeader: `import PageHeader from '...'`
- [ ] Define your action handlers (template, import, export, refresh)
- [ ] Define loading states for each action
- [ ] Use PageHeader with appropriate `show*` and `on*` props
- [ ] Pass loading states with `is*` props
- [ ] Remove unused icon imports
- [ ] Add custom actions to `actions` prop if needed
- [ ] Test permission checks with `canWrite()`

---

## Migration Checklist

If updating an existing page to use PageHeader:

- [ ] Add PageHeader import
- [ ] Remove manual header div structure
- [ ] Remove ActionButton wrappers for standard actions
- [ ] Map old props to PageHeader props
- [ ] Update icon imports (remove Download, Upload, RefreshCw)
- [ ] Test all action handlers work
- [ ] Verify loading states display correctly
- [ ] Check responsive layout on mobile
- [ ] Run TypeScript check
- [ ] Test in browser

---

## Styling Notes

PageHeader provides:
- ✅ Blue title color (`text-blue-600`)
- ✅ Gray subtitle
- ✅ Border separator (`border-b border-gray-200 pb-6`)
- ✅ Responsive layout (flex-col on mobile, flex-row on desktop)
- ✅ Proper spacing (`gap-4`)
- ✅ Action button styling (consistent with ActionButton)

---

## Known Limitations

1. **Modal-based imports:** Use `onImport={() => setShowImportModal(true)}`
2. **Custom styling:** Use `className` and `style` props if needed
3. **Navigation buttons:** Pass via `actions` prop (not standard)
4. **Form pages:** Not standardized (minimal headers, optional)

---

## Quick Links

- 📖 [Full Documentation](./PAGEHEADER_UPDATES.md)
- 📊 [Summary & Statistics](./PAGEHEADER_FINAL_SUMMARY.md)
- 🎯 [Implementation Details](./PHASE2_COMPLETION.md)
- 💻 [Component Code](./frontend/src/components/common/PageHeader.tsx)

---

**Last Updated:** March 2026  
**Status:** ✅ Production Ready (20/24 pages)
