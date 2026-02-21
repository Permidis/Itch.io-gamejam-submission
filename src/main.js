import { GameScene } from "./scenes/GameScene.js";

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 900,
  parent: "game",
  backgroundColor: "#0f1626",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [GameScene]
};

new Phaser.Game(config);
