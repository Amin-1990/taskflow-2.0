import { h } from 'preact';
import type { ComponentChildren, FunctionalComponent, JSX } from 'preact';
import { Download, Upload, RefreshCw } from 'lucide-preact';
import ActionButton from './ActionButton';

interface PageHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  eyebrow?: ComponentChildren;
  actions?: ComponentChildren;
  showImport?: boolean;
  showExport?: boolean;
  showTemplate?: boolean;
  showRefresh?: boolean;
  onImport?: () => void;
  onExport?: () => void;
  onTemplate?: () => void;
  onRefresh?: () => void;
  isImporting?: boolean;
  isExporting?: boolean;
  isDownloadingTemplate?: boolean;
  isRefreshing?: boolean;
}

const cx = (...classes: Array<unknown>) => classes.filter(Boolean).map((item) => String(item)).join(' ');

const PageHeader: FunctionalComponent<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  showImport = false,
  showExport = false,
  showTemplate = false,
  showRefresh = false,
  onImport,
  onExport,
  onTemplate,
  onRefresh,
  isImporting = false,
  isExporting = false,
  isDownloadingTemplate = false,
  isRefreshing = false,
  className,
  ...props
}) => {
  const standardActions = [];

  if (showTemplate && onTemplate) {
    standardActions.push(
      h(ActionButton, {
        key: 'template',
        onClick: onTemplate,
        loading: isDownloadingTemplate,
        icon: Download,
        children: isDownloadingTemplate ? 'Template...' : 'Template',
      })
    );
  }

  if (showImport && onImport) {
    standardActions.push(
      h(ActionButton, {
        key: 'import',
        onClick: onImport,
        loading: isImporting,
        icon: Upload,
        children: isImporting ? 'Import...' : 'Importer',
      })
    );
  }

  if (showExport && onExport) {
    standardActions.push(
      h(ActionButton, {
        key: 'export',
        onClick: onExport,
        loading: isExporting,
        icon: Download,
        children: isExporting ? 'Export...' : 'Exporter',
      })
    );
  }

  if (showRefresh && onRefresh) {
    standardActions.push(
      h(ActionButton, {
        key: 'refresh',
        onClick: onRefresh,
        loading: isRefreshing,
        icon: RefreshCw,
        children: isRefreshing ? 'Actualisation...' : 'Actualiser',
      })
    );
  }

  return h(
    'header',
    {
      ...props,
      className: cx('flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between border-b border-gray-200 pb-6', className),
    },
    h(
      'div',
      null,
      eyebrow ? h('div', { className: 'mb-1 text-sm text-gray-500' }, eyebrow) : null,
      h('h1', { className: 'text-2xl font-semibold tracking-tight text-blue-600' }, title),
      subtitle ? h('p', { className: 'mt-1 text-sm text-gray-500' }, subtitle) : null
    ),
    h('div', { className: 'flex flex-wrap items-center gap-2' }, [
      ...standardActions,
      ...(actions ? [actions] : []),
    ])
  );
};

export default PageHeader;
