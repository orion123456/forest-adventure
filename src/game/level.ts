export interface Point { x: number; y: number }
export interface Terrain extends Point { width: number; height: number }
export interface Enemy extends Point { kind: 'slime' | 'bat'; range: number; speed: number }
export interface Level {
  id: string
  width: number
  height: number
  spawn: Point
  ground: Terrain[]
  gaps: { from: number; to: number }[]
  platforms: Terrain[]
  spikes: Terrain[]
  coins: Point[]
  enemies: Enemy[]
  finish: Terrain
  background: { mountains: number; trees: number }
}

const floor = 610
const lengths = [1630, 990, 1100, 970, 1180, 1010, 1230, 1040, 1090, 1080, 1060, 1030, 1120, 1010, 1220, 1030, 1035, 1180, 1030, 1430]
const gapWidths = [110, 128, 144, 125, 146, 155, 120, 150, 135, 166, 135, 170, 140, 160, 152, 170, 145, 166, 156]
const ground: Terrain[] = []
const gaps: Level['gaps'] = []
let cursor = 0
for (const [index, width] of lengths.entries()) {
  ground.push({ x: cursor, y: floor, width, height: 180 })
  cursor += width
  if (index < gapWidths.length) {
    gaps.push({ from: cursor, to: cursor + gapWidths[index] })
    cursor += gapWidths[index]
  }
}

const platforms = ground.flatMap(({ x }, index) => {
  const low = { x: x + (index === 0 ? 620 : 335), y: floor - 90, width: 190, height: 27 }
  if (index % 3 === 0) return [low, { x: low.x + 210, y: low.y - 84, width: 165, height: 27 }]
  return [low]
})

export const level1: Level = {
  id: 'fernwood', width: cursor, height: 800, spawn: { x: 180, y: 552 }, ground, gaps, platforms,
  spikes: [3, 5, 7, 9, 11, 13, 15, 16, 18].map(index => ({
    x: ground[index].x + 695, y: floor - 22, width: 66, height: 22,
  })),
  coins: ground.map(({ x }, index) => {
    const ledge = platforms.find(platform => platform.x > x && platform.x < x + 700)!
    return index % 4 === 0 ? { x: x + 430, y: floor - 34 } : { x: ledge.x + 85, y: ledge.y - 34 }
  }),
  enemies: [
    ...[0, 2, 4, 6, 9, 12, 16, 18].map((index): Enemy => ({
      kind: 'slime', x: ground[index].x + (index === 0 ? 1230 : 570), y: floor - 21, range: 77, speed: 52,
    })),
    ...[8, 10, 14, 17].map((index): Enemy => ({
      kind: 'bat', x: ground[index].x + 680, y: floor - 120, range: 112, speed: 86,
    })),
  ],
  finish: { x: cursor - 245, y: floor - 165, width: 95, height: 165 },
  background: { mountains: 0.14, trees: 0.38 },
}
