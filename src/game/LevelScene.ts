import Phaser from 'phaser'
import { artwork } from '../assets/art'
import { COMBAT, MOTION, VIEW } from './config'
import { Patrol, Player } from './entities'
import type { Level, Terrain } from './level'
import { buildScenery, paintSpikes } from './scenery'
import type { Session } from './session'

type Shot = Phaser.Physics.Arcade.Image

export interface Observation {
  x: number; y: number; grounded: boolean; vy: number; time: number
  enemies: number; shots: number; slimes: number; bats: number
  patrols: { kind: 'slime' | 'bat'; x: number; y: number }[]
}

declare global {
  interface Window { forestObserve?: () => Observation }
}

export class LevelScene extends Phaser.Scene {
  private player!: Player
  private enemies!: Phaser.Physics.Arcade.Group
  private shots!: Phaser.Physics.Arcade.Group
  private particles!: Phaser.GameObjects.Particles.ParticleEmitter
  private coins: Phaser.Physics.Arcade.Image[] = []
  private backdrop!: Phaser.GameObjects.TileSprite
  private flag!: Phaser.GameObjects.Image
  private keys!: Phaser.Types.Input.Keyboard.CursorKeys
  private attempt = 0
  private jumpPressed = false
  private shootPressed = false
  private disconnect?: () => void

  constructor(private session: Session, private level: Level) { super('level') }

  preload() {
    if (this.textures.exists('forest')) return
    for (const [key, svg] of Object.entries(artwork)) {
      this.load.svg(key, `data:image/svg+xml;base64,${btoa(svg)}`)
    }
  }

