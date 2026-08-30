import { useEffect, useRef } from 'react';

// پس‌زمینه‌ی ذره‌ایِ هر هیرو — three.js فقط وقتی این کامپوننت مونت می‌شود دانلود می‌شود
// (dynamic import) تا باندلِ اصلی سنگین‌تر نشود. اگر کاربر motion کم می‌خواهد یا مرورگر
// WebGL ندارد، فقط یک فریمِ ثابت رندر می‌شود، نه انیمیشن.
export default function HeroNebula() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    let disposed = false;
    let cleanup = () => {};

    import('three').then((THREE) => {
      if (disposed) return;

      const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
      camera.position.z = 20;

      const GOLD = new THREE.Color(0xf5a623);
      const PURPLE = new THREE.Color(0x8a34c0);
      const LAV = new THREE.Color(0xbda2dd);

      // یک اسپرایتِ نرمِ گرد، یک‌بار روی کانواسِ آفلاین کشیده می‌شود و به همه‌ی ذره‌ها می‌خورد.
      const spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = spriteCanvas.height = 64;
      const sctx = spriteCanvas.getContext('2d');
      const grad = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.4, 'rgba(255,255,255,.55)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      sctx.fillStyle = grad;
      sctx.fillRect(0, 0, 64, 64);
      const spriteTex = new THREE.CanvasTexture(spriteCanvas);

      const count = 2000;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      const tmp = new THREE.Color();
      for (let i = 0; i < count; i++) {
        const r = 8 + Math.random() * 22;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.6;
        positions[i * 3 + 2] = r * Math.cos(phi) - 10;
        const mixVal = Math.random();
        tmp.copy(mixVal < 0.55 ? PURPLE : mixVal < 0.85 ? GOLD : LAV);
        colors[i * 3] = tmp.r;
        colors[i * 3 + 1] = tmp.g;
        colors[i * 3 + 2] = tmp.b;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      const material = new THREE.PointsMaterial({
        size: 0.5,
        map: spriteTex,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.85,
      });
      const points = new THREE.Points(geometry, material);
      scene.add(points);

      const resize = () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (w === 0 || h === 0) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      resize();
      const ro = new ResizeObserver(resize);
      ro.observe(container);

      const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
      let motionOn = !mql.matches;
      const onMotionChange = (e) => {
        motionOn = !e.matches;
        if (motionOn) startLoop();
        else renderer.render(scene, camera);
      };
      mql.addEventListener('change', onMotionChange);

      let tabHidden = false;
      const onVisibility = () => {
        tabHidden = document.hidden;
      };
      document.addEventListener('visibilitychange', onVisibility);

      const clock = new THREE.Clock();
      let rafId = null;
      const frame = () => {
        const dt = clock.getDelta();
        const t = clock.elapsedTime;
        if (!tabHidden) {
          points.rotation.y += dt * 0.05;
          points.rotation.x = Math.sin(t * 0.08) * 0.08;
          renderer.render(scene, camera);
        }
        rafId = requestAnimationFrame(frame);
      };
      const startLoop = () => {
        if (rafId == null) rafId = requestAnimationFrame(frame);
      };

      if (motionOn) startLoop();
      else renderer.render(scene, camera);

      cleanup = () => {
        if (rafId != null) cancelAnimationFrame(rafId);
        ro.disconnect();
        mql.removeEventListener('change', onMotionChange);
        document.removeEventListener('visibilitychange', onVisibility);
        geometry.dispose();
        material.dispose();
        spriteTex.dispose();
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas className="hero-nebula" ref={canvasRef} aria-hidden="true" />;
}
