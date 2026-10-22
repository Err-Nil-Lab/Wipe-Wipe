// Alur layar: menu -> monolog -> game -> (menang -> monolog malam berikutnya | kalah -> jumpscare -> ulang) -> akhir.
// Memegang sesi malam yang sedang berjalan; aturan game ada di logic/, tampilan di view/ dan ui/.
import type * as THREE from "three";
import { playJumpscare, startHum, stopHum } from "./audio";
import { config } from "./config";
import { loadHighestNight, saveHighestNight } from "./logic/progress";
import { monologues } from "./monologues";
import { NightSession } from "./session";
import { createMinimap } from "./ui/minimap";
import { screens } from "./ui/screens";
import type { createCameraRig } from "./view/cameraRig";
import { JumpscareView } from "./view/jumpscareView";
import type { createRenderer } from "./view/renderer";

type State = "menu" | "monologue" | "playing" | "jumpscare" | "lost" | "won" | "end";

export function createFlow(scene: THREE.Scene, camera: THREE.PerspectiveCamera, gfx: ReturnType<typeof createRenderer>, rig: ReturnType<typeof createCameraRig>) {
  let state: State = "menu";
  let session: NightSession | null = null;
  let jumpscare: JumpscareView | null = null;
  const lastNight = config.nights.length - 1;
  const minimap = createMinimap((i) => {
    if (state === "playing") session?.night.startTravel(i);
  });

  // Sesi baru menggantikan yang lama. Sebelum start() sesi diam dan hanya jadi latar.
  function newSession(nightIndex: number): NightSession {
    session?.dispose();
    jumpscare?.dispose();
    jumpscare = null;
    session = new NightSession(scene, nightIndex);
    return session;
  }

  function leavePlaying() {
    stopHum();
    minimap.setVisible(false);
    screens.setClock(null);
  }

  function showMenu() {
    leavePlaying();
    newSession(0);
    state = "menu";
    screens.menu(
      loadHighestNight(),
      () => startMonologue(0),
      () => startMonologue(loadHighestNight()),
    );
  }

  function startMonologue(nightIndex: number) {
    leavePlaying();
    newSession(nightIndex);
    state = "monologue";
    screens.monologue(nightIndex, monologues[nightIndex], beginNight);
  }

  // Jam dan monster mulai berjalan setelah monolog selesai.
  function beginNight() {
    screens.clear();
    session!.start();
    state = "playing";
    minimap.setVisible(true);
    startHum();
  }

  function startNightDirect(nightIndex: number) {
    leavePlaying();
    newSession(nightIndex);
    beginNight();
  }

  function onWon() {
    const n = session!.nightIndex;
    leavePlaying();
    state = "won";
    // Simpan saat menang (bukan saat klik) supaya refresh di layar menang tidak menghilangkan progres.
    saveHighestNight(Math.min(n + 1, lastNight));
    screens.won(n === lastNight, () => (n === lastNight ? showEnd() : startMonologue(n + 1)));
  }

  function onLost() {
    const s = session!;
    const monster = s.night.lostBy!;
    leavePlaying();
    state = "jumpscare";
    playJumpscare();
    s.hideMonsters();
    jumpscare = new JumpscareView(scene, camera, s.glasses[monster.window!], monster.window!, monster.xOffset, () => screens.flash(0.25));
  }

  function retry() {
    const n = session!.nightIndex;
    if (config.replayMonologueOnRetry) startMonologue(n);
    else startNightDirect(n);
  }

  function showEnd() {
    state = "end";
    screens.end(showMenu);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "r" && state === "lost") retry();
  });

  function update(dt: number, timeSec: number) {
    if (!session) return;

    if (state === "jumpscare") {
      jumpscare!.update(dt, timeSec);
      if (jumpscare!.done) {
        state = "lost";
        screens.lost(session.nightIndex, retry);
      }
      return;
    }

    session.update(dt, timeSec);
    rig.update(session.night, timeSec);
    camera.updateMatrixWorld();
    session.wipe(camera, gfx.canvas);

    // Menatap: sudut pandang menyempit sedikit dan vignette mengetat.
    camera.fov = config.view3d.fov - 6 * session.stareAmount;
    camera.updateProjectionMatrix();
    gfx.setStare(session.stareAmount);
    minimap.highlight(session.night.travel ? session.night.travel.to : session.night.current);

    if (state === "playing") {
      screens.setClock(`MALAM ${session.nightIndex + 1}   ${session.night.clockText()}`);
      if (session.night.isLost()) onLost();
      else if (session.night.isWon()) onWon();
    }
  }

  return {
    update,
    showMenu,
    startMonologue,
    startNightDirect,
    get session() {
      return session;
    },
    get state() {
      return state;
    },
  };
}
