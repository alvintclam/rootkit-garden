import { MAX_ENEMIES, MAX_PARTICLES, MAX_PROJECTILES, W, H } from './constants'
import type { World } from './world'
import { EnemyKind } from './enemies'

export function fillEnemyFree(world: World): void {
  for (let i = 0; i < MAX_ENEMIES; i++) world.enemyFree[i] = i
  world.enemyFreeTop = MAX_ENEMIES
  world.enemyLive = 0
}

export function fillProjFree(world: World): void {
  for (let i = 0; i < MAX_PROJECTILES; i++) world.projFree[i] = i
  world.projFreeTop = MAX_PROJECTILES
  world.projLive = 0
}

export function fillPartFree(world: World): void {
  for (let i = 0; i < MAX_PARTICLES; i++) world.partFree[i] = i
  world.partFreeTop = MAX_PARTICLES
  world.partLive = 0
}

export function resetAllPools(world: World): void {
  world.enemyAlive.fill(0)
  world.projAlive.fill(0)
  world.partAlive.fill(0)
  world.enemyCount = MAX_ENEMIES
  world.projCount = MAX_PROJECTILES
  world.partCount = MAX_PARTICLES
  fillEnemyFree(world)
  fillProjFree(world)
  fillPartFree(world)
}

export function acquireEnemy(world: World): number {
  if (world.enemyFreeTop <= 0) return -1
  world.enemyFreeTop--
  const slot = world.enemyFree[world.enemyFreeTop]
  world.enemyLive++
  return slot
}

export function releaseEnemy(world: World, slot: number): void {
  if (!world.enemyAlive[slot]) return
  world.enemyAlive[slot] = 0
  world.enemyFree[world.enemyFreeTop] = slot
  world.enemyFreeTop++
  world.enemyLive--
}

export function acquireProj(world: World): number {
  if (world.projFreeTop <= 0) return -1
  world.projFreeTop--
  const slot = world.projFree[world.projFreeTop]
  world.projLive++
  return slot
}

export function releaseProj(world: World, slot: number): void {
  if (!world.projAlive[slot]) return
  world.projAlive[slot] = 0
  world.projFree[world.projFreeTop] = slot
  world.projFreeTop++
  world.projLive--
}

export function acquirePart(world: World): number {
  if (world.partFreeTop <= 0) return -1
  world.partFreeTop--
  const slot = world.partFree[world.partFreeTop]
  world.partLive++
  return slot
}

export function releasePart(world: World, slot: number): void {
  if (!world.partAlive[slot]) return
  world.partAlive[slot] = 0
  world.partFree[world.partFreeTop] = slot
  world.partFreeTop++
  world.partLive--
}

export function stressFillEnemies(world: World, n: number): void {
  const target = Math.min(n, MAX_ENEMIES)
  while (world.enemyLive < target) {
    const slot = acquireEnemy(world)
    if (slot < 0) break
    const ang = (world.enemyLive / target) * Math.PI * 2
    world.enemyAlive[slot] = 1
    world.enemyX[slot] = W * 0.5 + Math.cos(ang) * (180 + (slot % 7) * 28)
    world.enemyY[slot] = H * 0.5 + Math.sin(ang) * (120 + (slot % 5) * 22)
    world.enemyHp[slot] = 40
    world.enemyKind[slot] = slot % 3 === 0 ? EnemyKind.Drone : EnemyKind.Scanner
  }
}
