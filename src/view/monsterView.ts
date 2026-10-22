// Menghubungkan satu Monster (logic) ke model 3D-nya: menaruhnya di halaman luar jendela yang tepat,
// menentukan kapan ia melangkah, mengetuk, bergetar, muncul, dan menghilang. Tidak mengubah logic.
import * as THREE from "three";
import { config } from "../config";
import type { Monster } from "../logic/monster";
import { glassPosition, windowYaw } from "./layout";
import { MonsterModel, type Pose } from "./monsterModel";

const cfg = config.view3d.monster;
const glassStep = config.monster.glassStep;

// Jarak dari kaca untuk tiap langkah: rapat di dekat kaca, renggang di kejauhan supaya pendekatan terasa menekan.
function distanceForStep(step: number): number {
  const t = (step - 1) / (glassStep - 1);
  return cfg.nearDistance + (cfg.farDistance - cfg.nearDistance) * Math.pow(1 - t, 1.6);
}

// Ketukan dua tuk (selaras dengan bunyi di audio.ts): 0..1 menurut lama sejak ketukan dimulai.
function knockCurve(secondsSinceKnock: number): number {
  const tap = (start: number) => Math.sin(Math.PI * THREE.MathUtils.clamp((secondsSinceKnock - start) / 0.12, 0, 1));
  return Math.max(tap(0), tap(0.18));
}

export class MonsterView {
  private readonly model = new MonsterModel();
  private window = 0; // jendela tempat model terakhir ditaruh (dipertahankan saat memudar keluar)
  private wasActive = false;
  private fade = 0;
  private distance = cfg.farDistance;
  private xOffset = 0;
  private walkPhase = 0;
  private walkAmount = 0;
  private lean = 0;
  private armsUp = 0;
  private shudder = 0;
  private knockAge = 99;
  private lastKnockIndex = -1;
  private disabled = false;

  constructor(scene: THREE.Scene) {
    scene.add(this.model.root);
    this.model.setFade(0);
  }

  // Dipakai saat jumpscare: model jumpscare menggantikan monster ini.
  disable() {
    this.disabled = true;
    this.model.setFade(0);
  }

  dispose(scene: THREE.Scene) {
    scene.remove(this.model.root);
    this.model.dispose();
  }

  update(dt: number, timeSec: number, monster: Monster, stared: boolean) {
    if (this.disabled) return;
    const active = monster.window !== null;
    if (active && (!this.wasActive || monster.window !== this.window)) {
      // Baru muncul (atau pindah jendela): taruh langsung di langkahnya dan muncul dari kabut.
      this.fade = 0;
      this.window = monster.window!;
      this.xOffset = monster.xOffset;
      this.distance = distanceForStep(monster.step());
      this.walkAmount = 0;
      this.lastKnockIndex = -1;
    }
    this.wasActive = active;

    const fadeTarget = active ? 1 : 0;
    const fadeSpeed = active ? 1 / cfg.fadeInSec : 1 / cfg.fadeOutSec;
    this.fade = THREE.MathUtils.clamp(this.fade + Math.sign(fadeTarget - this.fade) * fadeSpeed * dt, 0, 1);
    this.model.setFade(this.fade);
    if (this.fade <= 0) return;

    if (active) this.followLogic(dt, monster, stared);
    else this.settle(dt);

    this.place(); // sebelum pose: pose menambahkan getaran pada posisi ini
    this.model.pose({
      walkPhase: this.walkPhase,
      walkAmount: this.walkAmount,
      lean: this.lean,
      armsUp: this.armsUp,
      knock: knockCurve(this.knockAge),
      shudder: this.shudder,
      timeSec,
    } satisfies Pose);
  }

  // Mengikuti logic: melompat maju tiap langkah, mundur pelan saat ditatap, tangan terangkat di kaca.
  private followLogic(dt: number, monster: Monster, stared: boolean) {
    const target = distanceForStep(monster.step());
    const approaching = target < this.distance;
    const tau = approaching ? cfg.lurchSec : cfg.retreatSec;
    const before = this.distance;
    this.distance += (target - this.distance) * (1 - Math.exp(-dt / tau));
    const speed = Math.abs(this.distance - before) / Math.max(dt, 1e-4);

    const moving = Math.abs(target - this.distance) > 0.03;
    this.walkAmount += ((moving ? 1 : 0) - this.walkAmount) * Math.min(1, dt * 12);
    this.walkPhase += dt * (3 + Math.min(9, speed * 2.5));
    // Condong ke depan saat melompat maju, ke belakang saat mundur.
    const leanTarget = moving ? (approaching ? 0.3 : -0.12) : 0;
    this.lean += (leanTarget - this.lean) * Math.min(1, dt * 10);

    this.armsUp += (THREE.MathUtils.clamp(monster.position - (glassStep - 1), 0, 1) - this.armsUp) * Math.min(1, dt * 8);
    this.shudder += ((stared ? 1 : 0) - this.shudder) * Math.min(1, dt * 12);

    // Mengetuk selaras dengan bunyi: satu ketukan tiap knockEverySec selama menempel di kaca.
    this.knockAge += dt;
    if (monster.position >= glassStep) {
      const nth = Math.floor(monster.graceElapsed / config.audio.knockEverySec);
      if (nth !== this.lastKnockIndex) {
        this.lastKnockIndex = nth;
        this.knockAge = 0;
      }
    } else {
      this.lastKnockIndex = -1;
    }
  }

  // Saat memudar keluar: diam di tempat.
  private settle(dt: number) {
    this.walkAmount += (0 - this.walkAmount) * Math.min(1, dt * 12);
    this.shudder += (0 - this.shudder) * Math.min(1, dt * 12);
  }

  private place() {
    const yaw = windowYaw[this.window];
    const outward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)); // dari kaca keluar rumah
    const side = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
    const nearness = THREE.MathUtils.clamp((cfg.farDistance - this.distance) / (cfg.farDistance - cfg.nearDistance), 0, 1);
    const lateral = this.xOffset * THREE.MathUtils.lerp(cfg.farLateral, cfg.nearLateral, nearness);

    const root = this.model.root;
    root.position.copy(glassPosition(this.window)).setY(0).addScaledVector(outward, this.distance + 0.12).addScaledVector(side, lateral);
    root.rotation.y = yaw; // menghadap rumah
  }
}
