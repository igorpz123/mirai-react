import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "@/components/layout/theme-provider"
import { UnitProvider } from '@/contexts/UnitContext'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/contexts/AuthContext'
import { RealtimeProvider } from '@/contexts/RealtimeContext'
import { UsersProvider } from '@/contexts/UsersContext'
import { TourProvider } from '@/contexts/TourContext'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <UnitProvider>
          <UsersProvider>
            <RealtimeProvider>
              <TourProvider>
                <App />
                <Toaster />
              </TourProvider>
            </RealtimeProvider>
          </UsersProvider>
        </UnitProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
