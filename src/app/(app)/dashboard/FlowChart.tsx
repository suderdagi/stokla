'use client'

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })

export function FlowChart({ data }: { data: { date: string; in: number; out: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ left: -16 }}>
        <CartesianGrid vertical={false} stroke="#e7e5e4" />
        <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} minTickGap={16} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#78716c' }} tickLine={false} axisLine={false} />
        <Tooltip labelFormatter={(label: string) => shortDate(label)} contentStyle={{ borderRadius: 8, fontSize: 12 }} cursor={{ fill: '#f5f5f4' }} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="in" name="Received" fill="#10b981" radius={[4, 4, 0, 0]} />
        <Bar dataKey="out" name="Shipped" fill="#f59e0b" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
