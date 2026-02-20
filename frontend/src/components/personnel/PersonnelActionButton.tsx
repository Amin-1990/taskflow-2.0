import { h } from 'preact';
import type { ComponentChildren, ComponentType, FunctionalComponent, JSX } from 'preact';

interface PersonnelActionButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ComponentChildren;
  icon?: ComponentType<{ className?: any }>;
  loading?: boolean;
  variant?: 'neutral' | 'accent';
}

const baseClass =
  'inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60';

const variantClass: Record<NonNullable<PersonnelActionButtonProps['variant']>, string> = {
  neutral: 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  accent: 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100',
};

const cx = (...classes: Array<unknown>) => classes.filter(Boolean).map((item) => String(item)).join(' ');

const PersonnelActionButton: FunctionalComponent<PersonnelActionButtonProps> = ({
  children,
  icon: Icon,
  loading = false,
  variant = 'neutral',
  className,
  disabled,
  ...props
}) => {
  return h(
    'button',
    {
      ...props,
      disabled: disabled || loading,
      className: cx(baseClass, variantClass[variant], className),
    },
    Icon ? h(Icon, { className: 'h-4 w-4' }) : null,
    children
  );
};

export default PersonnelActionButton;
