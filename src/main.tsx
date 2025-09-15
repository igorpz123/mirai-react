import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from "@/components/layout/theme-provider"
import { UnitProvider } from '@/contexts/UnitContext'
import './index.css'
import App from './App.tsx'
import { UsersProvider } from '@/contexts/UsersContext'
import { Toaster } from '@/components/ui/sonner'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <UnitProvider>
        <UsersProvider>
          <App />
          <Toaster />
        </UsersProvider>
      </UnitProvider>
    </ThemeProvider>
  </StrictMode>,
)
