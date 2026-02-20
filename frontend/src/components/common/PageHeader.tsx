import { h } from 'preact';
import type { ComponentChildren, FunctionalComponent, JSX } from 'preact';

interface PageHeaderProps extends JSX.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  eyebrow?: ComponentChildren;
  actions?: ComponentChildren;
}

const cx = (...classes: Array<unknown>) => classes.filter(Boolean).map((item) => String(item)).join(' ');

const PageHeader: FunctionalComponent<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
  ...props
}) => {
  return h(
    'header',
    {
      ...props,
      className: cx('flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between', className),
    },
    h(
      'div',
      null,
      eyebrow ? h('div', { className: 'mb-1 text-sm text-gray-500' }, eyebrow) : null,
      h('h1', { className: 'text-2xl font-semibold tracking-tight text-gray-900' }, title),
      subtitle ? h('p', { className: 'mt-1 text-sm text-gray-500' }, subtitle) : null
    ),
    actions ? h('div', { className: 'flex flex-wrap items-center gap-2' }, actions) : null
  );
};

export default PageHeader;
