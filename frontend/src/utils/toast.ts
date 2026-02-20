/**
 * Utilitaire de notifications toast
 * Basé sur react-hot-toast pour des notifications légères et jolies
 * Compatible avec Preact via preact/compat
 */

import toast from 'react-hot-toast';

// Types de toasts avec leurs configurations
export const toastTypes = {
  success: {
    icon: '✅',
    style: {
      background: '#10b981',
      color: 'white',
    },
  },
  error: {
    icon: '❌',
    style: {
      background: '#ef4444',
      color: 'white',
    },
  },
  loading: {
    icon: '⏳',
    style: {
      background: '#6b7280',
      color: 'white',
    },
  },
  custom: {
    icon: '🔔',
    style: {
      background: '#3b82f6',
      color: 'white',
    },
  },
};

/**
 * Affiche une notification toast personnalisée
 */
export const showToast = {
  /**
   * Toast de succès
   */
  success: (message: string, options = {}) => {
    return toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: toastTypes.success.style,
      icon: toastTypes.success.icon,
      ...options,
    });
  },

  /**
   * Toast d'erreur
   */
  error: (message: string, options = {}) => {
    return toast.error(message, {
      duration: 4000,
      position: 'top-right',
      style: toastTypes.error.style,
      icon: toastTypes.error.icon,
      ...options,
    });
  },

  /**
   * Toast d'information (personnalisé)
   */
  info: (message: string, options = {}) => {
    return toast(message, {
      duration: 3000,
      position: 'top-right',
      style: toastTypes.custom.style,
      icon: toastTypes.custom.icon,
      ...options,
    });
  },

  /**
   * Toast d'avertissement (personnalisé)
   */
  warning: (message: string, options = {}) => {
    return toast(message, {
      duration: 3500,
      position: 'top-right',
      style: {
        background: '#f59e0b',
        color: 'white',
      },
      icon: '⚠️',
      ...options,
    });
  },

  /**
   * Toast de chargement (persistant)
   */
  loading: (message: string = 'Chargement...') => {
    return toast.loading(message, {
      position: 'top-right',
      style: toastTypes.loading.style,
      icon: toastTypes.loading.icon,
    });
  },

  /**
   * Met à jour un toast existant
   */
  update: (toastId: string, message: string, type: 'success' | 'error' | 'loading' | 'info' = 'info') => {
    const config = {
      success: { style: toastTypes.success.style, icon: toastTypes.success.icon },
      error: { style: toastTypes.error.style, icon: toastTypes.error.icon },
      loading: { style: toastTypes.loading.style, icon: toastTypes.loading.icon },
      info: { style: toastTypes.custom.style, icon: toastTypes.custom.icon },
    };

    toast.dismiss(toastId);
    toast[type === 'info' ? 'success' : type](message, {
      ...config[type],
      id: toastId,
    });
  },

  /**
   * Supprime un toast spécifique
   */
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Supprime tous les toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },

  /**
   * Toast personnalisé complet
   */
  custom: (message: string, options = {}) => {
    return toast(message, {
      duration: 3000,
      position: 'top-right',
      style: toastTypes.custom.style,
      icon: toastTypes.custom.icon,
      ...options,
    });
  },
};

export default showToast;