export class Ball extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = "mainball") {
    super(scene, x, y, texture);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setBounce(1, 1);
    this.setCollideWorldBounds(false);
    this.setDisplaySize(32, 32);
    this.body.setCircle(18);
    this.body.setOffset(-2, -2);
    this.setData("stuck", true);
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
