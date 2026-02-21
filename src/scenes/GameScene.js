import { Paddle } from "../objects/Paddle.js";
import { Ball } from "../objects/Ball.js";
import { Powerup } from "../objects/Powerup.js";

export class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene");

    this.paddle = null;
    this.ball = null;
    this.balls = []; // Track all balls
    this.bricks = null;
    this.powerups = null;
    this.scoreText = null;
    this.livesText = null;
    this.messageText = null;
    this.cursors = null;

    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isWin = false;
    this.explosionNextHit = false; // Explosion powerup active
    this.laserActive = false; // Laser powerup active
    this.currentLevel = 1; // Level tracking (1-3)
    this.buttonJustClicked = false; // Flag to prevent double-trigger from button
  }

  preload() {
    // Load background images for all levels
    this.load.image("forest", "assets/backgrounds/forest2.png");
    this.load.image("town", "assets/backgrounds/town2.png");
    this.load.image("castle", "assets/backgrounds/castle2.png");
    // Load brick character images per level
    this.load.image("smalltreeboi", "assets/characters/smalltreeboi.png");
    this.load.image("smalltreeboi2", "assets/characters/smalltreeboi2.png");
    this.load.image("smallbandit", "assets/characters/smallbandit.png");
    this.load.image("smallbandit2", "assets/characters/smallbandit2.png");
    this.load.image("smallspear", "assets/characters/smallspear.png");
    this.load.image("smallhammer", "assets/characters/smallhammer.png");
  }

  create() {
    this.createTextures();

    this.score = 0;
    this.lives = 3;
    this.isGameOver = false;
    this.isWin = false;
    this.balls = []; // Reset balls array
    if (!this.currentLevel) {
      this.currentLevel = 1; // Initialize level if not set
    }

    // Add background based on level
    this.createBackground();

    this.paddle = new Paddle(this, 600, 850);
    this.ball = new Ball(this, 400, 540);
    this.balls.push(this.ball);

    this.bricks = this.physics.add.staticGroup();
    this.powerups = this.physics.add.group();
    this.createBricks();

    this.physics.add.collider(this.ball, this.paddle, this.onBallHitPaddle, null, this);
    this.physics.add.collider(this.ball, this.bricks, this.onBallHitBrick, null, this);
    this.physics.add.overlap(this.paddle, this.powerups, this.onPowerupCollect, null, this);

    const uiPanelWidth = 240;
    const uiPanelHeight = 44;
    const uiPanelPadding = 12;
    const uiPanelY = 12;
    const scorePanelX = 12;
    const livesPanelX = this.scale.width - uiPanelWidth - 12;

    const uiPanels = this.add.graphics();
    uiPanels.fillGradientStyle(0xffffff, 0xffffff, 0xd9d9d9, 0xd9d9d9, 1);
    uiPanels.fillRect(scorePanelX, uiPanelY, uiPanelWidth, uiPanelHeight);
    uiPanels.fillRect(livesPanelX, uiPanelY, uiPanelWidth, uiPanelHeight);
    uiPanels.lineStyle(2, 0x000000, 1);
    uiPanels.strokeRect(scorePanelX, uiPanelY, uiPanelWidth, uiPanelHeight);
    uiPanels.strokeRect(livesPanelX, uiPanelY, uiPanelWidth, uiPanelHeight);

    this.scoreText = this.add.text(scorePanelX + uiPanelPadding, uiPanelY + 8, "Score: 0", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#000000"
    });

    this.livesText = this.add.text(livesPanelX + uiPanelPadding, uiPanelY + 8, "Lives: 3", {
      fontSize: "24px",
      fontStyle: "bold",
      color: "#000000"
    });

    this.messageText = this.add.text(this.scale.width / 2, this.scale.height / 2, "Click or press SPACE to launch", {
      fontSize: "56px",
      fontStyle: "bold",
      color: "#ffd166",
      align: "center",
      stroke: "#000000",
      strokeThickness: 6
    });
    this.messageText.setOrigin(0.5, 0.5);

    // TEMPORARY TEST BUTTON - Remove before final submission
    const testWinButton = this.add.text(this.scale.width - 20, this.scale.height - 20, "WIN", {
      fontSize: "16px",
      color: "#ff0000",
      backgroundColor: "#222222",
      padding: { x: 8, y: 4 }
    });
    testWinButton.setOrigin(1, 1);
    testWinButton.setInteractive({ useHandCursor: true });
    testWinButton.on("pointerdown", (pointer) => {
      console.log("Button clicked, about to call winGame()");
      console.log("Before winGame - isWin:", this.isWin);
      this.buttonJustClicked = true;
      pointer.event.stopImmediatePropagation();
      this.winGame();
      console.log("After winGame - isWin:", this.isWin);
    });

    this.cursors = this.input.keyboard.createCursorKeys();

    this.input.on("pointermove", (pointer) => {
      if (this.isGameOver || this.isWin) {
        return;
      }
      this.paddle.moveTo(pointer.x, this.scale.width);
    });

    this.input.on("pointerdown", () => {
      if (this.buttonJustClicked) {
        this.buttonJustClicked = false;
        return;
      }
      console.log("Scene pointerdown - isGameOver:", this.isGameOver, "isWin:", this.isWin);
      if (this.isGameOver || this.isWin) {
        if (this.isWin && this.currentLevel < 3) {
          // Proceed to next level
          this.currentLevel++;
          this.scene.restart();
        } else if (this.isWin && this.currentLevel === 3) {
          // Game complete - restart from level 1
          this.currentLevel = 1;
          this.scene.restart();
        } else {
          // Game over - restart from level 1
          this.currentLevel = 1;
          this.scene.restart();
        }
        return;
      }
      this.tryLaunchBall();
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.isGameOver || this.isWin) {
        if (this.isWin && this.currentLevel < 3) {
          // Proceed to next level
          this.currentLevel++;
          this.scene.restart();
        } else if (this.isWin && this.currentLevel === 3) {
          // Game complete - restart from level 1
          this.currentLevel = 1;
          this.scene.restart();
        } else {
          // Game over - restart from level 1
          this.currentLevel = 1;
          this.scene.restart();
        }
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
    }

    // Handle all balls (main ball + extra balls)
    this.balls = this.balls.filter(ball => ball.active); // Remove destroyed balls
    
    this.balls.forEach(ball => {
      if (ball.getData("stuck")) {
        ball.setPosition(this.paddle.x, this.paddle.y - 20);
      } else {
        // Handle left/right bounds
        if (ball.x - ball.width / 2 < 0) {
          ball.x = ball.width / 2;
          ball.body.velocity.x = Math.abs(ball.body.velocity.x);
        } else if (ball.x + ball.width / 2 > this.scale.width) {
          ball.x = this.scale.width - ball.width / 2;
          ball.body.velocity.x = -Math.abs(ball.body.velocity.x);
        }
        
        // Handle top bound
        if (ball.y - ball.height / 2 < 0) {
          ball.y = ball.height / 2;
          ball.body.velocity.y = Math.abs(ball.body.velocity.y);
        }
        
        // Check bottom - destroy extra balls, lose life for main ball
        if (ball.y > this.scale.height + 30) {
          if (ball === this.ball) {
            this.loseLife();
          } else {
            ball.destroy();
          }
        }
      }
    });

    // Move powerups down
    this.powerups.children.entries.forEach(powerup => {
      powerup.y += powerup.fallSpeed * this.game.loop.delta / 1000;
      
      // Remove powerup if it falls off screen
      if (powerup.y > this.scale.height + 50) {
        powerup.destroy();
      }
    });
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
      graphics.fillRoundedRect(0, 0, 35, 60, 6);
      graphics.generateTexture("brick", 35, 60);
      graphics.destroy();
    }

    if (!this.textures.exists("brick-bg")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRoundedRect(0, 0, 35, 60, 6);
      graphics.generateTexture("brick-bg", 35, 60);
      graphics.destroy();
    }

    if (!this.textures.exists("powerup")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xffffff, 1);
      graphics.fillRect(0, 0, 30, 15);
      graphics.generateTexture("powerup", 30, 15);
      graphics.destroy();
    }

    if (!this.textures.exists("laser")) {
      const graphics = this.add.graphics();
      graphics.fillStyle(0xff0000, 1);
      graphics.fillRect(0, 0, 10, 600);
      graphics.generateTexture("laser", 10, 600);
      graphics.destroy();
    }
  }

  getBrickTexturesForLevel() {
    if (this.currentLevel === 1) {
      return { lower: "smalltreeboi", upper: "smalltreeboi2" };
    }
    if (this.currentLevel === 2) {
      return { lower: "smallbandit", upper: "smallbandit2" };
    }
    return { lower: "smallspear", upper: "smallhammer" };
  }

  getBrickTextureForRow(row) {
    const { lower, upper } = this.getBrickTexturesForLevel();
    return row < 5 ? lower : upper;
  }

  getBrickBackgroundColor() {
    if (this.currentLevel === 1) {
      return 0xcfeecf; // Light green
    }
    if (this.currentLevel === 2) {
      return 0xe0e0e0; // Light gray
    }
    return 0xc0c0c0; // Light silver
  }


  createBackground() {
    let backgroundKey;
    if (this.currentLevel === 1) {
      backgroundKey = "forest";
    } else if (this.currentLevel === 2) {
      backgroundKey = "town";
    } else {
      backgroundKey = "castle";
    }

    const background = this.add.image(this.scale.width / 2, this.scale.height / 2, backgroundKey);
    background.setDepth(-1); // Behind all other objects
    background.setDisplaySize(this.scale.width, this.scale.height);
  }

  createBricks() {
    const numClusters = 2;
    const clusterCols = 9;
    const clusterRows = 9;
    const spacingX = 45;
    const spacingY = 60;
    const offsetY = 50;
    const clusterWidth = clusterCols * spacingX;
    const gap = 100; // Gap between clusters (large enough for ball)
    const totalWidth = (clusterWidth * numClusters) + gap;
    const offsetX = (1400 - totalWidth) / 2; // Center clusters horizontally
    const backgroundColor = this.getBrickBackgroundColor();

    for (let clusterIdx = 0; clusterIdx < numClusters; clusterIdx++) {
      const baseX = offsetX + clusterIdx * (clusterWidth + gap);
      
      for (let row = 0; row < clusterRows; row += 1) {
        for (let col = 0; col < clusterCols; col += 1) {
          const x = baseX + col * spacingX;
          const y = offsetY + row * spacingY;
          const brickTexture = this.getBrickTextureForRow(row);
          const brickBg = this.add.image(x, y, "brick-bg");
          brickBg.setDisplaySize(35, 60);
          brickBg.setTint(backgroundColor);
          brickBg.setDepth(0);
          const brick = this.bricks.create(x, y, brickTexture);
          brick.setDisplaySize(35, 60);
          brick.refreshBody();
          brick.setDepth(1);
          brick.setData("bg", brickBg);
          brick.health = 2; // Bricks take 2 hits to destroy
        }
      }
    }
  }

  destroyBrick(brick) {
    const bg = brick.getData("bg");
    if (bg) {
      bg.destroy();
    }
    brick.disableBody(true, true);
  }

  onBallHitPaddle(ball, paddle) {
    const diff = ball.x - paddle.x;
    const percent = Phaser.Math.Clamp(diff / (paddle.displayWidth / 2), -1, 1);
    const speed = Math.max(ball.body.speed, 240);
    const angle = Phaser.Math.Linear(210, 330, (percent + 1) / 2);

    this.physics.velocityFromAngle(angle, speed, ball.body.velocity);
  }

  onBallHitBrick(ball, brick) {
    // Handle explosion powerup
    if (this.explosionNextHit) {
      this.explosionNextHit = false;
      this.triggerExplosion(brick.x, brick.y);
    }

    // Reduce brick health
    brick.health -= 1;
    
    if (brick.health <= 0) {
      this.destroyBrick(brick);
      this.score += 10;
    } else {
      // Visual feedback: reduce opacity when damaged
      brick.setAlpha(0.5);
    }
    
    this.scoreText.setText(`Score: ${this.score}`);

    // 30% chance to spawn a powerup
    if (Math.random() < 0.3) {
      const types = ["fast", "multiball", "explosion", "laser"];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const powerup = new Powerup(this, brick.x, brick.y, randomType);
      this.powerups.add(powerup);
    }

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
    
    // Create black overlay
    const overlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.9);
    overlay.setDepth(100);
    
    // Display "GIT GUD" message
    const diedText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 60, "YOU DIED", {
      fontSize: "96px",
      fontStyle: "bold",
      color: "#ff0000",
      align: "center",
      stroke: "#000000",
      strokeThickness: 8
    });
    diedText.setOrigin(0.5, 0.5);
    diedText.setDepth(101);
    
    // Display restart message
    const restartText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, "Click or press SPACE to restart", {
      fontSize: "56px",
      fontStyle: "bold",
      color: "#ffd166",
      align: "center",
      stroke: "#000000",
      strokeThickness: 6
    });
    restartText.setOrigin(0.5, 0.5);
    restartText.setDepth(101);
  }

  winGame() {
    console.log("winGame() called");
    this.isWin = true;
    this.ball.setVelocity(0, 0);
    
    if (this.currentLevel < 3) {
      this.messageText.setText("Click to proceed to next level");
    } else {
      this.messageText.setText("VICTORY");
    }
    
    this.messageText.setVisible(true);
  }

  onPowerupCollect(paddle, powerup) {
    powerup.activate(this);
    powerup.destroy();
  }

  triggerExplosion(centerX, centerY) {
    // Find all bricks adjacent to the hit brick and damage them
    this.bricks.children.entries.forEach(brick => {
      if (!brick.active) return;
      
      const distance = Phaser.Math.Distance.Between(centerX, centerY, brick.x, brick.y);
      
      // Check if brick is adjacent (within ~100 pixels)
      if (distance < 100 && distance > 0) {
        brick.health -= 1;
        if (brick.health <= 0) {
          this.destroyBrick(brick);
          this.score += 10;
        } else {
          brick.setAlpha(0.5);
        }
      }
    });
    
    this.scoreText.setText(`Score: ${this.score}`);
  }

  createLaser(paddleX) {
    // Create a red laser that shoots upward from paddle position
    const laser = this.add.sprite(paddleX, this.paddle.y - 50, "laser");
    laser.setOrigin(0.5, 0);
    laser.setScale(1, 2); // Make it taller
    laser.hitBricks = new Set(); // Track bricks hit by this laser
    
    // Move laser upward
    const laserTween = this.tweens.add({
      targets: laser,
      y: -600,
      duration: 800,
      onUpdate: () => {
        // Check collision with bricks
        this.bricks.children.entries.forEach(brick => {
          if (!brick.active) return;
          if (laser.hitBricks.has(brick)) return; // Already hit this brick
          
          const distance = Phaser.Math.Distance.Between(laser.x, laser.y, brick.x, brick.y);
          if (distance < 50) {
            laser.hitBricks.add(brick); // Mark as hit
            brick.health -= 1; // Only deal 1 damage
            if (brick.health <= 0) {
              this.destroyBrick(brick);
              this.score += 10;
            } else {
              brick.setAlpha(0.5);
            }
          }
        });
      },
      onComplete: () => {
        laser.destroy();
      }
    });
    
    this.scoreText.setText(`Score: ${this.score}`);
  }
}
