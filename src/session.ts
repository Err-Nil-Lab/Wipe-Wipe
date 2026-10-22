// Satu malam yang sedang berjalan beserta objek 3D-nya: logika Night, kaca per jendela, tampilan monster,
// wipe lewat kursor, ketukan, dan efek menatap. Sebelum start() semuanya diam (dipakai sebagai latar
// menu dan monolog); jam dan monster baru berjalan setelah start().
import * as THREE from "three";
import { playKnock } from "./audio";
import { config } from "./config";
import { input } from "./input";
import { Night } from "./logic/night";
import { hideRing, showRing } from "./ui/cursorRing";
import { glassPosition, windowYaw } from "./view/layout";
import { MonsterView } from "./view/monsterView";
import { WindowGlass } from "./view/windowGlass";

export class NightSession {
  readonly night: Night;
  readonly glasses: WindowGlass[];
  readonly monsterViews: MonsterView[];
  running = false;
  stareAmount = 0; // 0..1 dihaluskan, untuk efek kamera saat menatap
  private readonly knockIndex: number[]; // ketukan ke-berapa yang sudah dibunyikan per monster
  private readonly raycaster = new THREE.Raycaster();
  private lastCell: { x: number; y: number } | null = null;

  constructor(
    private readonly scene: THREE.Scene,
    readonly nightIndex: number,
  ) {
    this.night = new Night(nightIndex);
    this.monsterViews = this.night.monsters.map(() => new MonsterView(scene));
    this.knockIndex = this.night.monsters.map(() => -1);
    this.glasses = this.night.fogs.map((fog, i) => {
      const glass = new WindowGlass(fog, config.view3d.glassSize);
      glass.mesh.position.copy(glassPosition(i));
      glass.mesh.rotation.y = windowYaw[i];
      scene.add(glass.mesh);
      return glass;
    });
  }

  start() {
    this.running = true;
  }

  update(dt: number, timeSec: number) {
    if (this.running) this.night.update(dt, input.holding && !input.overUi); // klik di minimap = pindah, bukan menatap
    const { night } = this;
    this.monsterViews.forEach((view, i) => view.update(dt, timeSec, night.monsters[i], night.staredMonster === night.monsters[i]));
    this.glasses.forEach((glass) => glass.update());
    if (this.running) this.playKnocks();

    const stareTarget = night.stareStatus === "staring" ? 1 : 0;
    this.stareAmount += (stareTarget - this.stareAmount) * Math.min(1, dt * 8);
  }

  // Ketukan saat monster sampai di kaca (jendela mana pun), lalu berulang selama masih menempel.
  private playKnocks() {
    if (this.night.isLost() || this.night.isWon()) return; // jangan bertumpuk dengan jumpscare
    this.night.monsters.forEach((m, i) => {
      const atGlass = m.isActive() && m.position >= config.monster.glassStep;
      if (!atGlass) {
        this.knockIndex[i] = -1;
        return;
      }
      const nth = Math.floor(m.graceElapsed / config.audio.knockEverySec);
      if (nth !== this.knockIndex[i]) {
        playKnock();
        this.knockIndex[i] = nth;
      }
    });
  }

  // Kursor -> sel di kaca aktif -> usap. Mati saat menatap, pindah jendela, di atas UI, dan setelah malam selesai.
  wipe(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement) {
    const { night } = this;
    const fog = night.activeFog(); // null saat pindah jendela
    const pointer = input.pointer;
    const rect = canvas.getBoundingClientRect();
    const inside = pointer && pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom;
    const holdBlocksWipe = !config.fog.autoStare && input.holding; // stare manual mematikan wipe; stare otomatis tidak
    const allowed = this.running && fog && inside && !input.overUi && !holdBlocksWipe && !night.isLost() && !night.isWon();

    let hit: ReturnType<WindowGlass["pick"]> = null;
    if (allowed) {
      const ndc = new THREE.Vector2(((pointer!.x - rect.left) / rect.width) * 2 - 1, -(((pointer!.y - rect.top) / rect.height) * 2 - 1));
      this.raycaster.setFromCamera(ndc, camera);
      hit = this.glasses[night.current].pick(this.raycaster);
    }

    if (!fog || !hit) {
      this.lastCell = null; // supaya tidak ada garis usapan melompat saat wipe aktif lagi
      hideRing();
      return;
    }

    const from = this.lastCell ?? hit;
    fog.rub(from.x, from.y, hit.x, hit.y, config.fog.brushRadius * fog.size, config.fog.wipePerPass);
    this.lastCell = hit;

    // Radius cincin: proyeksikan titik di samping kursor sejauh radius kuas (meter) ke layar.
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const edge = hit.point.clone().addScaledVector(right, config.fog.brushRadius * config.view3d.glassSize).project(camera);
    const center = hit.point.clone().project(camera);
    showRing(pointer!.x, pointer!.y, Math.abs(edge.x - center.x) * 0.5 * rect.width);
  }

  // Monster yang menang diganti model jumpscare, jadi sembunyikan yang di jendela.
  hideMonsters() {
    this.monsterViews.forEach((view) => view.disable());
  }

  dispose() {
    hideRing();
    this.glasses.forEach((glass) => {
      this.scene.remove(glass.mesh);
      glass.dispose();
    });
    this.monsterViews.forEach((view) => view.dispose(this.scene));
  }
}
