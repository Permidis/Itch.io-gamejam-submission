import { Ball } from "./Ball.js";

export class Powerup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    super(scene, x, y, "powerup");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type; // "fast", "multiball", "explosion", "laser"
    this.fallSpeed = 150; // pixels per second
    this.setTint(this.getColorForType(type));
  }

  getColorForType(type) {
    switch (type) {
      case "fast":
        return 0xff00ff; // Magenta
      case "multiball":
        return 0xffff00; // Yellow
      case "explosion":
        return 0xff6600; // Orange
      case "laser":
        return 0xff0000; // Red
      default:
        return 0xffffff; // White
    }
  }

  activate(scene) {
    switch (this.type) {
      case "fast":
        this.speedBall(scene);
        break;
      case "multiball":
        this.spawnMultiball(scene);
        break;
      case "explosion":
        scene.explosionNextHit = true;
        break;
      case "laser":
        scene.createLaser(scene.paddle.x);
        break;
    }
  }

  speedBall(scene) {
    const speed = Math.sqrt(scene.ball.body.velocity.x ** 2 + scene.ball.body.velocity.y ** 2);
    const angle = Math.atan2(scene.ball.body.velocity.y, scene.ball.body.velocity.x);
    const newSpeed = speed * 1.3;
    scene.ball.body.setVelocity(Math.cos(angle) * newSpeed, Math.sin(angle) * newSpeed);
  }

  spawnMultiball(scene) {
    // Spawn 2 additional balls at ball's current position with purple color
    for (let i = 0; i < 2; i++) {
      const newBall = new Ball(scene, scene.ball.x, scene.ball.y, 0xff00ff);
      const angle = Phaser.Math.DegToRad(Phaser.Math.Between(220, 320));
      newBall.launch(260);
      scene.balls.push(newBall); // Add to balls array
      scene.physics.add.collider(newBall, scene.paddle, scene.onBallHitPaddle, null, scene);
      scene.physics.add.collider(newBall, scene.bricks, scene.onBallHitBrick, null, scene);
    }
  }
}
