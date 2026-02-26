import { type FunctionComponent, type ComponentChildren } from 'preact';
import { X } from 'lucide-preact';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ComponentChildren;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
};

export const Modal: FunctionComponent<ModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
  size = 'md',
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-lg ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
