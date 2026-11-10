import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { Observation } from '../../src/game/LevelScene'
import { level1 } from '../../src/game/level'

const observe = (page: Page): Promise<Observation> => page.evaluate(() => window.forestObserve!())
const pollOptions = { intervals: [25, 25, 40], timeout: 8_000 }

async function start(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /Forest\s*Adventure/ })).toBeVisible()
  await page.getByRole('button', { name: 'Играть', exact: true }).click()
  await expect(page.getByText('Монеты: 0 / 20')).toBeVisible()
  await expect.poll(() => page.evaluate(() => !!window.forestObserve)).toBe(true)
  await expect.poll(async () => (await observe(page)).grounded).toBe(true)
}

test('меню, HUD, прыжок, пауза, масштабирование и перезапуск', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await start(page)
  await expect(page.getByRole('img', { name: 'Здоровье: 3 из 3' })).toBeVisible()
  await page.keyboard.down('ArrowLeft')
  await expect.poll(async () => (await observe(page)).x).toBeLessThan(150)
  await page.keyboard.up('ArrowLeft')
  await page.keyboard.press('ArrowUp')
  await expect.poll(async () => (await observe(page)).y).toBeLessThan(510)
  await expect.poll(async () => (await observe(page)).vy, pollOptions).toBeGreaterThan(90)
  await page.keyboard.press('ArrowUp')
  await expect.poll(async () => (await observe(page)).vy).toBeGreaterThan(90)
  await expect.poll(async () => (await observe(page)).grounded).toBe(true)
  await page.keyboard.down('ArrowRight')
  await expect(page.getByText('Монеты: 1 / 20')).toBeVisible()
  await page.keyboard.up('ArrowRight')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Пауза' })).toBeVisible()
  const frozen = await observe(page)
  await page.waitForTimeout(240)
  expect(await observe(page)).toEqual(frozen)
  await page.getByRole('button', { name: 'Продолжить' }).click()
  await expect.poll(async () => (await observe(page)).time).toBeGreaterThan(frozen.time)
  await page.setViewportSize({ width: 1000, height: 600 })
  await expect.poll(async () => {
    const size = (await page.locator('canvas').boundingBox())!
    return Math.abs(size.width / size.height - 16 / 9)
  }).toBeLessThan(0.005)
  await page.getByRole('button', { name: 'Пауза', exact: true }).click()
  await page.getByRole('button', { name: 'Начать заново' }).click()
  await expect(page.getByText('Монеты: 0 / 20')).toBeVisible()
  await expect.poll(async () => (await observe(page)).x).toBeCloseTo(level1.spawn.x)
  await expect(page.locator('canvas')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: 'Главное меню' }).click()
  await expect(page.locator('canvas')).toHaveCount(0)
  await page.getByRole('button', { name: 'Играть', exact: true }).click()
  await expect(page.locator('canvas')).toHaveCount(1)
  expect(errors).toEqual([])
})

test('патруль, попадание одним выстрелом, падение и повтор', async ({ page }) => {
  await start(page)
  const initial = await observe(page)
  await expect.poll(async () => (await observe(page)).patrols.find(patrol => patrol.kind === 'bat')!.y)
    .not.toBe(initial.patrols.find(patrol => patrol.kind === 'bat')!.y)
  await expect.poll(async () => (await observe(page)).patrols[0].x).not.toBe(initial.patrols[0].x)
  await page.keyboard.down('ArrowRight')
  await expect.poll(async () => (await observe(page)).x, pollOptions).toBeGreaterThan(865)
  await page.keyboard.press('Space')
  await expect.poll(async () => (await observe(page)).slimes, pollOptions).toBe(initial.slimes - 1)
  await expect(page.getByRole('heading', { name: 'Игра окончена' })).toBeVisible({ timeout: 8_000 })
  await page.keyboard.up('ArrowRight')
  await page.getByRole('button', { name: 'Повторить' }).click()
  await expect(page.getByText('Монеты: 0 / 20')).toBeVisible()
  await expect.poll(async () => (await observe(page)).slimes).toBe(initial.slimes)
})

test('реальный маршрут до флага через все пропасти и шипы', async ({ page }) => {
  test.setTimeout(155_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await start(page)
  const jumps = [
    ...level1.gaps.map(gap => ({ trigger: gap.from - 47, landedAfter: gap.to })),
    ...level1.spikes.map(spike => ({ trigger: spike.x - 59, landedAfter: spike.x + spike.width })),
  ].sort((a, b) => a.trigger - b.trigger)
  await page.keyboard.down('ArrowRight')
  await page.keyboard.down('Space')
  for (const [index, { trigger, landedAfter }] of jumps.entries()) {
    await expect.poll(async () => (await observe(page)).x, pollOptions).toBeGreaterThanOrEqual(trigger)
    await page.keyboard.press('ArrowUp')
    await expect.poll(async () => {
      const player = await observe(page)
      return player.grounded && player.x > landedAfter
    }, { ...pollOptions, message: `Прыжок ${index + 1}, приземление после x=${landedAfter}` }).toBe(true)
  }
  await expect(page.getByRole('heading', { name: 'Победа!' })).toBeVisible({ timeout: 8_000 })
  await page.keyboard.up('ArrowRight')
  await page.keyboard.up('Space')
  const { time } = await observe(page)
  expect(time / 1000).toBeGreaterThanOrEqual(90)
  expect(time / 1000).toBeLessThanOrEqual(150)
  console.log(`Время маршрута: ${(time / 1000).toFixed(1)} с`)
  await expect(page.getByText('Время', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Играть снова' }).click()
  await expect(page.getByText('Монеты: 0 / 20')).toBeVisible()
  expect(errors).toEqual([])
})

test('шипы снимают одно сердце и запускают отбрасывание', async ({ page }) => {
  test.setTimeout(40_000)
  await start(page)
  await page.keyboard.down('ArrowRight')
  await page.keyboard.down('Space')
  for (const { from, to } of level1.gaps.slice(0, 3)) {
    await expect.poll(async () => (await observe(page)).x, pollOptions).toBeGreaterThanOrEqual(from - 47)
    await page.keyboard.press('ArrowUp')
    await expect.poll(async () => {
      const player = await observe(page)
      return player.grounded && player.x > to
    }, pollOptions).toBe(true)
  }
  const damaged = page.getByRole('img', { name: 'Здоровье: 2 из 3' })
  await expect.poll(async () => (await observe(page)).vy < -20 && await damaged.isVisible(), pollOptions).toBe(true)
  await page.keyboard.up('ArrowRight')
  await page.keyboard.up('Space')
  await page.waitForTimeout(350)
  await expect(damaged).toBeVisible()
})
