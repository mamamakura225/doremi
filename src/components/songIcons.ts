import type { ReactElement, SVGProps } from 'react'
import type { SongId } from '../lib/songs'
import { BeeIcon, FrogIcon, SheepIcon, StarIcon } from './Icons'

/** 曲の絵（文字が読めなくても絵で選べる・#106） */
export const SONG_ICON: Record<SongId, (p: Omit<SVGProps<SVGSVGElement>, 'children'>) => ReactElement> = {
  twinkle: StarIcon,
  frog: FrogIcon,
  lamb: SheepIcon,
  bee: BeeIcon,
}
