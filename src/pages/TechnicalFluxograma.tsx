// src/pages/Dashboard.tsx
import type { ReactElement } from 'react'
import { TechnicalTaskTable } from "@/components/technical-task-table"
import { SiteHeader } from "@/components/layout/site-header"

export default function TechnicalFluxograma(): ReactElement {

  return (
    <div className="w-full">
      <SiteHeader title='Fluxograma | Setor Técnico' />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* <TechnicalTaskTable data={data} /> */}
            </div>
          </div>
        </div>
    </div>
  )
}