  create() {
    this.attempt = this.session.read().attempt
    this.coins = []
    this.backdrop = buildScenery(this, this.level)
    const solids = this.physics.add.staticGroup()
    const spikes = this.physics.add.staticGroup()
    const collectibles = this.physics.add.staticGroup()
    const finish = this.physics.add.staticGroup()
    const shape = (group: Phaser.Physics.Arcade.StaticGroup, tile: Terrain) =>
      (group.create(tile.x + tile.width / 2, tile.y + tile.height / 2, '__WHITE') as Phaser.Physics.Arcade.Image)
        .setDisplaySize(tile.width, tile.height).setVisible(false).refreshBody()

    for (const tile of [...this.level.ground, ...this.level.platforms]) shape(solids, tile)
    for (const tile of this.level.spikes) {
      paintSpikes(this, tile)
      shape(spikes, { x: tile.x + 4, y: tile.y + 6, width: tile.width - 8, height: tile.height - 6 })
    }
    this.level.coins.forEach(({ x, y }, index) => {
      const coin = (collectibles.create(x, y, 'coin') as Phaser.Physics.Arcade.Image)
        .setDepth(2).setData('id', index)
      this.coins.push(coin)
    })

    this.enemies = this.physics.add.group({ allowGravity: false, immovable: true })
    this.level.enemies.forEach(enemy => this.enemies.add(new Patrol(this, enemy)))
    this.shots = this.physics.add.group({ allowGravity: false, maxSize: COMBAT.projectileLimit })
    this.particles = this.add.particles(0, 0, 'spark', {
      emitting: false, speed: { min: 42, max: 145 }, lifespan: 410,
      scale: { start: 0.95, end: 0 }, alpha: { start: 1, end: 0 }, gravityY: 105, maxParticles: 96,
    }).setDepth(8)

    const end = this.level.finish
    shape(finish, end)
    this.flag = this.add.image(end.x + 20, end.y + end.height, 'flag').setOrigin(0.12, 1).setDepth(1)
    this.player = new Player(this, this.level.spawn)
    this.physics.add.collider(this.player, solids)
    for (const hazards of [spikes, this.enemies]) {
      this.physics.add.overlap(this.player, hazards, (_, hazard) => this.damage(hazard as Phaser.Physics.Arcade.Image))
    }
    this.physics.add.overlap(this.player, collectibles, (_, target) => {
      const coin = target as Phaser.Physics.Arcade.Image
      if (this.session.collect(coin.getData('id') as number)) {
        this.burst(coin.x, coin.y, 0xffd66b, 11)
        coin.disableBody(true, true)
      }
    })
    this.physics.add.overlap(this.shots, solids, target => this.impact(target as Shot))
    this.physics.add.overlap(this.shots, this.enemies, (target, victim) => {
      const shot = target as Shot
      const enemy = victim as Patrol
      if (!shot.active || !enemy.active) return
      this.impact(shot)
      this.burst(enemy.x, enemy.y, enemy.kind === 'slime' ? 0xb8e976 : 0xd0a4f0, 14)
      enemy.destroy()
    })
    this.physics.add.overlap(this.player, finish, () => this.session.finish())
    this.cameras.main.setBounds(0, 0, this.level.width, VIEW.height)
      .startFollow(this.player, true, 0.085, 1, -145, 0).setDeadzone(180, VIEW.height)
    this.keys = this.input.keyboard!.createCursorKeys()
    this.jumpPressed = this.shootPressed = false
    const jump = () => { this.jumpPressed = true }
    const shoot = () => { this.shootPressed = true }
    this.keys.up.on('down', jump)
    this.keys.space.on('down', shoot)
    this.input.keyboard!.addCapture(['LEFT', 'RIGHT', 'UP', 'SPACE', 'ESC'])
    const unsubscribe = this.session.subscribe(() => this.syncPhase())
    const observe = () => this.observe()
    if (import.meta.env.MODE === 'e2e') window.forestObserve = observe
    this.disconnect = () => {
      unsubscribe()
      this.keys.up.off('down', jump)
      this.keys.space.off('down', shoot)
      if (import.meta.env.MODE === 'e2e' && window.forestObserve === observe) delete window.forestObserve
    }
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.detach, this)
    this.events.once(Phaser.Scenes.Events.DESTROY, this.detach, this)
    this.syncPhase()
  }

  detach() {
    if (!this.disconnect) return
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.detach, this)
    this.events.off(Phaser.Scenes.Events.DESTROY, this.detach, this)
    this.disconnect()
    this.disconnect = undefined
  }

  private syncPhase() {
    const { phase, attempt } = this.session.read()
    if (phase === 'MENU') {
      this.physics.world.pause()
      return
    }
    if (this.attempt !== attempt) {
      this.scene.resume()
      this.scene.restart()
    } else if (phase === 'PAUSED' || phase === 'VICTORY' || phase === 'GAME_OVER') {
      this.scene.pause()
    } else if (this.session.active) {
      this.scene.resume()
    }
  }

  update(_time: number, delta: number) {
    if (!this.session.active) return
    this.session.tick(delta)
    const now = this.session.time
    const { left, right, space } = this.keys
    const jump = this.jumpPressed
    this.jumpPressed = false
    const direction = Number(right.isDown) - Number(left.isDown)
    this.player.move({ direction, jump }, now, this.level.width, this.session.immune)
    if (this.shootPressed || space.isDown) this.fire()
    this.shootPressed = false
    if (this.player.y > this.level.height + 35) {
      this.session.lose()
      return
    }

    this.backdrop.tilePositionX = this.cameras.main.scrollX * this.level.background.mountains
    this.flag.setAngle(Math.sin(now / 225) * 3)
    for (const coin of this.coins) {
      if (coin.active) coin.setScale(0.63 + Math.abs(Math.cos(now / 265 + coin.x / 220)) * 0.36, 1)
    }
    for (const enemy of this.enemies.getChildren() as Patrol[]) enemy.move(now)
    for (const shot of this.shots.getChildren() as Shot[]) {
      if (shot.active && (shot.x < 0 || shot.x > this.level.width || Math.abs(shot.x - this.player.x) > VIEW.width)) {
        shot.disableBody(true, true)
      }
    }
  }

  private damage(hazard: Phaser.Physics.Arcade.Image) {
    if (!this.session.damage()) return
    if (this.session.active) {
      this.player.hurt(hazard.x, this.session.time)
      this.burst(this.player.x, this.player.y, 0xf88d79, 7)
    } else {
      this.physics.world.pause()
      this.player.die()
      this.time.delayedCall(COMBAT.deathPose + 40, () => this.session.lose())
    }
  }

  private fire() {
    if (this.shots.countActive(true) >= COMBAT.projectileLimit || !this.session.shoot()) return
    const x = this.player.x + this.player.facing * 36
    const y = this.player.y + 1
    const shot = this.shots.get(x, y, 'shot') as Shot | null
    if (!shot) return
    shot.enableBody(true, x, y, true, true)
    shot.setDepth(4).setFlipX(this.player.facing < 0).setVelocityX(this.player.facing * COMBAT.projectileSpeed)
    this.player.shoot(this.session.time)
    this.burst(x, y, 0xffe58c, 5)
  }

  private impact(shot: Shot) {
    if (!shot.active) return
    this.burst(shot.x, shot.y, 0xffe8a4, 7)
    shot.disableBody(true, true)
  }

  private burst(x: number, y: number, tint: number, count: number) {
    this.particles.setParticleTint(tint)
    this.particles.explode(count, x, y)
  }

  private observe(): Observation {
    const patrols = (this.enemies.getChildren() as Patrol[]).map(({ kind, x, y }) => ({ kind, x, y }))
    return {
      x: this.player.x, y: this.player.y, vy: this.player.body.velocity.y, grounded: this.player.body.blocked.down,
      time: this.session.time, enemies: patrols.length, shots: this.shots.countActive(true),
      slimes: patrols.filter(patrol => patrol.kind === 'slime').length,
      bats: patrols.filter(patrol => patrol.kind === 'bat').length,
      patrols,
    }
  }
}

export function mountGame(parent: HTMLElement, session: Session, level: Level) {
  const scene = new LevelScene(session, level)
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent, width: VIEW.width, height: VIEW.height, backgroundColor: '#75b8c4',
    audio: { noAudio: true }, scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    physics: { default: 'arcade', arcade: { gravity: { x: 0, y: MOTION.gravity } } },
    scene,
  })
  return () => {
    scene.detach()
    game.destroy(true)
  }
}
