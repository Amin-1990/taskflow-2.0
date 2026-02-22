import type { FunctionComponent } from 'preact';
import { Bell, User, Settings, Search } from 'lucide-preact';
import { useState } from 'preact/hooks';

export const Header: FunctionComponent = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const notifications = [
    { id: 1, message: 'Maintenance prévue demain', time: '5 min' },
    { id: 2, message: 'Nouveau rapport qualité disponible', time: '1 heure' },
    { id: 3, message: 'Production en retard sur ligne 3', time: '2 heures' },
  ];

  return (
    <header
      className="shadow-sm h-16 fixed top-0 right-0 left-64 z-10"
      style={{ backgroundColor: 'var(--layout-header-bg)', color: 'var(--layout-header-text)' }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Barre de recherche */}
        <div className="flex-1 max-w-2xl">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5"
              style={{ color: 'var(--layout-header-text-muted)' }}
            />
            <input
              type="text"
              placeholder="Rechercher..."
              className="layout-header-search w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-1"
              style={{
                backgroundColor: 'var(--layout-header-hover-bg)',
                color: 'var(--layout-header-text)',
                borderColor: 'var(--layout-header-border)',
              }}
            />
          </div>
        </div>

        {/* Actions droite */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="layout-header-hover p-2 rounded-full relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Menu notifications */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                <div className="px-4 py-2 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-700">Notifications</h3>
                </div>
                {notifications.map((notif) => (
                  <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 cursor-pointer">
                    <p className="text-sm text-gray-800">{notif.message}</p>
                    <p className="text-xs text-gray-500 mt-1">Il y a {notif.time}</p>
                  </div>
                ))}
                <div className="px-4 py-2 border-t border-gray-100">
                  <button className="text-sm text-blue-600 hover:text-blue-700">
                    Voir toutes les notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Paramètres */}
          <button className="layout-header-hover p-2 rounded-full">
            <Settings className="w-5 h-5" />
          </button>

          {/* Profil utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="layout-header-hover flex items-center space-x-3 p-2 rounded-lg"
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs" style={{ color: 'var(--layout-header-text-muted)' }}>Administrateur</p>
              </div>
            </button>

            {/* Menu utilisateur */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Mon profil
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  Paramètres
                </button>
                <hr className="my-2 border-gray-100" />
                <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
