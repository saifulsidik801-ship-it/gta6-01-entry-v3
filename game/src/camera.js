// Camera: low chase cam behind the car / over-shoulder on foot, speed FOV kick.
export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.yaw = 0; // orbit around the player (radians)
    this.pitch = -0.34;
    this.dist = 7.5;
    this.chaseHeight = 2.7;
    this.lookHeight = 1.2;
    this.mode = 'chase';
    this._pos = new THREE.Vector3();
    this._look = new THREE.Vector3();
  }
  update(dt, player, driving) {
    const cam = this.camera;
    if (this.mode === 'shoulder') {
      const px = player.position.x, pz = player.position.z;
      const bx = px + Math.sin(player.state.facing + Math.PI) * 2.6;
      const bz = pz + Math.cos(player.state.facing + Math.PI) * 2.6;
      this._pos.set(bx, 2.0, bz);
      cam.position.lerp(this._pos, Math.min(1, dt * 10));
      this._look.set(px + Math.sin(player.state.facing) * 6, 1.4, pz + Math.cos(player.state.facing) * 6);
      cam.lookAt(this._look);
      cam.fov += (62 - cam.fov) * Math.min(1, dt * 4);
      cam.updateProjectionMatrix();
      return;
    }
    // chase: behind the car (or behind the player when on foot)
    const target = driving ? driving.mesh.position : player.position;
    const yaw = driving ? driving.heading : player.state.facing;
    // forward in xz for heading psi: (sin psi, cos psi).
    const fx = Math.sin(yaw), fz = Math.cos(yaw);
    const d = driving ? this.dist : 5.2;
    const h = driving ? this.chaseHeight : 2.2;
    this._pos.set(target.x - fx * d, h, target.z - fz * d);
    cam.position.lerp(this._pos, Math.min(1, dt * 6));
    this._look.set(target.x + fx * 8, this.lookHeight, target.z + fz * 8);
    cam.lookAt(this._look);
    const speed = driving ? Math.abs(driving.speed) : player.state.speed;
    const wantFov = 58 + Math.min(14, speed * 0.55);
    cam.fov += (wantFov - cam.fov) * Math.min(1, dt * 3);
    cam.updateProjectionMatrix();
  }
  // Snap instantly (staging).
  snap(player, driving) {
    this.update(10, player, driving);
    this.camera.position.copy(this._pos);
    this.camera.lookAt(this._look);
  }
}
