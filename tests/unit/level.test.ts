import { expect, it } from 'vitest'
import { MOTION } from '../../src/game/config'
import { level1 } from '../../src/game/level'

it('размещает ровно 20 уникальных монет над достижимой поверхностью', () => {
  const { coins, ground, platforms } = level1
  const rise = MOTION.jump ** 2 / (2 * MOTION.gravity)
  expect(coins).toHaveLength(20)
  expect(new Set(coins.map(coin => `${coin.x}:${coin.y}`)).size).toBe(20)
  for (const coin of coins) {
    expect([...ground, ...platforms].some(tile =>
      coin.x >= tile.x && coin.x <= tile.x + tile.width && tile.y >= coin.y && tile.y - coin.y < rise,
    )).toBe(true)
  }
})

it('оставляет запас дальности на всех обязательных прыжках и безопасный финиш', () => {
  const { width, ground, gaps, finish, spikes } = level1
  const reach = 2 * MOTION.jump * MOTION.speed / MOTION.gravity
  expect(gaps).toHaveLength(ground.length - 1)
  for (const [index, { from, to }] of gaps.entries()) {
    expect(from).toBe(ground[index].x + ground[index].width)
    expect(to).toBe(ground[index + 1].x)
    expect(to - from + 70).toBeLessThan(reach)
  }
  expect(finish.x + finish.width).toBeLessThan(width)
  expect(finish.x).toBeGreaterThan(Math.max(...spikes.map(tile => tile.x + tile.width)) + reach)
})

it('задаёт зоны патруля внутри опоры и границ уровня', () => {
  for (const enemy of level1.enemies) {
    expect(level1.ground.some(tile =>
      enemy.x - enemy.range - 35 > tile.x && enemy.x + enemy.range + 35 < tile.x + tile.width,
    )).toBe(true)
  }
})
