import { COMBAT } from './config'

export type Phase = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY'
export interface Snapshot { phase: Phase; hearts: number; coins: number; elapsed: number; attempt: number }
const transitions: Record<Phase, readonly Phase[]> = {
  MENU: ['PLAYING'],
  PLAYING: ['PAUSED', 'GAME_OVER', 'VICTORY', 'MENU'],
  PAUSED: ['PLAYING', 'MENU'],
  GAME_OVER: ['PLAYING', 'MENU'],
  VICTORY: ['PLAYING', 'MENU'],
}

export class Session {
  private listeners = new Set<() => void>()
  private snapshot: Snapshot = { phase: 'MENU', hearts: COMBAT.hearts, coins: 0, elapsed: 0, attempt: 0 }
  private collected = new Set<number>()
  private immuneUntil = 0
  private nextShot = 0
  private defeated = false
  time = 0

  read = () => this.snapshot
  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  private publish(changes: Partial<Snapshot>) {
    this.snapshot = { ...this.snapshot, ...changes }
    this.listeners.forEach(listener => listener())
  }

  start() {
    if (this.snapshot.phase === 'PLAYING') return
    this.time = this.immuneUntil = this.nextShot = 0
    this.defeated = false
    this.collected.clear()
    this.publish({ phase: 'PLAYING', hearts: COMBAT.hearts, coins: 0, elapsed: 0, attempt: this.snapshot.attempt + 1 })
  }

  private transition(phase: Phase) {
    if (transitions[this.snapshot.phase].includes(phase)) this.publish({ phase, elapsed: this.time })
  }

  togglePause = () => {
    if (!this.defeated && this.snapshot.phase === 'PLAYING') this.transition('PAUSED')
    else if (this.snapshot.phase === 'PAUSED') this.transition('PLAYING')
  }

  menu() { this.transition('MENU') }

  tick(delta: number) {
    if (this.active) this.time += delta
  }

  get active() { return this.snapshot.phase === 'PLAYING' && !this.defeated }
  get immune() { return this.time < this.immuneUntil }

  damage() {
    if (!this.active || this.immune) return false
    const hearts = this.snapshot.hearts - 1
    this.immuneUntil = this.time + COMBAT.immunity
    this.defeated = hearts === 0
    this.publish({ hearts })
    return true
  }

  lose() {
    this.defeated = true
    this.transition('GAME_OVER')
  }

  collect(id: number) {
    if (!this.active || this.collected.has(id)) return false
    this.collected.add(id)
    this.publish({ coins: this.collected.size })
    return true
  }

  shoot() {
    if (!this.active || this.time < this.nextShot) return false
    this.nextShot = this.time + COMBAT.cooldown
    return true
  }

  finish() {
    if (this.active) this.transition('VICTORY')
  }
}
