"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
 ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { ChartConfig } from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "Tarefas concluídas por dia"

const sampleData = [
  { date: "2024-04-01", concluidas: 222, mobile: 150 },
  { date: "2024-04-02", concluidas: 97, mobile: 180 },
  { date: "2024-04-03", concluidas: 167, mobile: 120 },
  { date: "2024-04-04", concluidas: 242, mobile: 260 },
  { date: "2024-04-05", concluidas: 373, mobile: 290 },
  { date: "2024-04-06", concluidas: 301, mobile: 340 },
  { date: "2024-04-07", concluidas: 245, mobile: 180 },
  { date: "2024-04-08", concluidas: 409, mobile: 320 },
  { date: "2024-04-09", concluidas: 59, mobile: 110 },
  { date: "2024-04-10", concluidas: 261, mobile: 190 },
  { date: "2024-04-11", concluidas: 327, mobile: 350 },
  { date: "2024-04-12", concluidas: 292, mobile: 210 },
  { date: "2024-04-13", concluidas: 342, mobile: 380 },
  { date: "2024-04-14", concluidas: 137, mobile: 220 },
  { date: "2024-04-15", concluidas: 120, mobile: 170 },
  { date: "2024-04-16", concluidas: 138, mobile: 190 },
  { date: "2024-04-17", concluidas: 446, mobile: 360 },
  { date: "2024-04-18", concluidas: 364, mobile: 410 },
  { date: "2024-04-19", concluidas: 243, mobile: 180 },
  { date: "2024-04-20", concluidas: 89, mobile: 150 },
  { date: "2024-04-21", concluidas: 137, mobile: 200 },
  { date: "2024-04-22", concluidas: 224, mobile: 170 },
  { date: "2024-04-23", concluidas: 138, mobile: 230 },
  { date: "2024-04-24", concluidas: 387, mobile: 290 },
  { date: "2024-04-25", concluidas: 215, mobile: 250 },
  { date: "2024-04-26", concluidas: 75, mobile: 130 },
  { date: "2024-04-27", concluidas: 383, mobile: 420 },
  { date: "2024-04-28", concluidas: 122, mobile: 180 },
  { date: "2024-04-29", concluidas: 315, mobile: 240 },
  { date: "2024-04-30", concluidas: 454, mobile: 380 },
  { date: "2024-05-01", concluidas: 165, mobile: 220 },
  { date: "2024-05-02", concluidas: 293, mobile: 310 },
  { date: "2024-05-03", concluidas: 247, mobile: 190 },
  { date: "2024-05-04", concluidas: 385, mobile: 420 },
  { date: "2024-05-05", concluidas: 481, mobile: 390 },
  { date: "2024-05-06", concluidas: 498, mobile: 520 },
  { date: "2024-05-07", concluidas: 388, mobile: 300 },
  { date: "2024-05-08", concluidas: 149, mobile: 210 },
  { date: "2024-05-09", concluidas: 227, mobile: 180 },
  { date: "2024-05-10", concluidas: 293, mobile: 330 },
  { date: "2024-05-11", concluidas: 335, mobile: 270 },
  { date: "2024-05-12", concluidas: 197, mobile: 240 },
  { date: "2024-05-13", concluidas: 197, mobile: 160 },
  { date: "2024-05-14", concluidas: 448, mobile: 490 },
  { date: "2024-05-15", concluidas: 473, mobile: 380 },
  { date: "2024-05-16", concluidas: 338, mobile: 400 },
  { date: "2024-05-17", concluidas: 499, mobile: 420 },
  { date: "2024-05-18", concluidas: 315, mobile: 350 },
  { date: "2024-05-19", concluidas: 235, mobile: 180 },
  { date: "2024-05-20", concluidas: 177, mobile: 230 },
  { date: "2024-05-21", concluidas: 82, mobile: 140 },
  { date: "2024-05-22", concluidas: 81, mobile: 120 },
  { date: "2024-05-23", concluidas: 252, mobile: 290 },
  { date: "2024-05-24", concluidas: 294, mobile: 220 },
  { date: "2024-05-25", concluidas: 201, mobile: 250 },
  { date: "2024-05-26", concluidas: 213, mobile: 170 },
  { date: "2024-05-27", concluidas: 420, mobile: 460 },
  { date: "2024-05-28", concluidas: 233, mobile: 190 },
  { date: "2024-05-29", concluidas: 78, mobile: 130 },
  { date: "2024-05-30", concluidas: 340, mobile: 280 },
  { date: "2024-05-31", concluidas: 178, mobile: 230 },
  { date: "2024-06-01", concluidas: 178, mobile: 200 },
  { date: "2024-06-02", concluidas: 470, mobile: 410 },
  { date: "2024-06-03", concluidas: 103, mobile: 160 },
  { date: "2024-06-04", concluidas: 439, mobile: 380 },
  { date: "2024-06-05", concluidas: 88, mobile: 140 },
  { date: "2024-06-06", concluidas: 294, mobile: 250 },
  { date: "2024-06-07", concluidas: 323, mobile: 370 },
  { date: "2024-06-08", concluidas: 385, mobile: 320 },
  { date: "2024-06-09", concluidas: 438, mobile: 480 },
  { date: "2024-06-10", concluidas: 155, mobile: 200 },
  { date: "2024-06-11", concluidas: 92, mobile: 150 },
  { date: "2024-06-12", concluidas: 492, mobile: 420 },
  { date: "2024-06-13", concluidas: 81, mobile: 130 },
  { date: "2024-06-14", concluidas: 426, mobile: 380 },
  { date: "2024-06-15", concluidas: 307, mobile: 350 },
  { date: "2024-06-16", concluidas: 371, mobile: 310 },
  { date: "2024-06-17", concluidas: 475, mobile: 520 },
  { date: "2024-06-18", concluidas: 107, mobile: 170 },
  { date: "2024-06-19", concluidas: 341, mobile: 290 },
  { date: "2024-06-20", concluidas: 408, mobile: 450 },
  { date: "2024-06-21", concluidas: 169, mobile: 210 },
  { date: "2024-06-22", concluidas: 317, mobile: 270 },
  { date: "2024-06-23", concluidas: 480, mobile: 530 },
  { date: "2024-06-24", concluidas: 132, mobile: 180 },
  { date: "2024-06-25", concluidas: 141, mobile: 190 },
  { date: "2024-06-26", concluidas: 434, mobile: 380 },
  { date: "2024-06-27", concluidas: 448, mobile: 490 },
  { date: "2024-06-28", concluidas: 149, mobile: 200 },
  { date: "2024-06-29", concluidas: 103, mobile: 160 },
  { date: "2024-06-30", concluidas: 446, mobile: 400 },
]

