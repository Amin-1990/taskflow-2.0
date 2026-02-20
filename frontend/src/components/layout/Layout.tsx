import type { FunctionComponent } from 'preact';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children?: preact.ComponentChildren;
}

export const Layout: FunctionComponent<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-16 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};