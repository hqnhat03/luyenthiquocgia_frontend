"use client"

import * as React from "react"
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

interface GrowthData {
  label: string
  count: number
}

interface GrowthChartProps {
  data: GrowthData[]
}

const chartConfig = {
  count: {
    label: "Học sinh mới",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[300px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />

        <ChartTooltip
          cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1 }}
          content={
            <ChartTooltipContent
              formatter={(value) => [`${value}` + " Học sinh"]}
              labelFormatter={(label) => `Tháng: ${label}`}
            />
          }
        />

        <Line
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ChartContainer>
  )
}
