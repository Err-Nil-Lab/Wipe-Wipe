// Model monster dari primitif: humanoid kurus setinggi ±2,2 m dengan lengan dan jari yang panjang.
// Model hanya tahu cara mengatur sendi dari satu objek Pose; keputusan kapan bergerak ada di monsterView.ts.
// Model menghadap +z lokal.
import * as THREE from "three";

export type Pose = {
  walkPhase: number; // fase siklus jalan (radian)
  walkAmount: number; // 0 diam, 1 berjalan penuh
  lean: number; // condong ke depan (+) atau ke belakang (-), radian
  armsUp: number; // 0 tangan menggantung, 1 tangan terangkat menempel di kaca
  knock: number; // 0..1 kekuatan ketukan saat ini (tangan kanan)
  shudder: number; // 0..1 getaran saat ditatap
  timeSec: number; // waktu untuk goyang dan getar
};

type Limb = { shoulder: THREE.Group; elbow: THREE.Group };
type Leg = { hip: THREE.Group; knee: THREE.Group };

// Sendi yang menggantung ke bawah dengan satu ruas silinder. Mengembalikan sendi dan titik ujungnya.
function segment(length: number, topRadius: number, bottomRadius: number, material: THREE.Material): { joint: THREE.Group; end: THREE.Group } {
  const joint = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(topRadius, bottomRadius, length, 5), material);
  mesh.position.y = -length / 2;
  const end = new THREE.Group();
  end.position.y = -length;
  joint.add(mesh, end);
  return { joint, end };
}

export class MonsterModel {
  readonly root = new THREE.Group();
  private readonly body = new THREE.MeshLambertMaterial({ color: 0x050505, flatShading: true });
  private readonly eyeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }); // mata tetap terlihat dari jauh
  private readonly hips = new THREE.Group();
  private readonly spine = new THREE.Group();
  private readonly head = new THREE.Group();
  private readonly arms: Limb[] = [];
  private readonly legs: Leg[] = [];

  constructor() {
    const hipHeight = 1.0;
    this.hips.position.y = hipHeight;
    this.root.add(this.hips);
    this.hips.add(this.spine);

    // Badan: batang sempit dari pinggul ke bahu.
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.65, 6), this.body);
    torso.position.y = 0.325;
    this.spine.add(torso);

    // Kepala lonjong di atas leher, dengan dua mata putih.
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.14, 5), this.body);
    neck.position.y = 0.72;
    this.spine.add(neck);
    this.head.position.y = 0.78;
    const skull = new THREE.Mesh(new THREE.SphereGeometry(0.13, 7, 6), this.body);
    skull.scale.set(0.8, 1.3, 0.85);
    skull.position.y = 0.15;
    this.head.add(skull);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.02, 4, 3), this.eyeMaterial);
      eye.position.set(side * 0.045, 0.19, 0.095);
      this.head.add(eye);
    }
    this.spine.add(this.head);

    // Lengan panjang dengan tiga jari kurus di tiap tangan.
    for (const side of [-1, 1]) {
      const upper = segment(0.62, 0.04, 0.03, this.body);
      upper.joint.position.set(side * 0.17, 0.62, 0);
      const fore = segment(0.66, 0.03, 0.025, this.body);
      upper.end.add(fore.joint);
      const palm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.03), this.body);
      palm.position.y = -0.05;
      fore.end.add(palm);
      for (const f of [-1, 0, 1]) {
        const finger = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.2, 0.014), this.body);
        finger.position.set(f * 0.028, -0.2, 0);
        finger.rotation.z = f * 0.12;
        fore.end.add(finger);
      }
      this.spine.add(upper.joint);
      this.arms.push({ shoulder: upper.joint, elbow: fore.joint });
    }

    // Kaki.
    for (const side of [-1, 1]) {
      const thigh = segment(0.5, 0.06, 0.045, this.body);
      thigh.joint.position.set(side * 0.09, 0, 0);
      const shin = segment(0.5, 0.045, 0.035, this.body);
      thigh.end.add(shin.joint);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.22), this.body);
      foot.position.set(0, -0.02, 0.06);
      shin.end.add(foot);
      this.hips.add(thigh.joint);
      this.legs.push({ hip: thigh.joint, knee: shin.joint });
    }
  }

  // Memudar masuk/keluar. Material dibuat transparan hanya selama belum penuh.
  setFade(fade: number) {
    for (const material of [this.body, this.eyeMaterial]) {
      material.opacity = fade;
      material.transparent = fade < 0.999;
    }
    this.root.visible = fade > 0.001;
  }

  pose(p: Pose) {
    const t = p.timeSec;
    const walk = p.walkAmount;
    const stride = Math.sin(p.walkPhase);

    // Pinggul naik-turun saat melangkah; goyang pelan saat diam.
    this.hips.position.y = 1.0 + Math.abs(stride) * 0.03 * walk;
    const sway = Math.sin(t * 0.7) * 0.03 * (1 - walk);
    this.spine.rotation.set(p.lean + Math.sin(t * 1.1) * 0.01, 0, sway);

    // Kepala menoleh pelan; mendekati kaca, kepala menunduk dan miring menatap ke dalam.
    this.head.rotation.set(0.05 + p.armsUp * 0.25, Math.sin(t * 0.4) * 0.25 * (1 - p.armsUp), Math.sin(t * 0.9) * 0.08 + p.armsUp * 0.2);

    this.legs.forEach((leg, i) => {
      const phase = i === 0 ? stride : -stride;
      leg.hip.rotation.x = phase * 0.55 * walk;
      leg.knee.rotation.x = Math.max(0, Math.sin(p.walkPhase + (i === 0 ? 1.6 : 1.6 + Math.PI))) * 0.9 * walk;
    });

    this.arms.forEach((arm, i) => {
      const side = i === 0 ? -1 : 1;
      const swing = (i === 0 ? -stride : stride) * 0.35 * walk;
      // Tangan terlipat ke atas di samping wajah dengan telapak menempel kaca. Lengan tidak boleh
      // menjulur lurus ke depan: itu menembus kaca ke dalam rumah. Jangkauan maju dijaga ±0,12 m.
      const tap = i === 1 ? p.knock * 0.12 : 0; // ketukan kecil, tidak menembus kaca
      arm.shoulder.rotation.set(-0.12 - 0.08 * p.armsUp + swing + tap, 0, side * (0.08 + 0.5 * p.armsUp));
      // Siku miring ke luar sebesar bukaan bahu, supaya lengan bawah tegak di samping wajah (bukan menutup muka).
      arm.elbow.rotation.set(-0.25 - 2.7 * p.armsUp - (i === 1 ? p.knock * 0.25 : 0), 0, side * 0.5 * p.armsUp);
    });

    // Getar saat ditatap: guncangan acak yang cepat pada seluruh tubuh.
    const jitter = p.shudder;
    this.root.rotation.z = (Math.sin(t * 61) + Math.sin(t * 43)) * 0.03 * jitter;
    this.root.position.y = Math.sin(t * 73) * 0.015 * jitter;
  }
}
