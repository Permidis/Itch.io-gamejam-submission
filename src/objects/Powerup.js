import { Ball } from "./Ball.js";

export class Powerup extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, type) {
    const textureKey = Powerup.getTextureForType(type);
    super(scene, x, y, textureKey);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.type = type; // "fast", "multiball", "explosion", "laser"
    this.fallSpeed = 150; // pixels per second
    this.setDisplaySize(40, 40); // Larger squares
  }

  static getTextureForType(type) {
    switch (type) {
      case "fast":
        return "speedpowerup";
      case "multiball":
        return "ballspowerup";
      case "explosion":
        return "bombpowerup";
      case "laser":
        return "spearpowerup";
      default:
        return "ballspowerup";
    }
  }

  activate(scene) {
    switch (this.type) {
      case "fast":
        this.speedBall(scene);
        scene.sound.play("fast", { volume: 0.6 });
        break;
      case "multiball":
        this.spawnMultiball(scene);
        break;
      case "explosion":
        scene.explosionNextHit = true;
        scene.sound.play("fast", { volume: 0.6 });
        break;
      case "laser":
        scene.createLaser(scene.paddle.x);
        scene.sound.play("spear", { volume: 0.6 });
        break;
    }
  }

  speedBall(scene) {
    // Speed up all balls
    scene.balls.forEach(ball => {
      // Check if ball is active and has a valid body
      if (!ball.active || !ball.body) return;
      
      const speed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
      const angle = Math.atan2(ball.body.velocity.y, ball.body.velocity.x);
      const newSpeed = speed * 1.3;
      ball.body.setVelocity(Math.cos(angle) * newSpeed, Math.sin(angle) * newSpeed);
    });
  }

  spawnMultiball(scene) {
    // Spawn 2 additional balls at ball's current position with multiball texture
    if (!scene.ball.active) return; // Don't spawn if main ball is dead
    
    for (let i = 0; i < 2; i++) {
      const newBall = new Ball(scene, scene.ball.x, scene.ball.y, "multiball");
      const angle = Phaser.Math.DegToRad(Phaser.Math.Between(220, 320));
      newBall.launch(260);
      scene.balls.push(newBall); // Add to balls array
      scene.balls.forEach(ball => {
        if (ball !== newBall && ball.active && ball.body) {
          scene.physics.add.collider(newBall, ball);
        }
      });
      scene.physics.add.collider(newBall, scene.paddle, scene.onBallHitPaddle, null, scene);
      scene.physics.add.collider(newBall, scene.bricks, scene.onBallHitBrick, null, scene);
    }
  }
}
