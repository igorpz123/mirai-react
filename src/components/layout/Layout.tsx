import { Outlet } from 'react-router-dom';
import { AppSidebar } from "@/components/layout/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { GlobalSearch } from '@/components/GlobalSearch'
import { GlobalSearchProvider, useGlobalSearch } from '@/contexts/GlobalSearchContext'

const Layout = () => {
    return (
        <GlobalSearchProvider>
            <LayoutContent />
        </GlobalSearchProvider>
    )
}

const LayoutContent = () => {
    const { isOpen, setIsOpen } = useGlobalSearch()
    
    const Content = () => {
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
            <GlobalSearch open={isOpen} onOpenChange={setIsOpen} />
        </SidebarProvider>
    )
}

export default Layout;

