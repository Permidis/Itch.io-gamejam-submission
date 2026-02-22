export class Paddle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "paddle");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setOrigin(0.5, 0.5);
    this.setDisplaySize(120, 40);
    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
  }

  moveTo(x, boundsWidth) {
    const halfWidth = this.displayWidth / 2;
    const clampedX = Phaser.Math.Clamp(x, halfWidth, boundsWidth - halfWidth);
    this.setX(clampedX);
    this.body.updateFromGameObject();
  }
}
