import type { MovementType } from '@prisma/client'
import { Badge } from './Card'

const LABELS: Record<MovementType, { label: string; tone: 'green' | 'amber' | 'blue' }> = {
  IN: { label: 'Received', tone: 'green' },
  OUT: { label: 'Shipped', tone: 'amber' },
  ADJUSTMENT: { label: 'Count', tone: 'blue' },
}

export function MovementBadge({ type }: { type: MovementType }) {
  const { label, tone } = LABELS[type]
  return <Badge tone={tone}>{label}</Badge>
}
