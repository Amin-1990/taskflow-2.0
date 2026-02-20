import { h } from 'preact';
import type { ComponentChildren, FunctionalComponent, JSX } from 'preact';

interface PersonnelFilterPanelProps extends JSX.HTMLAttributes<HTMLDivElement> {
  title?: string;
  actions?: ComponentChildren;
  children: ComponentChildren;
}

const cx = (...classes: Array<unknown>) => classes.filter(Boolean).map((item) => String(item)).join(' ');

const PersonnelFilterPanel: FunctionalComponent<PersonnelFilterPanelProps> = ({
  title,
  actions,
  children,
  className,
  ...props
}) => {
  return h(
    'section',
    {
      ...props,
      className: cx('rounded-xl border border-gray-200 bg-white p-4 shadow-sm', className),
    },
    (title || actions)
      ? h(
          'div',
          { className: 'mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between' },
          title ? h('h2', { className: 'text-sm font-semibold text-gray-800' }, title) : null,
          actions ? h('div', { className: 'flex items-center gap-2' }, actions) : null
        )
      : null,
    children
  );
};

export default PersonnelFilterPanel;
