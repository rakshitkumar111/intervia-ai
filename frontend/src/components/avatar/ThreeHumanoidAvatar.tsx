import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AvatarState, VisemeType } from '../../types';
import { LipSyncController } from './LipSyncController';

interface ThreeHumanoidAvatarProps {
  state: AvatarState;
  currentViseme?: VisemeType;
  audioLevel?: number; // 0.0 to 1.0 (from candidate mic or TTS output)
  interviewerName?: string;
  interviewerTitle?: string;
  onFallbackRequest?: () => void;
}

export const ThreeHumanoidAvatar: React.FC<ThreeHumanoidAvatarProps> = ({
  state,
  currentViseme = 'REST',
  audioLevel = 0,
  interviewerName = 'Dr. Sarah Mitchell',
  interviewerTitle = 'Senior AI Technical Interviewer'
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const lipSyncRef = useRef<LipSyncController>(new LipSyncController());
  const [webglError, setWebglError] = useState<boolean>(false);

  useEffect(() => {
    lipSyncRef.current.setViseme(currentViseme, audioLevel);
  }, [currentViseme, audioLevel]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch (e) {
      console.error('WebGL initialization error:', e);
      setWebglError(true);
      return;
    }

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 420;

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // --- 1. Scene & Camera ---
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.45, 2.65);

    // --- 2. Professional 3-Point Studio Lighting ---
    const ambientLight = new THREE.AmbientLight(0xdbeafe, 0.85);
    scene.add(ambientLight);

    // Key Light (Warm Front-Right)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    keyLight.position.set(1.5, 2.2, 2.2);
    keyLight.castShadow = true;
    scene.add(keyLight);

    // Fill Light (Cool Blue Front-Left)
    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.1);
    fillLight.position.set(-1.8, 0.8, 1.8);
    scene.add(fillLight);

    // Rim / Backlight (Dramatic Silhouette defining hair and suit)
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    rimLight.position.set(0, 1.8, -1.8);
    scene.add(rimLight);

    // Dynamic State Glow Light
    const stateLight = new THREE.PointLight(0x3b82f6, 1.2, 4);
    stateLight.position.set(0, -0.4, 1.0);
    scene.add(stateLight);

    // --- 3. Avatar 3D Rigging ---
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);

    // Realistic PBR Skin Material
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xf3b398,
      roughness: 0.55,
      metalness: 0.05,
    });

    const skinShadowMaterial = new THREE.MeshStandardMaterial({
      color: 0xd98c72,
      roughness: 0.65,
      metalness: 0.02,
    });

    // Suit Blazer Material (Deep Navy Wool PBR)
    const suitMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.15,
    });

    // Silk Lapel Accent
    const lapelMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.4,
      metalness: 0.35,
    });

    // Crisp Shirt Material
    const shirtMaterial = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.6,
      metalness: 0.05,
    });

    // Silk Blue Tie
    const tieMaterial = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.3,
      metalness: 0.5,
    });

    // Hair Material (Dark Brunette / Black)
    const hairMaterial = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.75,
      metalness: 0.2,
    });

    // --- Body / Torso Assembly ---
    const torsoGroup = new THREE.Group();
    avatarGroup.add(torsoGroup);

    // Chest & Shoulders
    const chestGeo = new THREE.CylinderGeometry(0.55, 0.48, 0.85, 32);
    const chestMesh = new THREE.Mesh(chestGeo, suitMaterial);
    chestMesh.position.set(0, -0.52, 0);
    torsoGroup.add(chestMesh);

    // Shoulders
    const leftShoulderGeo = new THREE.SphereGeometry(0.24, 24, 24);
    const leftShoulder = new THREE.Mesh(leftShoulderGeo, suitMaterial);
    leftShoulder.position.set(-0.52, -0.22, 0);
    leftShoulder.scale.set(1.2, 0.9, 1.0);
    torsoGroup.add(leftShoulder);

    const rightShoulder = leftShoulder.clone();
    rightShoulder.position.set(0.52, -0.22, 0);
    torsoGroup.add(rightShoulder);

    // Blazer Lapels (Left and Right angled plates)
    const lapelGeo = new THREE.BoxGeometry(0.12, 0.55, 0.04);
    const leftLapel = new THREE.Mesh(lapelGeo, lapelMaterial);
    leftLapel.position.set(-0.16, -0.42, 0.24);
    leftLapel.rotation.z = -0.32;
    torsoGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, lapelMaterial);
    rightLapel.position.set(0.16, -0.42, 0.24);
    rightLapel.rotation.z = 0.32;
    torsoGroup.add(rightLapel);

    // Shirt Collar
    const collarGeo = new THREE.ConeGeometry(0.25, 0.3, 4);
    const collarMesh = new THREE.Mesh(collarGeo, shirtMaterial);
    collarMesh.position.set(0, -0.25, 0.18);
    collarMesh.rotation.y = Math.PI / 4;
    collarMesh.scale.set(1.2, 0.6, 0.8);
    torsoGroup.add(collarMesh);

    // Tie
    const tieGeo = new THREE.BoxGeometry(0.08, 0.52, 0.03);
    const tieMesh = new THREE.Mesh(tieGeo, tieMaterial);
    tieMesh.position.set(0, -0.48, 0.25);
    torsoGroup.add(tieMesh);

    // --- Neck & Head Kinematics ---
    const neckGroup = new THREE.Group();
    neckGroup.position.set(0, -0.05, 0);
    avatarGroup.add(neckGroup);

    const neckGeo = new THREE.CylinderGeometry(0.13, 0.16, 0.28, 24);
    const neckMesh = new THREE.Mesh(neckGeo, skinShadowMaterial);
    neckMesh.position.set(0, 0.05, 0);
    neckGroup.add(neckMesh);

    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.22, 0);
    neckGroup.add(headGroup);

    // Sculpted Head Geometry
    const headGeo = new THREE.SphereGeometry(0.32, 32, 32);
    headGeo.scale(0.92, 1.15, 1.0);
    const headMesh = new THREE.Mesh(headGeo, skinMaterial);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Jawline Definition
    const jawGeo = new THREE.ConeGeometry(0.26, 0.35, 16);
    const jawMesh = new THREE.Mesh(jawGeo, skinMaterial);
    jawMesh.position.set(0, -0.2, 0.05);
    jawMesh.scale.set(1.0, 0.7, 0.9);
    jawMesh.rotation.x = Math.PI;
    headGroup.add(jawMesh);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.07, 16, 16);
    earGeo.scale(0.4, 1.2, 0.8);
    const leftEar = new THREE.Mesh(earGeo, skinMaterial);
    leftEar.position.set(-0.31, 0.02, -0.02);
    leftEar.rotation.y = -0.2;
    headGroup.add(leftEar);

    const rightEar = leftEar.clone();
    rightEar.position.set(0.31, 0.02, -0.02);
    rightEar.rotation.y = 0.2;
    headGroup.add(rightEar);

    // Professional Layered 3D Hairstyle
    const hairBaseGeo = new THREE.SphereGeometry(0.35, 32, 32);
    hairBaseGeo.scale(0.96, 1.18, 1.06);
    const hairBase = new THREE.Mesh(hairBaseGeo, hairMaterial);
    hairBase.position.set(0, 0.06, -0.04);
    headGroup.add(hairBase);

    // Hair Strands / Volume Bangs
    const bangGeo = new THREE.TorusGeometry(0.24, 0.09, 16, 32, Math.PI * 0.95);
    const bangMesh = new THREE.Mesh(bangGeo, hairMaterial);
    bangMesh.position.set(0, 0.24, 0.18);
    bangMesh.rotation.x = -0.55;
    bangMesh.rotation.z = -0.15;
    headGroup.add(bangMesh);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.12, 0.025, 0.03);
    const leftBrow = new THREE.Mesh(browGeo, hairMaterial);
    leftBrow.position.set(-0.13, 0.11, 0.29);
    leftBrow.rotation.z = -0.08;
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, hairMaterial);
    rightBrow.position.set(0.13, 0.11, 0.29);
    rightBrow.rotation.z = 0.08;
    headGroup.add(rightBrow);

    // 3D Eyes (Dual Rigged Eyeballs with Hazel Irises & Saccades)
    const eyeSocketGroup = new THREE.Group();
    headGroup.add(eyeSocketGroup);

    const createEye = (x: number) => {
      const eyeRig = new THREE.Group();
      eyeRig.position.set(x, 0.05, 0.255);

      // Sclera (White)
      const eyeGeo = new THREE.SphereGeometry(0.052, 24, 24);
      const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 });
      const eyeBall = new THREE.Mesh(eyeGeo, eyeMat);
      eyeRig.add(eyeBall);

      // Iris (Hazel / Warm Amber)
      const irisGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.015, 24);
      const irisMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.2, metalness: 0.1 });
      const irisMesh = new THREE.Mesh(irisGeo, irisMat);
      irisMesh.position.set(0, 0, 0.048);
      irisMesh.rotation.x = Math.PI / 2;
      eyeRig.add(irisMesh);

      // Pupil
      const pupilGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.016, 16);
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x050505 });
      const pupilMesh = new THREE.Mesh(pupilGeo, pupilMat);
      pupilMesh.position.set(0, 0, 0.049);
      pupilMesh.rotation.x = Math.PI / 2;
      eyeRig.add(pupilMesh);

      // Eyelids (Upper and Lower for realistic Blinking)
      const lidGeo = new THREE.SphereGeometry(0.056, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
      const upperLid = new THREE.Mesh(lidGeo, skinMaterial);
      upperLid.position.set(0, 0.005, 0);
      upperLid.rotation.x = -Math.PI / 2;
      eyeRig.add(upperLid);

      return { eyeRig, upperLid };
    };

    const leftEye = createEye(-0.13);
    const rightEye = createEye(0.13);
    eyeSocketGroup.add(leftEye.eyeRig);
    eyeSocketGroup.add(rightEye.eyeRig);

    // Sculpted Nose
    const noseGeo = new THREE.ConeGeometry(0.04, 0.14, 12);
    const noseMesh = new THREE.Mesh(noseGeo, skinMaterial);
    noseMesh.position.set(0, -0.015, 0.32);
    noseMesh.rotation.x = -0.3;
    headGroup.add(noseMesh);

    // --- Dynamic 3D Mouth & Lip-Sync Morph Targets ---
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.16, 0.275);
    headGroup.add(mouthGroup);

    // Upper Lip
    const lipMat = new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.45 });
    const upperLipGeo = new THREE.BoxGeometry(0.15, 0.024, 0.03);
    const upperLipMesh = new THREE.Mesh(upperLipGeo, lipMat);
    upperLipMesh.position.set(0, 0.015, 0);
    mouthGroup.add(upperLipMesh);

    // Lower Lip (Dynamic Morph)
    const lowerLipGeo = new THREE.BoxGeometry(0.15, 0.024, 0.03);
    const lowerLipMesh = new THREE.Mesh(lowerLipGeo, lipMat);
    lowerLipMesh.position.set(0, -0.015, 0);
    mouthGroup.add(lowerLipMesh);

    // Inner Mouth Cavity
    const cavityGeo = new THREE.BoxGeometry(0.13, 0.05, 0.05);
    const cavityMat = new THREE.MeshBasicMaterial({ color: 0x270707 });
    const cavityMesh = new THREE.Mesh(cavityGeo, cavityMat);
    cavityMesh.position.set(0, 0, -0.02);
    mouthGroup.add(cavityMesh);

    // Teeth Arch (Upper)
    const teethGeo = new THREE.BoxGeometry(0.11, 0.02, 0.02);
    const teethMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.1 });
    const teethMesh = new THREE.Mesh(teethGeo, teethMat);
    teethMesh.position.set(0, 0.01, -0.01);
    mouthGroup.add(teethMesh);

    // --- 4. Volumetric AI Holographic Ring (Thinking State) ---
    const haloGeo = new THREE.TorusGeometry(0.48, 0.014, 16, 64);
    const haloMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, transparent: true, opacity: 0.0 });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    haloMesh.position.set(0, 0.25, 0);
    haloMesh.rotation.x = Math.PI / 2;
    avatarGroup.add(haloMesh);

    // --- 5. Animation Loop & Physics State Machine ---
    let clock = new THREE.Clock();
    let isRunning = true;
    let blinkTimer = 2.5;
    let isBlinking = false;
    let blinkProgress = 0;
    let nodOffset = 0;

    const animate = () => {
      if (!isRunning) return;
      requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const t = clock.getElapsedTime();

      // Update Lip Sync Controller
      const mouthState = lipSyncRef.current.update();

      // 1. Natural Sinusoidal Breathing
      const breathing = Math.sin(t * 1.6) * 0.012;
      torsoGroup.position.y = breathing;
      torsoGroup.scale.x = 1.0 + Math.sin(t * 1.6) * 0.008;

      // 2. State-Driven Head Kinematics
      let targetHeadRotX = 0;
      let targetHeadRotY = 0;
      let targetHeadRotZ = 0;

      if (state === 'TALKING') {
        // Natural speech head gestures
        targetHeadRotX = Math.sin(t * 4.5) * 0.045 + Math.sin(t * 1.8) * 0.02;
        targetHeadRotY = Math.cos(t * 2.2) * 0.06;
        targetHeadRotZ = Math.sin(t * 2.0) * 0.02;
        stateLight.color.setHex(0x3b82f6); // Blue
        stateLight.intensity = 1.5;
        haloMat.opacity = 0.0;
      } else if (state === 'LISTENING') {
        // Attentive forward nod reacting to candidate audio amplitude
        if (audioLevel > 0.1) {
          nodOffset = Math.sin(t * 6.0) * 0.06 * Math.min(1.0, audioLevel * 2.0);
        } else {
          nodOffset *= 0.92;
        }
        targetHeadRotX = 0.06 + nodOffset;
        targetHeadRotY = Math.sin(t * 0.8) * 0.03;
        targetHeadRotZ = -0.02;
        stateLight.color.setHex(0x10b981); // Emerald
        stateLight.intensity = 1.6;
        haloMat.opacity = 0.0;
      } else if (state === 'THINKING' || state === 'PROCESSING') {
        // Contemplative upward gaze and head tilt
        targetHeadRotX = -0.08;
        targetHeadRotY = 0.08;
        targetHeadRotZ = 0.04;
        stateLight.color.setHex(0xa855f7); // Purple
        stateLight.intensity = 2.0;

        // Rotating pulsating hologram
        haloMat.opacity = THREE.MathUtils.lerp(haloMat.opacity, 0.75 + Math.sin(t * 4) * 0.2, 0.1);
        haloMesh.rotation.z = t * 1.5;
        haloMesh.scale.setScalar(1.0 + Math.sin(t * 3.5) * 0.06);
      } else {
        // IDLE
        targetHeadRotX = Math.sin(t * 0.9) * 0.015;
        targetHeadRotY = Math.cos(t * 0.7) * 0.02;
        targetHeadRotZ = 0;
        stateLight.color.setHex(0x64748b);
        stateLight.intensity = 0.6;
        haloMat.opacity = 0.0;
      }

      // Smooth Head Slerp Interpolation
      headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, targetHeadRotX, 0.1);
      headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetHeadRotY, 0.1);
      headGroup.rotation.z = THREE.MathUtils.lerp(headGroup.rotation.z, targetHeadRotZ, 0.1);

      // 3. Saccadic Eye Movements & Gaze Tracking
      let eyeGazeX = 0;
      let eyeGazeY = 0;
      if (state === 'THINKING' || state === 'PROCESSING') {
        eyeGazeY = -0.15; // Look up
        eyeGazeX = 0.1;
      } else if (state === 'TALKING') {
        eyeGazeX = Math.sin(t * 2.5) * 0.06;
      }

      leftEye.eyeRig.rotation.y = THREE.MathUtils.lerp(leftEye.eyeRig.rotation.y, eyeGazeX, 0.15);
      leftEye.eyeRig.rotation.x = THREE.MathUtils.lerp(leftEye.eyeRig.rotation.x, eyeGazeY, 0.15);
      rightEye.eyeRig.rotation.y = THREE.MathUtils.lerp(rightEye.eyeRig.rotation.y, eyeGazeX, 0.15);
      rightEye.eyeRig.rotation.x = THREE.MathUtils.lerp(rightEye.eyeRig.rotation.x, eyeGazeY, 0.15);

      // 4. Natural Blinking Cycle
      if (!isBlinking && t > blinkTimer) {
        isBlinking = true;
        blinkProgress = 0;
      }
      if (isBlinking) {
        blinkProgress += delta * 12.0;
        if (blinkProgress >= Math.PI) {
          isBlinking = false;
          blinkProgress = 0;
          blinkTimer = t + 2.5 + Math.random() * 3.5;
        }
        const blinkAmount = Math.sin(blinkProgress);
        leftEye.upperLid.rotation.x = -Math.PI / 2 + blinkAmount * (Math.PI / 2);
        rightEye.upperLid.rotation.x = -Math.PI / 2 + blinkAmount * (Math.PI / 2);
      } else {
        leftEye.upperLid.rotation.x = -Math.PI / 2;
        rightEye.upperLid.rotation.x = -Math.PI / 2;
      }

      // 5. 3D Lip-Sync Viseme Morphing
      const openAmount = mouthState.openHeight * 0.007;
      const widthAmount = mouthState.width * 0.08;

      lowerLipMesh.position.y = THREE.MathUtils.lerp(lowerLipMesh.position.y, -0.015 - openAmount, 0.35);
      upperLipMesh.scale.x = THREE.MathUtils.lerp(upperLipMesh.scale.x, widthAmount * 12.0, 0.35);
      lowerLipMesh.scale.x = THREE.MathUtils.lerp(lowerLipMesh.scale.x, widthAmount * 12.0, 0.35);

      cavityMesh.scale.y = THREE.MathUtils.lerp(cavityMesh.scale.y, 0.2 + openAmount * 25.0, 0.35);
      cavityMesh.scale.x = THREE.MathUtils.lerp(cavityMesh.scale.x, widthAmount * 10.0, 0.35);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 480;
      const newH = container.clientHeight || 420;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isRunning = false;
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [state]);

  // State Badge info
  const getStateBadge = () => {
    switch (state) {
      case 'TALKING':
        return { label: 'Speaking', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'LISTENING':
        return { label: 'Listening to you', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'THINKING':
        return { label: 'Evaluating response...', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'PROCESSING':
        return { label: 'Generating question...', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'IDLE':
      default:
        return { label: 'Ready', color: 'bg-slate-700/40 text-slate-300 border-slate-600/40' };
    }
  };

  const badge = getStateBadge();

  if (webglError) {
    return null;
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full min-h-[380px] max-h-[420px]" />

      {/* State & Interviewer Tag Overlay */}
      <div className="absolute top-4 left-4 flex items-center space-x-2 pointer-events-none">
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${badge.color} backdrop-blur-md flex items-center gap-1.5 shadow-lg`}>
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          {badge.label}
        </span>
      </div>

      {/* 3D Realistic Badge */}
      <div className="absolute top-4 right-4 pointer-events-none">
        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-slate-950/80 border border-slate-700/80 text-brand-400 backdrop-blur-md flex items-center gap-1.5 shadow-md">
          <span className="w-2 h-2 rounded-full bg-brand-400" />
          WebGL 3D Humanoid Engine
        </span>
      </div>

      {/* Interviewer Details Card */}
      <div className="absolute bottom-3 inset-x-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 flex items-center justify-between shadow-xl pointer-events-none">
        <div>
          <h4 className="text-sm font-bold text-slate-100">{interviewerName}</h4>
          <p className="text-xs text-slate-400">{interviewerTitle}</p>
        </div>
        <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-[11px]">Active Rigged Avatar</span>
        </div>
      </div>
    </div>
  );
};
