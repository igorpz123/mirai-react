import { Outlet } from 'react-router-dom';
import { AppSidebar } from '@/components/layout/app-sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AppSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

