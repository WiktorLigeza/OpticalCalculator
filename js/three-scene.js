import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SCALE = 0.001;

export function createScene(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#060b16');

  const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100);
  camera.position.set(1.6, 1.4, 2.2);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 0.4;
  controls.maxDistance = 6;

  const grid = new THREE.GridHelper(4, 20, 0x1d3b5c, 0x0f1e33);
  grid.position.y = 0;
  scene.add(grid);

  const ambient = new THREE.AmbientLight(0x66a6ff, 0.6);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0x33e2ff, 0.9);
  key.position.set(2, 2, 1);
  scene.add(key);

  const cameraBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.12, 0.06, 0.1),
    new THREE.MeshStandardMaterial({ color: 0x2bd2ff, emissive: 0x0b2b39, metalness: 0.3, roughness: 0.2 })
  );
  scene.add(cameraBody);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.05, 24),
    new THREE.MeshStandardMaterial({ color: 0x0d2034, emissive: 0x0b1b2a })
  );
  lens.rotation.x = Math.PI / 2;
  cameraBody.add(lens);

  const fitFrustumMaterial = new THREE.LineBasicMaterial({ color: 0x33e2ff });
  const refFrustumMaterial = new THREE.LineBasicMaterial({ color: 0x37ff8b });
  const roiMaterial = new THREE.MeshStandardMaterial({
    color: 0x8a7dff,
    emissive: 0x120f2a,
    metalness: 0.1,
    roughness: 0.6,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
  });

  const fitFrustumLines = new THREE.LineSegments(new THREE.BufferGeometry(), fitFrustumMaterial);
  scene.add(fitFrustumLines);

  const refFrustumLines = new THREE.LineSegments(new THREE.BufferGeometry(), refFrustumMaterial);
  scene.add(refFrustumLines);

  const roiPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), roiMaterial);
  roiPlane.rotation.x = -Math.PI / 2;
  scene.add(roiPlane);

  const state = {
    distance: 2,
    fitFovW: 1.2,
    fitFovH: 0.8,
    refFovW: 1.2,
    refFovH: 0.8,
    roiW: 1.1,
    roiH: 0.7,
    visibility: {
      fitFov: true,
      refFov: true,
    },
  };

  function buildFrustum(fovW, fovH) {
    const distance = state.distance * SCALE;
    const halfW = (fovW * SCALE) / 2;
    const halfH = (fovH * SCALE) / 2;
    const camPos = new THREE.Vector3(0, distance, 0);
    const corners = [
      new THREE.Vector3(-halfW, 0, -halfH),
      new THREE.Vector3(halfW, 0, -halfH),
      new THREE.Vector3(halfW, 0, halfH),
      new THREE.Vector3(-halfW, 0, halfH),
    ];

    const points = [];
    for (let i = 0; i < corners.length; i += 1) {
      points.push(camPos, corners[i]);
    }
    for (let i = 0; i < corners.length; i += 1) {
      points.push(corners[i], corners[(i + 1) % corners.length]);
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }

  function updateGeometry() {
    const distance = state.distance * SCALE;
    cameraBody.position.set(0, distance, 0);
    cameraBody.lookAt(0, 0, 0);

    const fitGeometry = buildFrustum(state.fitFovW, state.fitFovH);
    fitFrustumLines.geometry.dispose();
    fitFrustumLines.geometry = fitGeometry;

    const refGeometry = buildFrustum(state.refFovW, state.refFovH);
    refFrustumLines.geometry.dispose();
    refFrustumLines.geometry = refGeometry;

    const roiW = Math.max(state.roiW * SCALE, 0.001);
    const roiH = Math.max(state.roiH * SCALE, 0.001);
    roiPlane.geometry.dispose();
    roiPlane.geometry = new THREE.PlaneGeometry(roiW, roiH);

    fitFrustumLines.visible = state.visibility.fitFov;
    refFrustumLines.visible = state.visibility.refFov;
  }

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  function animate() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  resize();
  updateGeometry();
  animate();

  window.addEventListener('resize', resize);

  return {
    update(values) {
      state.distance = values.distance;
      state.fitFovW = values.fitFovW;
      state.fitFovH = values.fitFovH;
      state.refFovW = values.refFovW;
      state.refFovH = values.refFovH;
      state.roiW = values.roiW;
      state.roiH = values.roiH;
      state.visibility = values.visibility;
      updateGeometry();
    },
    resetView() {
      controls.reset();
    },
  };
}
