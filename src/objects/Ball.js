export class Ball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, color = 0xf4f1de) {
    super(scene, x, y, "ball");

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setBounce(1, 1);
    this.setCollideWorldBounds(false);
    this.setCircle(this.width / 2);
    this.setData("stuck", true);
    this.setTint(color);
  }

  launch(speed = 260) {
    const angle = Phaser.Math.DegToRad(Phaser.Math.Between(220, 320));
    this.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    this.setData("stuck", false);
  }

  stickTo(x, y) {
    this.setVelocity(0, 0);
    this.setPosition(x, y);
    this.setData("stuck", true);
  }
}
