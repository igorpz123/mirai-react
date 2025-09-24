import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

const Layout = () => {
    // Hook only works inside provider, so we nest a child component to use it cleanly
        const Content = () => {
            // Apenas usar flex grow padrão para evitar somar a largura do placeholder da sidebar.
            // O componente Sidebar já injeta um gap (sidebar-gap) que ocupa o espaço necessário.
            // Portanto, não definimos width manualmente, evitando overflow horizontal.
            return (
                <SidebarInset className="overflow-x-hidden">
                    <div className="min-h-svh w-full overflow-x-hidden">
                        <Outlet />
                    </div>
                </SidebarInset>
            )
        }

    return (
        <SidebarProvider
            style={
                {
                    '--sidebar-width': 'calc(var(--spacing) * 72)',
                    '--header-height': 'calc(var(--spacing) * 12)',
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <Content />
        </SidebarProvider>
    )
}

export default Layout;

