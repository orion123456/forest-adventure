import Phaser from 'phaser'
import type { HeroPose } from '../assets/art'
import { COMBAT, MOTION } from './config'
import type { Enemy, Point } from './level'

export interface Controls { direction: number; jump: boolean }

const runPoses: readonly HeroPose[] = ['runA', 'runB', 'runC', 'runB']

export class Player extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  facing = 1
  private jumpUntil = -Infinity
  private groundedAt = -Infinity
  private shotAt = -Infinity
  private hurtAt = -Infinity
  private jumped = false

  constructor(scene: Phaser.Scene, spawn: Point) {
    super(scene, spawn.x, spawn.y, 'hero-idle')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setSize(34, 55).setOffset(24, 18).setDepth(5)
    this.setMaxVelocity(MOTION.knockback, 900).setDragX(MOTION.drag)
  }

  move(controls: Controls, now: number, width: number, immune: boolean) {
    const grounded = this.body.blocked.down && this.body.velocity.y >= 0
    if (grounded) {
      this.groundedAt = now
      this.jumped = false
    }
    if (controls.jump) this.jumpUntil = now + MOTION.buffer

    const hurt = now - this.hurtAt < MOTION.hurtLock
    if (!hurt) {
      const direction = controls.direction
      if (direction) {
        this.facing = direction
        this.setFlipX(direction < 0)
      }
      this.setAccelerationX(direction * MOTION.acceleration)
      this.body.maxVelocity.x = MOTION.speed
      if (this.jumpUntil >= now && !this.jumped && now - this.groundedAt <= MOTION.coyote) {
        this.setVelocityY(-MOTION.jump)
        this.jumpUntil = -Infinity
        this.groundedAt = -Infinity
        this.jumped = true
      }
    }
    if (this.x < 24 || this.x > width - 24) {
      this.body.reset(Phaser.Math.Clamp(this.x, 24, width - 24), this.y)
    }
    this.setAlpha(immune && Math.floor(now / 78) % 2 ? 0.48 : 1)
    const pose = hurt ? 'hurt'
      : now - this.shotAt < COMBAT.shootPose ? 'shoot'
      : this.body.velocity.y < -20 ? 'jump'
      : !grounded ? 'fall'
      : Math.abs(this.body.velocity.x) > 25 ? runPoses[Math.floor(now / 78) % runPoses.length]
      : 'idle'
    this.setTexture(`hero-${pose}`)
    this.setAngle(pose === 'idle' ? Math.sin(now / 290) * 1.7 : 0)
  }

  shoot(now: number) { this.shotAt = now }

  hurt(from: number, now: number) {
    this.hurtAt = now
    this.body.maxVelocity.x = MOTION.knockback
    this.setAccelerationX(0).setVelocity(this.x < from ? -MOTION.knockback : MOTION.knockback, -MOTION.knockUp)
  }

  die() {
    this.setTexture('hero-death').setAlpha(1)
    this.scene.tweens.add({
      targets: this, y: this.y - 34, angle: -70 * this.facing, alpha: 0,
      duration: COMBAT.deathPose, ease: 'Quad.Out',
    })
  }
}

export class Patrol extends Phaser.Physics.Arcade.Sprite {
  declare body: Phaser.Physics.Arcade.Body
  private direction = 1
  readonly kind: Enemy['kind']

  constructor(scene: Phaser.Scene, private spec: Enemy) {
    super(scene, spec.x, spec.y, `${spec.kind}-0`)
    this.kind = spec.kind
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.body.setAllowGravity(false)
    this.setImmovable(true).setDepth(3)
    if (this.kind === 'slime') this.setSize(55, 37).setOffset(8, 8)
    else this.setSize(51, 30).setOffset(19, 14)
  }

  move(now: number) {
    const { x, y, range, speed } = this.spec
    if (this.x >= x + range) this.direction = -1
    if (this.x <= x - range) this.direction = 1
    this.setVelocityX(speed * this.direction).setFlipX(this.direction < 0)
    if (this.kind === 'bat') this.setVelocityY((y + Math.sin(now / 420) * 25 - this.y) * 6)
    this.setTexture(`${this.kind}-${Math.floor(now / (this.kind === 'bat' ? 93 : 172)) % 2}`)
  }
}
