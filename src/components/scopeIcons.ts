import { Bath, BrickWall, Droplets, Grid2x2, Hammer, Heater, LayoutGrid, PaintRoller, ShowerHead, Sparkles, Toilet, type LucideIcon } from 'lucide-react'
import type { ScopeKey } from '../lib/types'

export const SCOPE_ICONS: Record<ScopeKey, LucideIcon> = {
  sloopwerk: Hammer,
  egaliseren: BrickWall,
  waterdicht: Droplets,
  vloerverwarming: Heater,
  wandtegels: LayoutGrid,
  vloertegels: Grid2x2,
  inloopdouche: ShowerHead,
  toilet: Toilet,
  wastafelmeubel: Bath,
  kitwerk: Sparkles,
  stucwerk: PaintRoller,
}
