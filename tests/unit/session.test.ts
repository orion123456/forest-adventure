import { describe, expect, it } from 'vitest'
import { COMBAT } from '../../src/game/config'
import { Session } from '../../src/game/session'

function attempt() {
  const session = new Session()
  session.start()
  return session
}

describe('игровая попытка', () => {
  it('начинается с трёх сердец и временно блокирует повторный урон', () => {
    const session = attempt()
    expect(session.read().hearts).toBe(3)
    expect(session.damage()).toBe(true)
    expect(session.read().hearts).toBe(2)
    session.tick(COMBAT.immunity - 1)
    expect(session.damage()).toBe(false)
    session.tick(1)
    expect(session.damage()).toBe(true)
    expect(session.read().hearts).toBe(1)
  })

  it('блокирует игру при нуле сердец до завершения анимации смерти', () => {
    const session = attempt()
    for (let i = 0; i < COMBAT.hearts; i++) {
      session.damage()
      session.tick(COMBAT.immunity)
    }
    expect(session.read().hearts).toBe(0)
    expect(session.active).toBe(false)
    session.finish()
    expect(session.read().phase).toBe('PLAYING')
    session.lose()
    expect(session.read().phase).toBe('GAME_OVER')
  })

  it('немедленно завершает падение даже с полным здоровьем', () => {
    const session = attempt()
    session.lose()
    expect(session.read()).toMatchObject({ phase: 'GAME_OVER', hearts: 3 })
  })

  it('засчитывает монету только один раз и восстанавливает попытку при повторе', () => {
    const session = attempt()
    session.collect(7)
    expect(session.collect(7)).toBe(false)
    expect(session.read().coins).toBe(1)
    session.damage()
    session.tick(400)
    session.lose()
    session.start()
    expect(session.read()).toMatchObject({ phase: 'PLAYING', coins: 0, hearts: 3, attempt: 2 })
    expect(session.time).toBe(0)
    expect(session.collect(7)).toBe(true)
  })

  it('разрешает выстрел ровно после заданной задержки', () => {
    const session = attempt()
    expect(session.shoot()).toBe(true)
    session.tick(COMBAT.cooldown - 1)
    expect(session.shoot()).toBe(false)
    session.tick(1)
    expect(session.shoot()).toBe(true)
  })

  it('пауза останавливает таймер, стрельбу, урон и сбор монет', () => {
    const session = attempt()
    session.tick(600)
    session.togglePause()
    session.tick(1200)
    expect(session.time).toBe(600)
    expect(session.shoot()).toBe(false)
    expect(session.damage()).toBe(false)
    expect(session.collect(0)).toBe(false)
    session.togglePause()
    session.tick(100)
    expect(session.time).toBe(700)
  })

  it('фиксирует победу и время даже без монет', () => {
    const session = attempt()
    session.tick(95_000)
    session.finish()
    expect(session.read()).toMatchObject({ phase: 'VICTORY', coins: 0, elapsed: 95_000 })
    session.tick(1000)
    expect(session.time).toBe(95_000)
  })
})
