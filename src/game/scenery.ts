import type Phaser from 'phaser'
import { VIEW } from './config'
import type { Level, Terrain } from './level'

export const trailMarkers = ['Тропа папоротников', 'Мшистая ложбина', 'Крылатые скалы', 'Солнечная опушка']

export function paintTerrain(scene: Phaser.Scene, tile: Terrain) {
  const { x, y, width, height } = tile
  const art = scene.add.graphics({ x, y })
  art.fillStyle(0x483a35).fillRoundedRect(0, 0, width, height, 8)
  art.fillStyle(0x86573c).fillRoundedRect(3, 5, width - 6, height - 8, 7)
  art.fillStyle(0x634633).fillRect(3, height * 0.63, width - 6, height * 0.34)
  art.fillStyle(0x37733e).fillRoundedRect(0, 0, width, 14, 6)
  art.fillStyle(0x85bb53).fillRoundedRect(2, 0, width - 4, 6, 3)
  for (let offset = 19; offset < width - 17; offset += 27) {
    art.fillStyle(0x569346).fillEllipse(offset, 10, 19, 9 + offset % 5)
    if (height > 40) {
      art.fillStyle(offset % 2 ? 0xa8734c : 0x694a37).fillEllipse(offset, 34 + (offset * 3) % 60, 9 + offset % 13, 6)
    }
  }
}

export function buildScenery(scene: Phaser.Scene, level: Level) {
  const backdrop = scene.add.tileSprite(0, 0, VIEW.width, VIEW.height, 'forest')
    .setOrigin(0).setScrollFactor(0).setDepth(-30)
  for (let x = 65, index = 0; x < level.width + VIEW.width; x += 162 + (index++ * 41) % 105) {
    const scale = 0.54 + (index * 13 % 34) / 100
    scene.add.image(x, 651, 'pine').setOrigin(0.5, 1).setScale(scale)
      .setScrollFactor(level.background.trees, 1).setDepth(-20).setAlpha(0.88)
  }
  for (const patch of level.ground) {
    for (let x = patch.x + 75; x < patch.x + patch.width - 70; x += 135) {
      scene.add.image(x, patch.y + 4, x % 2 ? 'shrub' : 'rock')
        .setOrigin(0.5, 1).setScale(0.58 + x % 12 / 25).setDepth(-4)
      scene.add.image(x + 56, patch.y + 2, 'grass').setOrigin(0.5, 1).setScale(0.55).setDepth(-3)
    }
    paintTerrain(scene, patch)
  }
  level.platforms.forEach(platform => paintTerrain(scene, platform))
  const marks = [0, 5, 10, 15]
  marks.forEach((index, section) => {
    const ground = level.ground[index]
    if (!ground) return
    const x = ground.x + (index ? 180 : 275)
    scene.add.rectangle(x, ground.y - 25, 7, 52, 0x674435).setDepth(-2)
    scene.add.text(x, ground.y - 59, `0${section + 1}  /  ${trailMarkers[section]}`, {
      fontFamily: 'system-ui, sans-serif', fontSize: '13px', fontStyle: 'bold',
      color: '#fff1bb', backgroundColor: '#463e30', padding: { x: 11, y: 7 },
    }).setOrigin(0.5).setDepth(-1)
  })
  return backdrop
}

export function paintSpikes(scene: Phaser.Scene, tile: Terrain) {
  const art = scene.add.graphics({ x: tile.x, y: tile.y })
  const count = 3
  const step = tile.width / count
  for (let i = 0; i < count; i++) {
    const x = i * step
    art.fillStyle(0x352f42).fillTriangle(x, tile.height, x + step / 2, 0, x + step, tile.height)
    art.fillStyle(0xe38a6f).fillTriangle(x + 4, tile.height - 1, x + step / 2, 5, x + step - 3, tile.height - 1)
    art.fillStyle(0xffcb8c).fillTriangle(x + 4, tile.height - 2, x + step / 2, 5, x + step / 2, tile.height - 2)
  }
}
