"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

type Shard = {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>;
  baseRotation: THREE.Euler;
  scrollSpin: THREE.Vector3;
  baseY: number;
  scrollLift: number;
};

function seededRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

export function QuantumShardField() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mount = mountRef.current;

    if (!mount) {
      return;
    }

    const scene = new THREE.Scene();
    const bgColor = 0x09090b;
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.FogExp2(bgColor, 0.025);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 15);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0x222233, 1.5));

    const tealLight = new THREE.PointLight(0x00e5ff, 5, 50);
    tealLight.position.set(10, 15, 10);
    scene.add(tealLight);

    const violetLight = new THREE.PointLight(0xb388ff, 4, 50);
    violetLight.position.set(-10, -15, 10);
    scene.add(violetLight);

    const backLight = new THREE.PointLight(0xffffff, 2, 60);
    backLight.position.set(0, 0, -20);
    scene.add(backLight);

    const shardMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.15,
      transparent: true,
      opacity: 1,
      side: THREE.DoubleSide,
    });
    (
      shardMaterial as unknown as {
        setValues: (values: Record<string, number>) => void;
      }
    ).setValues({
      transmission: 0.95,
      ior: 1.5,
    });

    const random = seededRandom(42);
    const geometries = [
      new THREE.TetrahedronGeometry(1, 0),
      new THREE.OctahedronGeometry(1, 0),
      new THREE.IcosahedronGeometry(1, 0),
    ];

    geometries.forEach((geometry) => {
      geometry.scale(1, 2.5 + random() * 1.5, 1);
    });

    const shards: Shard[] = [];

    for (let index = 0; index < 60; index += 1) {
      const geometry = geometries[Math.floor(random() * geometries.length)];
      const mesh = new THREE.Mesh<THREE.BufferGeometry, THREE.MeshPhysicalMaterial>(
        geometry,
        shardMaterial,
      );

      mesh.position.x = (random() - 0.5) * 40;
      mesh.position.y = (random() - 0.5) * 40;
      mesh.position.z = (random() - 0.5) * 30 - 5;

      mesh.rotation.x = random() * Math.PI;
      mesh.rotation.y = random() * Math.PI;
      mesh.rotation.z = random() * Math.PI;

      const scale = random() * 0.8 + 0.2;
      mesh.scale.set(scale, scale, scale);

      shards.push({
        mesh,
        baseRotation: mesh.rotation.clone(),
        scrollSpin: new THREE.Vector3(
          (random() - 0.5) * 0.45,
          (random() - 0.5) * 0.45,
          (random() - 0.5) * 0.45,
        ),
        baseY: mesh.position.y,
        scrollLift: (random() - 0.5) * 0.8,
      });

      scene.add(mesh);
    }

    let frame = 0;
    let targetCameraY = 0;
    let currentCameraY = 0;
    let lastScrollY = window.scrollY;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const render = () => {
      const scrollProgress = reducedMotion
        ? 0
        : Math.min(1, window.scrollY / Math.max(1, window.innerHeight * 2.5));

      currentCameraY += (targetCameraY - currentCameraY) * 0.18;
      camera.position.y = currentCameraY;
      camera.lookAt(camera.position.x * 0.5, camera.position.y * 0.5, 0);

      shards.forEach((shard) => {
        shard.mesh.rotation.x =
          shard.baseRotation.x + scrollProgress * shard.scrollSpin.x;
        shard.mesh.rotation.y =
          shard.baseRotation.y + scrollProgress * shard.scrollSpin.y;
        shard.mesh.rotation.z =
          shard.baseRotation.z + scrollProgress * shard.scrollSpin.z;
        shard.mesh.position.y = shard.baseY + scrollProgress * shard.scrollLift;
      });

      renderer.render(scene, camera);

      if (Math.abs(targetCameraY - currentCameraY) > 0.002) {
        frame = window.requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };

    const requestRender = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(render);
      }
    };

    const handleScroll = () => {
      lastScrollY = window.scrollY;
      targetCameraY = reducedMotion ? 0 : lastScrollY * 0.015;
      requestRender();
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      handleScroll();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);

      if (frame !== 0) {
        window.cancelAnimationFrame(frame);
      }

      shards.forEach((shard) => {
        scene.remove(shard.mesh);
      });

      geometries.forEach((geometry) => geometry.dispose());
      shardMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="codequest-backdrop" aria-hidden="true" ref={mountRef} />
  );
}
