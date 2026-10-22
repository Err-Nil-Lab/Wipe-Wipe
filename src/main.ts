import kaplay from "kaplay";
import { config } from "./config";
import { registerEndScene } from "./scenes/end";
import { registerGameScene } from "./scenes/game";
import { registerJumpscareScene } from "./scenes/jumpscare";
import { registerMenuScene } from "./scenes/menu";
import { registerMonologueScene } from "./scenes/monologue";

const k = kaplay({
  width: config.canvasSize,
  height: config.canvasSize,
  background: [0, 0, 0],
  letterbox: true,
  global: false,
});



registerMenuScene(k);
registerMonologueScene(k);
registerGameScene(k);
registerJumpscareScene(k);
registerEndScene(k);
k.go("menu");
