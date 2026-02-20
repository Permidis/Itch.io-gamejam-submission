import { Paddle } from "../objects/Paddle.js";
import { Ball } from "../objects/Ball.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.paddle = null;
    this.ball = null;
    this.bricks = null;
    this.scoreText = null;
    this.livesText = null;
    this.messageText = null;
    this.cursors = null;

    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isWin = false;
  }

  create() {
    this.createTextures();

    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isWin = false;

    this.paddle = new Paddle(this, 400, 560);
    this.ball = new Ball(this, 400, 540);

    this.bricks = this.physics.add.staticGroup();
    this.createBricks();

    this.physics.add.collider(this.ball, this.paddle, this.onBallHitPaddle, null, this);
    this.physics.add.collider(this.ball, this.bricks, this.onBallHitBrick, null, this);

    this.scoreText = this.add.text(20, 16, "Score: 0", {
      fontSize: "20px",
      color: "#dfe7ff"
    });

    this.livesText = this.add.text(680, 16, "Lives: 3", {
      fontSize: "20px",
      color: "#dfe7ff"
    });

    this.messageText = this.add.text(400, 300, "Click or press SPACE to launch", {
      fontSize: "24px",
      color: "#ffd166",
      align: "center"
    });
    this.messageText.setOrigin(0.5, 0.5);

    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.on("pointermove", (pointer) => {
      if (this.isGameOver || this.isWin) {
        return;
      }
      this.paddle.moveTo(pointer.x, this.scale.width);
    });

    this.input.on("pointerdown", () => {
      if (this.isGameOver || this.isWin) {
        this.scene.restart();
        return;
      }
      this.tryLaunchBall();
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.isGameOver || this.isWin) {
        this.scene.restart();
        return;
      }
      this.tryLaunchBall();
    });
  }

  update() {
    if (this.isGameOver || this.isWin) {
      return;
    }

    if (this.cursors.left.isDown) {
      this.paddle.moveTo(this.paddle.x - 8, this.scale.width);
    } else if (this.cursors.right.isDown) {
      this.paddle.moveTo(this.paddle.x + 8, this.scale.width);
    }

    if (this.ball.getData("stuck")) {
      this.ball.setPosition(this.paddle.x, this.paddle.y - 20);
    } else if (this.ball.y > this.scale.height + 30) {
      this.loseLife();
    }
  }

  createTextures() {
    if (!this.textures.exists("paddle")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0x5de4c7, 1);
      graphics.fillRoundedRect(0, 0, 120, 18, 8);
      graphics.generateTexture("paddle", 120, 18);
      graphics.destroy();
    }

    if (!this.textures.exists("ball")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xf4f1de, 1);
      graphics.fillCircle(8, 8, 8);
      graphics.generateTexture("ball", 16, 16);
      graphics.destroy();
    }

    if (!this.textures.exists("brick")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xff6b6b, 1);
      graphics.fillRoundedRect(0, 0, 60, 24, 6);
      graphics.generateTexture("brick", 60, 24);
      graphics.destroy();
    }
  }

  createBricks() {
    const rows = 5;
    const cols = 10;
    const offsetX = 80;
    const offsetY = 90;
    const spacingX = 64;
    const spacingY = 30;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = offsetX + col * spacingX;
        const y = offsetY + row * spacingY;
        const brick = this.bricks.create(x, y, "brick");
        brick.setTint(Phaser.Display.Color.GetColor(255, 107 - row * 10, 107 + row * 15));
      }
    }
  }

  onBallHitPaddle(ball, paddle) {
    const diff = ball.x - paddle.x;
    const percent = Phaser.Math.Clamp(diff / (paddle.displayWidth / 2), -1, 1);
    const speed = Math.max(ball.body.speed, 240);
    const angle = Phaser.Math.Linear(210, 330, (percent + 1) / 2);

    this.physics.velocityFromAngle(angle, speed, ball.body.velocity);
  }

  onBallHitBrick(ball, brick) {
    brick.disableBody(true, true);
    this.score += 10;
    this.scoreText.setText(`Score: ${this.score}`);

    if (this.bricks.countActive(true) === 0) {
      this.winGame();
    }
  }

  tryLaunchBall() {
    if (!this.ball.getData("stuck")) {
      return;
    }

    this.messageText.setVisible(false);
    this.ball.launch();
  }

  loseLife() {
    this.lives -= 1;
    this.livesText.setText(`Lives: ${this.lives}`);

    if (this.lives <= 0) {
      this.gameOver();
    } else {
      this.ball.stickTo(this.paddle.x, this.paddle.y - 20);
      this.messageText.setText("Click or press SPACE to launch");
      this.messageText.setVisible(true);
    }
  }

  gameOver() {
    this.isGameOver = true;
    this.ball.setVelocity(0, 0);
    this.messageText.setText("Game Over\nClick or press SPACE to restart");
    this.messageText.setVisible(true);
  }

  winGame() {
    this.isWin = true;
    this.ball.setVelocity(0, 0);
    this.messageText.setText("You Win!\nClick or press SPACE to restart");
    this.messageText.setVisible(true);
  }
}
