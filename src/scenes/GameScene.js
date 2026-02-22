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
    this.winOverlay = null;
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
    // Load boss bricks for each level
    this.load.image("bigtreeboi", "assets/characters/bigtreeboi.png");
    this.load.image("bigbandit", "assets/characters/bigbandit.png");
    this.load.image("bigknight", "assets/characters/bigknight.png");
    // Load game object sprites
    this.load.image("paddle", "assets/misc/shield2.png");
    this.load.image("mainball", "assets/projectiles/mainball.png");
    this.load.image("multiball", "assets/projectiles/mainball2.png");
    this.load.image("spear", "assets/projectiles/spear.png");
    // Load powerup sprites
    this.load.image("ballspowerup", "assets/powerups/ballspowerup.png");
    this.load.image("bombpowerup", "assets/powerups/bombpowerup.png");
    this.load.image("speedpowerup", "assets/powerups/speedpowerup.png");
    this.load.image("spearpowerup", "assets/powerups/spearpowerup.png");
    // Load sound effects
    this.load.audio("ball_shield", "assets/sound_effects/ball_shield.wav");
    this.load.audio("ball_hit", "assets/sound_effects/balls.wav");
    this.load.audio("spear", "assets/sound_effects/spear.wav");
    this.load.audio("fast", "assets/sound_effects/fast.wav");
    this.load.audio("explosion", "assets/sound_effects/explosion.wav");
    this.load.audio("defeat", "assets/sound_effects/defeat.wav");
    // Load background music
    this.load.audio("bgm_forest", "assets/BGM/forest.ogg");
    this.load.audio("bgm_town", "assets/BGM/town.ogg");
    this.load.audio("bgm_castle", "assets/BGM/castle.ogg");

    // Add error handlers for debugging
    this.load.on("loaderror", (file) => {
      console.error("Failed to load asset:", file.key, "Type:", file.type, "URL:", file.url);
    });
    
    this.load.on("filecomplete", (key) => {
      console.log("Successfully loaded:", key);
    });
  }

  create() {
    this.createTextures();

    this.score = 0;
    this.lives = 3; // Reset to 3 lives for each level
    this.isGameOver = false;
    this.isWin = false;
    this.balls = []; // Reset balls array
    this.winOverlay = null;
    
    // Get level from scene data, or initialize to 1
    const data = this.scene.settings.data;
    if (data && data.level) {
      this.currentLevel = data.level;
    } else if (!this.currentLevel) {
      this.currentLevel = 1;
    }

    // Add background based on level
    this.createBackground();

    // Initialize sound context (required for browser autoplay policy)
    if (this.sound.context.state === "suspended") {
      console.log("Audio context suspended, resuming...");
      this.sound.context.resume();
    }

    // Play background music for the level
    const bgmKey = this.currentLevel === 1 ? "bgm_forest" : this.currentLevel === 2 ? "bgm_town" : "bgm_castle";
    console.log("Attempting to play BGM:", bgmKey);
    console.log("Sound manager muted:", this.sound.mute);
    
    this.sound.stopAll();
    try {
      const sound = this.sound.play(bgmKey, { loop: true, volume: 0.1 });
      console.log("BGM started:", bgmKey, "Sound object:", sound);
    } catch (e) {
      console.error("Error playing BGM:", e);
    }

    this.paddle = new Paddle(this, 600, 850);
    this.ball = new Ball(this, 400, 540, "mainball");
    this.balls.push(this.ball);

    this.bricks = this.physics.add.staticGroup();
    this.powerups = this.physics.add.group();
    this.createBricks();

    this.physics.add.collider(this.ball, this.paddle, this.onBallHitPaddle, null, this);
    this.physics.add.collider(this.ball, this.bricks, this.onBallHitBrick, null, this);
    this.physics.add.overlap(this.paddle, this.powerups, this.onPowerupCollect, null, this);

    const uiPanelWidth = 180;
    const uiPanelHeight = 38;
    const uiPanelPadding = 10;
    const uiPanelY = 12;
    const scorePanelX = 12;
    const livesPanelX = this.scale.width - uiPanelWidth - 12;
    const uiPanelRadius = 10;

    const uiPanels = this.add.graphics();
    // Score panel with dark golden gradient
    uiPanels.fillGradientStyle(0xc78f1a, 0xc78f1a, 0x7a4f0d, 0x7a4f0d, 1);
    uiPanels.fillRoundedRect(scorePanelX, uiPanelY, uiPanelWidth, uiPanelHeight, uiPanelRadius);
    uiPanels.fillGradientStyle(0xc78f1a, 0xc78f1a, 0x7a4f0d, 0x7a4f0d, 1);
    uiPanels.fillRoundedRect(livesPanelX, uiPanelY, uiPanelWidth, uiPanelHeight, uiPanelRadius);
    uiPanels.lineStyle(3, 0x000000, 1);
    uiPanels.strokeRoundedRect(scorePanelX, uiPanelY, uiPanelWidth, uiPanelHeight, uiPanelRadius);
    uiPanels.strokeRoundedRect(livesPanelX, uiPanelY, uiPanelWidth, uiPanelHeight, uiPanelRadius);
    uiPanels.setDepth(5);

    this.scoreText = this.add.text(scorePanelX + uiPanelPadding, uiPanelY + 7, "Score: 0", {
      fontSize: "22px",
      fontStyle: "bold",
      color: "#120b00"
    });
    this.scoreText.setDepth(6);

    this.livesText = this.add.text(livesPanelX + uiPanelPadding, uiPanelY + 7, "Lives: 3", {
      fontSize: "22px",
      fontStyle: "bold",
      color: "#120b00"
    });
    this.livesText.setDepth(6);

    this.messageText = this.add.text(this.scale.width / 2, this.scale.height / 2, "Click or press SPACE to launch", {
      fontSize: "56px",
      fontStyle: "bold",
      color: "#ffd166",
      align: "center",
      stroke: "#000000",
      strokeThickness: 6
    });
    this.messageText.setOrigin(0.5, 0.5);
    this.messageText.setDepth(10);

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
      // Resume audio context on user interaction
      if (this.sound.context.state === "suspended") {
        this.sound.context.resume();
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
          // Proceed to next level with 3 lives
          this.scene.restart({ level: this.currentLevel + 1 });
        } else if (this.isWin && this.currentLevel === 3) {
          // Game complete - restart from level 1
          this.scene.restart({ level: 1 });
        } else {
          // Game over - restart current level with 3 lives
          this.scene.restart({ level: this.currentLevel });
        }
        return;
      }
      this.tryLaunchBall();
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      if (this.isGameOver || this.isWin) {
        if (this.isWin && this.currentLevel < 3) {
          // Proceed to next level with 3 lives
          this.scene.restart({ level: this.currentLevel + 1 });
        } else if (this.isWin && this.currentLevel === 3) {
          // Game complete - restart from level 1
          this.scene.restart({ level: 1 });
        } else {
          // Game over - restart current level with 3 lives
          this.scene.restart({ level: this.currentLevel });
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


  }

  getBrickTexturesForLevel() {
    if (this.currentLevel === 1) {
      return { lower: "smalltreeboi", upper: "smalltreeboi2" };
    }
    if (this.currentLevel === 2) {
      return { lower: "smallbandit", upper: "smallbandit2" };
    }
    return { lower: "smallhammer", upper: "smallspear" };
  }

  getBrickTextureForRow(row) {
    const { lower, upper } = this.getBrickTexturesForLevel();
    return row < 5 ? lower : upper;
  }

  getBossBrickTexture() {
    if (this.currentLevel === 1) {
      return "bigtreeboi";
    }
    if (this.currentLevel === 2) {
      return "bigbandit";
    }
    return "bigknight";
  }

  getBrickBackgroundColor() {
    if (this.currentLevel === 1) {
      return 0x00fa9a;  // Medium Spring Green
    }
    if (this.currentLevel === 2) {
      return 0xff8c00;  // Dark Orange
    }
    return 0xdc143c;  // Crimson
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
    const spacingX = 45;
    const spacingY = 62; // Small gap between rows
    const largeSpacingY = 120; // Larger gap at row 4-5 boundary
    const offsetY = 50;
    const backgroundColor = this.getBrickBackgroundColor();
    const { lower, upper } = this.getBrickTexturesForLevel();

    this.brickOutlineGraphics = this.add.graphics();
    this.brickOutlineGraphics.setDepth(2); // Above bricks but below everything else

    this.brickOutlineData = []; // Track outline dimensions for each brick

    const createBrick = ({
      x,
      y,
      texture,
      width = 35,
      height = 60,
      health = 2,
      outlineWidth = 1,
      outlineColor = 0x000000,
      outlineAlpha = 0.6,
      cornerRadius = 3,
      isBoss = false
    }) => {
      const brickBg = this.add.image(x, y, "brick-bg");
      brickBg.setDisplaySize(width, height);
      brickBg.setTint(backgroundColor);
      brickBg.setDepth(0);

      const brick = this.bricks.create(x, y, texture);
      brick.setDisplaySize(width, height);
      brick.refreshBody();
      brick.setDepth(isBoss ? 2 : 1);
      brick.setData("bg", brickBg);
      if (isBoss) {
        brick.setData("isBoss", true);
      }
      brick.health = health;

      this.brickOutlineGraphics.lineStyle(outlineWidth, outlineColor, outlineAlpha);
      this.brickOutlineGraphics.strokeRoundedRect(x - width / 2, y - height / 2, width, height, cornerRadius);

      // Store outline data for later redraw
      this.brickOutlineData.push({
        brick,
        x: x - width / 2,
        y: y - height / 2,
        width,
        height,
        outlineWidth,
        outlineColor,
        outlineAlpha,
        cornerRadius
      });

      return brick;
    };

    // Boss brick (level-specific Y offset)
    const bossBrickBaseY = offsetY + (4 * spacingY) + (largeSpacingY - 350) / 2;
    const bossBrickCenterX = 700; // Center of 1400px width
    const bossBrickY = this.currentLevel === 2 ? bossBrickBaseY + 180 : bossBrickBaseY;
    createBrick({
      x: bossBrickCenterX,
      y: bossBrickY,
      texture: this.getBossBrickTexture(),
      width: 100,
      height: 120,
      health: 6,
      outlineWidth: 2,
      outlineColor: 0x000000,
      outlineAlpha: 0.8,
      cornerRadius: 5,
      isBoss: true
    });

    if (this.currentLevel === 1) {
      // Upper 5 rows remain as two 9x5 clusters
      const numClusters = 2;
      const clusterCols = 9;
      const gap = 170; // Gap between clusters
      const clusterWidth = clusterCols * spacingX;
      const totalWidth = (clusterWidth * numClusters) + gap;
      const offsetX = (1450 - totalWidth) / 2; // Center clusters horizontally

      for (let clusterIdx = 0; clusterIdx < numClusters; clusterIdx++) {
        const baseX = offsetX + clusterIdx * (clusterWidth + gap);

        for (let row = 0; row < 5; row += 1) {
          const y = offsetY + row * spacingY;
          for (let col = 0; col < clusterCols; col += 1) {
            const x = baseX + col * spacingX;
            const brickTexture = this.getBrickTextureForRow(row);
            createBrick({ x, y, texture: brickTexture });
          }
        }
      }

      // Lower 24x3 cluster
      const lowerCols = 24;
      const lowerRows = 3;
      const lowerWidth = lowerCols * spacingX;
      const lowerStartX = (this.scale.width - lowerWidth) / 2;
      const lowerStartY = offsetY + (4 * spacingY) + largeSpacingY;

      for (let row = 0; row < lowerRows; row += 1) {
        const y = lowerStartY + row * spacingY;
        for (let col = 0; col < lowerCols; col += 1) {
          const x = lowerStartX + col * spacingX;
          const brickTexture = this.getBrickTextureForRow(5 + row);
          createBrick({ x, y, texture: brickTexture });
        }
      }
      return;
    }

    if (this.currentLevel === 2) {
      // Bricks surround the boss with a 50px gap
      const cols = 18;
      const rows = 9;
      const startX = bossBrickCenterX - ((cols - 1) * spacingX) / 2;
      let startY = bossBrickY - ((rows - 1) * spacingY) / 2;
      const level2YOffset = -300; // Move the full layout higher
      const level2Gap = 30; // Gap around the boss brick
      startY += level2YOffset;
      if (startY < offsetY) {
        startY = offsetY;
      }

      const exclusionHalfW = (100 / 2) + level2Gap + (35 / 2);
      const exclusionHalfH = (120 / 2) + level2Gap + (60 / 2);

      for (let row = 0; row < rows; row += 1) {
        const y = startY + row * spacingY;
        for (let col = 0; col < cols; col += 1) {
          const x = startX + col * spacingX;
          const inGap = Math.abs(x - bossBrickCenterX) < exclusionHalfW && Math.abs(y - bossBrickY) < exclusionHalfH;
          if (inGap) {
            continue;
          }
          const brickTexture = y < bossBrickY ? lower : upper;
          createBrick({ x, y, texture: brickTexture });
        }
      }
      return;
    }

    // Level 3: 18 clusters of 3x3
    const clusterCols = 3;
    const clusterRows = 3;
    const clusterWidth = clusterCols * spacingX;
    const clusterHeight = clusterRows * spacingY;
    const clusterGapX = 30;
    const clusterGapY = 20;

    const placeCluster = (startX, startY) => {
      for (let row = 0; row < clusterRows; row += 1) {
        const y = startY + row * spacingY;
        for (let col = 0; col < clusterCols; col += 1) {
          const x = startX + col * spacingX;
          const brickTexture = y < bossBrickY ? lower : upper;
          createBrick({ x, y, texture: brickTexture });
        }
      }
    };

    const sideCols = 3;
    const sideRows = 2;
    const sideGroupWidth = (sideCols * clusterWidth) + ((sideCols - 1) * clusterGapX);
    const sideGroupHeight = (sideRows * clusterHeight) + ((sideRows - 1) * clusterGapY);

    let sideStartY = bossBrickY - (sideGroupHeight / 2);
    if (sideStartY < offsetY) {
      sideStartY = offsetY;
    }

    const rightStartX = bossBrickCenterX + (100 / 2) + 60;
    const leftStartX = bossBrickCenterX - (100 / 2) - 60 - sideGroupWidth;

    for (let row = 0; row < sideRows; row += 1) {
      const clusterY = sideStartY + row * (clusterHeight + clusterGapY);
      for (let col = 0; col < sideCols; col += 1) {
        const clusterX = rightStartX + col * (clusterWidth + clusterGapX);
        placeCluster(clusterX, clusterY);
      }
    }

    for (let row = 0; row < sideRows; row += 1) {
      const clusterY = sideStartY + row * (clusterHeight + clusterGapY);
      for (let col = 0; col < sideCols; col += 1) {
        const clusterX = leftStartX + col * (clusterWidth + clusterGapX);
        placeCluster(clusterX, clusterY);
      }
    }

    const belowCols = 6;
    const belowRows = 1;
    const belowGroupWidth = (belowCols * clusterWidth) + ((belowCols - 1) * clusterGapX);
    const belowStartX = bossBrickCenterX - (belowGroupWidth / 2);
    const belowStartY = sideStartY + sideGroupHeight + 40;

    for (let row = 0; row < belowRows; row += 1) {
      const clusterY = belowStartY + row * (clusterHeight + clusterGapY);
      for (let col = 0; col < belowCols; col += 1) {
        const clusterX = belowStartX + col * (clusterWidth + clusterGapX);
        placeCluster(clusterX, clusterY);
      }
    }
  }

  destroyBrick(brick) {
    const bg = brick.getData("bg");
    if (bg) {
      bg.destroy();
    }
    brick.disableBody(true, true);
    
    // Redraw brick outlines without the destroyed brick
    this.redrawBrickOutlines();
  }

  redrawBrickOutlines() {
    // Clear the graphics and redraw all remaining bricks' outlines
    this.brickOutlineGraphics.clear();

    this.bricks.children.entries.forEach(brick => {
      if (brick.active) {
        const outlineData = this.brickOutlineData.find(d => d.brick === brick);
        if (outlineData) {
          this.brickOutlineGraphics.lineStyle(outlineData.outlineWidth, outlineData.outlineColor, outlineData.outlineAlpha);
          this.brickOutlineGraphics.strokeRoundedRect(outlineData.x, outlineData.y, outlineData.width, outlineData.height, outlineData.cornerRadius);
        }
      }
    });
  }

  onBallHitPaddle(ball, paddle) {
    const diff = ball.x - paddle.x;
    const percent = Phaser.Math.Clamp(diff / (paddle.displayWidth / 2), -1, 1);
    const speed = Math.max(ball.body.speed, 240);
    const angle = Phaser.Math.Linear(210, 330, (percent + 1) / 2);

    this.physics.velocityFromAngle(angle, speed, ball.body.velocity);
    this.sound.play("ball_shield", { volume: 0.6 });
  }

  onBallHitBrick(ball, brick) {
    // Handle explosion powerup
    if (this.explosionNextHit) {
      this.explosionNextHit = false;
      this.triggerExplosion(brick.x, brick.y);
      this.sound.play("explosion", { volume: 0.6 });
    }

    this.sound.play("ball_hit", { volume: 0.45 });

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
      powerup.setDepth(3); // Above bricks
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
    this.sound.play("defeat", { volume: 0.6 });
    
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

    if (!this.winOverlay || !this.winOverlay.active) {
      this.winOverlay = this.add.rectangle(
        this.scale.width / 2,
        this.scale.height / 2,
        this.scale.width,
        this.scale.height,
        0x000000,
        0.5
      );
      this.winOverlay.setDepth(9);
    }
    
    if (this.currentLevel < 3) {
      this.messageText.setText("Click to proceed to next level");
    } else {
      this.messageText.setText("VICTORY");
      // Add restart message below VICTORY for final level
      const restartText = this.add.text(this.scale.width / 2, this.scale.height / 2 + 80, "Click or press SPACE to restart", {
        fontSize: "36px",
        fontStyle: "bold",
        color: "#ffd166",
        align: "center",
        stroke: "#000000",
        strokeThickness: 4
      });
      restartText.setOrigin(0.5, 0.5);
      restartText.setDepth(10);
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
    // Create a spear that shoots upward from paddle position
    const laser = this.add.sprite(paddleX, this.paddle.y - 50, "spear");
    laser.setOrigin(0.5, 0.5);
    laser.setDisplaySize(20, 80);
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
