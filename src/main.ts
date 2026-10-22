import kaplay from "kaplay";
import { config } from "./config";
import { registerGameScene } from "./scenes/game";

const k = kaplay({
  width: config.canvasSize,
  height: config.canvasSize,
  background: [0, 0, 0],
  letterbox: true,
  global: false,
});

registerGameScene(k);
k.go("game");
