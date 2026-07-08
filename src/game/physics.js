import * as CANNON from "cannon-es";
import { STAGE, PHYSICS } from "./config.js";

// cannon-es の物理世界と、床・壁の固定Bodyを構築する。
export function createPhysics() {
  const world = new CANNON.World({
    gravity: new CANNON.Vec3(0, PHYSICS.gravity, 0),
  });
  world.broadphase = new CANNON.SAPBroadphase(world);
  world.allowSleep = true;

  // マテリアル定義
  const sphereMat = new CANNON.Material("sphere");
  const floorMat = new CANNON.Material("floor");
  const wallMat = new CANNON.Material("wall");

  world.addContactMaterial(
    new CANNON.ContactMaterial(sphereMat, floorMat, {
      friction: PHYSICS.floorFriction,
      restitution: PHYSICS.sphereRestitution,
    })
  );
  world.addContactMaterial(
    new CANNON.ContactMaterial(sphereMat, wallMat, {
      friction: PHYSICS.wallFriction,
      restitution: PHYSICS.sphereRestitution,
    })
  );
  world.addContactMaterial(
    new CANNON.ContactMaterial(sphereMat, sphereMat, {
      friction: PHYSICS.sphereFriction,
      restitution: PHYSICS.sphereRestitution,
    })
  );

  // --- 床（無限平面ではなくボックスで安定させる） ---
  const floorBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    material: floorMat,
    shape: new CANNON.Box(
      new CANNON.Vec3(STAGE.width / 2, 0.2, STAGE.depth / 2)
    ),
  });
  floorBody.position.set(0, STAGE.floorY - 0.2, 0);
  world.addBody(floorBody);

  // --- 壁を作る補助 ---
  const wallThickness = 0.3;
  const wallHeight = STAGE.spawnY + 3;

  const addWall = (halfExtents, pos) => {
    const body = new CANNON.Body({
      type: CANNON.Body.STATIC,
      material: wallMat,
      shape: new CANNON.Box(halfExtents),
    });
    body.position.set(pos.x, pos.y, pos.z);
    world.addBody(body);
    return body;
  };

  // 左右の壁
  addWall(
    new CANNON.Vec3(wallThickness / 2, wallHeight / 2, STAGE.depth / 2),
    { x: STAGE.leftWall - wallThickness / 2, y: wallHeight / 2, z: 0 }
  );
  addWall(
    new CANNON.Vec3(wallThickness / 2, wallHeight / 2, STAGE.depth / 2),
    { x: STAGE.rightWall + wallThickness / 2, y: wallHeight / 2, z: 0 }
  );
  // 奥・手前の壁（透明。飛び出し防止）
  addWall(
    new CANNON.Vec3(STAGE.width / 2 + 0.4, wallHeight / 2, wallThickness / 2),
    { x: 0, y: wallHeight / 2, z: STAGE.backWall - wallThickness / 2 }
  );
  addWall(
    new CANNON.Vec3(STAGE.width / 2 + 0.4, wallHeight / 2, wallThickness / 2),
    { x: 0, y: wallHeight / 2, z: STAGE.frontWall + wallThickness / 2 }
  );

  return { world, sphereMat };
}

// 球の物理Bodyを作る。
export function createSphereBody(sphereMat, radius, mass, x, y, z) {
  const body = new CANNON.Body({
    mass,
    material: sphereMat,
    shape: new CANNON.Sphere(radius),
    linearDamping: PHYSICS.linearDamping,
    angularDamping: PHYSICS.angularDamping,
  });
  body.position.set(x, y, z);
  body.sleepSpeedLimit = 0.15;
  body.sleepTimeLimit = 0.5;
  return body;
}
