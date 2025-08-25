import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/layout/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

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
                    <Outlet />
                </SidebarInset>
        </SidebarProvider>
  );
};

export default Layout;

