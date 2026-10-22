import kaplay from "kaplay";
import { config } from "./config";
import { registerGameScene } from "./scenes/game";
import { registerJumpscareScene } from "./scenes/jumpscare";

const k = kaplay({
  width: config.canvasSize,
  height: config.canvasSize,
  background: [0, 0, 0],
  letterbox: true,
  global: false,
});

registerGameScene(k);
registerJumpscareScene(k);
k.go("game");
