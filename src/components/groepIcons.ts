import { BrickWall, Droplets, Hammer, Heater, LayoutGrid, Package, Sparkles, Bath, type LucideIcon } from 'lucide-react'
import type { Groep } from '../lib/calc'

export const GROEP_ICONS: Record<Groep, LucideIcon> = {
  sloop: Hammer,
  voorbereiding: BrickWall,
  waterdicht: Droplets,
  vloerverwarming: Heater,
  tegels: LayoutGrid,
  'lijm-voeg': Package,
  afwerking: Sparkles,
  sanitair: Bath,
}
