import { Outlet } from 'react-router-dom';
import { AppSidebar } from './app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
} from "../ui/sidebar"

const Layout = () => {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="min-h-screen">
          <div className="flex">
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default Layout;