type CompletedByDay = { date: string | null; concluidas: number }

export function ChartAreaInteractive({ data }: { data?: CompletedByDay[] }) {
  const chartData = data && data.length ? data : sampleData

const chartConfig = {
  tarefas: {
    label: "Tarefas Concluídas",
  },
  concluidas: {
    label: "Concluídas",
    color: "var(--primary)",
  }
} satisfies ChartConfig

  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    if (!item.date) return false
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })
  return (
    <Card className="@container/card">
        <CardHeader>
          <CardTitle>Tarefas Concluídas</CardTitle>
          <CardDescription>
            <span className="hidden @[540px]/card:block">
              Tarefas concluídas por dia
            </span>
            <span className="@[540px]/card:hidden">Last 3 months</span>
          </CardDescription>
          <CardAction>
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
            >
              <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
              <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
              <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
            </ToggleGroup>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger
                className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
                size="sm"
                aria-label="Select a value"
              >
                <SelectValue placeholder="Last 3 months" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="90d" className="rounded-lg">
                  Last 3 months
                </SelectItem>
                <SelectItem value="30d" className="rounded-lg">
                  Last 30 days
                </SelectItem>
                <SelectItem value="7d" className="rounded-lg">
                  Last 7 days
                </SelectItem>
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={filteredData}>
              <defs>
                <linearGradient id="fillConcluidas" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-concluidas)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-concluidas)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("pt-BR", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("pt-BR", {
                        month: "short",
                        day: "numeric",
                      })
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="concluidas"
                type="natural"
                fill="url(#fillConcluidas)"
                stroke="var(--color-concluidas)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
  )
}
