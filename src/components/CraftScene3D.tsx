"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function CraftScene3D() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
    } catch (error) {
      console.error("Three.js scene could not initialize WebGL", error);
      host.dataset.fallback = "true";
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);
    camera.position.set(0, 0, 8.5);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const palette = getComputedStyle(document.documentElement);
    const primary = new THREE.Color(palette.getPropertyValue("--palette-primary").trim() || "#28735b");
    const accent = new THREE.Color(palette.getPropertyValue("--palette-accent").trim() || "#c9693b");
    scene.add(new THREE.AmbientLight(0xffffff, 1.8));
    const keyLight = new THREE.PointLight(0xffffff, 34, 20);
    keyLight.position.set(2.5, 3, 5);
    scene.add(keyLight);
    const accentLight = new THREE.PointLight(accent, 24, 16);
    accentLight.position.set(-3, -1, 2);
    scene.add(accentLight);

    const artifact = new THREE.Group();
    scene.add(artifact);
    const metal = new THREE.MeshPhysicalMaterial({
      color: primary,
      metalness: 0.72,
      roughness: 0.22,
      clearcoat: 0.85,
      clearcoatRoughness: 0.16,
    });
    const gold = new THREE.MeshPhysicalMaterial({
      color: 0xd8ae6f,
      metalness: 0.82,
      roughness: 0.2,
      clearcoat: 0.75,
    });
    const jewel = new THREE.MeshPhysicalMaterial({
      color: accent,
      metalness: 0.34,
      roughness: 0.12,
      transmission: 0.16,
      thickness: 0.7,
      clearcoat: 1,
      emissive: accent,
      emissiveIntensity: 0.1,
    });

    const center = new THREE.Mesh(new THREE.IcosahedronGeometry(0.92, 2), jewel);
    artifact.add(center);
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.02, 1),
      new THREE.MeshBasicMaterial({ color: primary, wireframe: true, transparent: true, opacity: 0.5 })
    );
    artifact.add(wire);

    const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1.42, 0.055, 180, 10, 2, 5), metal);
    knot.rotation.set(0.25, 0.1, -0.3);
    artifact.add(knot);
    const ringOne = new THREE.Mesh(new THREE.TorusGeometry(1.72, 0.022, 10, 120), gold);
    ringOne.rotation.x = Math.PI / 2.45;
    artifact.add(ringOne);
    const ringTwo = new THREE.Mesh(new THREE.TorusGeometry(1.94, 0.014, 8, 120), metal);
    ringTwo.rotation.y = Math.PI / 2.6;
    ringTwo.rotation.x = -0.3;
    artifact.add(ringTwo);

    const beadGeometry = new THREE.SphereGeometry(0.105, 18, 14);
    const beads: THREE.Mesh[] = [];
    for (let index = 0; index < 14; index++) {
      const bead = new THREE.Mesh(beadGeometry, index % 3 === 0 ? jewel : gold);
      const angle = (index / 14) * Math.PI * 2;
      bead.position.set(Math.cos(angle) * 1.55, Math.sin(angle) * 1.55, Math.sin(angle * 2) * 0.24);
      artifact.add(bead);
      beads.push(bead);
    }

    const particleCount = 240;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index++) {
      particlePositions[index * 3] = (Math.random() - 0.5) * 8;
      particlePositions[index * 3 + 1] = (Math.random() - 0.5) * 7;
      particlePositions[index * 3 + 2] = (Math.random() - 0.5) * 5 - 1;
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({ color: accent, size: 0.025, transparent: true, opacity: 0.62, sizeAttenuation: true });
    scene.add(new THREE.Points(particleGeometry, particleMaterial));
    const themeObserver = new MutationObserver(() => {
      const current = getComputedStyle(document.documentElement);
      const nextPrimary = current.getPropertyValue("--palette-primary").trim();
      const nextAccent = current.getPropertyValue("--palette-accent").trim();
      if (nextPrimary) {
        primary.set(nextPrimary);
        metal.color.copy(primary);
        wire.material.color.copy(primary);
      }
      if (nextAccent) {
        accent.set(nextAccent);
        jewel.color.copy(accent);
        jewel.emissive.copy(accent);
        accentLight.color.copy(accent);
        particleMaterial.color.copy(accent);
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const pointer = new THREE.Vector2();
    const onPointerMove = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };
    host.addEventListener("pointermove", onPointerMove, { passive: true });
    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let previous = 0;
    const animate = (now: number) => {
      frame = window.requestAnimationFrame(animate);
      if (reducedMotion && now - previous < 500) return;
      previous = now;
      const time = now * 0.00035;
      artifact.rotation.y += ((pointer.x * 0.2 + Math.sin(time) * 0.18) - artifact.rotation.y) * 0.025;
      artifact.rotation.x += ((-pointer.y * 0.12 + Math.cos(time * 0.72) * 0.1) - artifact.rotation.x) * 0.025;
      artifact.position.y = Math.sin(time * 1.5) * 0.1;
      knot.rotation.z += 0.0012;
      ringOne.rotation.z += 0.0018;
      ringTwo.rotation.y += 0.0014;
      beads.forEach((bead, index) => {
        bead.scale.setScalar(0.88 + (Math.sin(time * 4 + index) + 1) * 0.1);
      });
      renderer.render(scene, camera);
    };
    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      host.removeEventListener("pointermove", onPointerMove);
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach(material => material.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={hostRef} className="craft-scene" role="img" aria-label="Animated 3D craft-inspired ornament"/>;
}
