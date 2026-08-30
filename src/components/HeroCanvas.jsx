import { useEffect, useRef } from 'react';

// سه پس‌زمینه‌ی متفاوت برای هیروها، تا همه‌جای سایت یک شکل نباشد:
//   nebula — ذراتِ درخشانِ طلایی/بنفش، فقط برای تب مأموریت‌ها
//   aurora — نوارِ موج‌دارِ گرادیانی، برای فاز صفر (اولین صفحه‌ای که دیده می‌شود)
//   orbit  — چند جسمِ توری‌ایِ کم‌رنگ که آرام می‌چرخند، برای بقیه‌ی صفحه‌ها
//
// three.js فقط وقتی این کامپوننت مونت می‌شود دانلود می‌شود (dynamic import) تا باندلِ
// اصلی سنگین‌تر نشود. اگر کاربر motion کم می‌خواهد، فقط یک فریمِ ثابت رندر می‌شود.
export default function HeroCanvas({ variant = 'nebula' }) {
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

      // نیمه‌ارتفاع/نیمه‌عرضِ دیدِ دوربین در یک عمقِ مشخص — تا بشود جسمی را دقیقاً روی
      // لبه‌ی کادر گذاشت، مستقل از نسبت تصویرِ واقعیِ کانتینر (که فقط بعد از mount معلوم است).
      const aspect = Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1);
      const fovRad = (camera.fov * Math.PI) / 180;
      function edgePosition(depthZ, xFrac, yFrac) {
        const dist = camera.position.z - depthZ;
        const halfH = dist * Math.tan(fovRad / 2);
        const halfW = halfH * aspect;
        return [xFrac * halfW, yFrac * halfH, depthZ];
      }

      const sceneObjects = [];
      const geometries = [];
      const materials = [];
      const textures = [];
      let onFrame = () => {};

      if (variant === 'aurora') {
        const geo = new THREE.PlaneGeometry(46, 26, 70, 40);
        const count = geo.attributes.position.count;
        geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
        const mat = new THREE.MeshBasicMaterial({
          vertexColors: true, transparent: true, opacity: 0.5,
          side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.rotation.x = -1.2;
        // پایین‌تر و دورتر از پایینِ متن، تا موج زیر تگ‌لاین بماند نه رویش.
        mesh.position.set(0, -10, -10);
        scene.add(mesh);
        sceneObjects.push(mesh);
        geometries.push(geo);
        materials.push(mat);

        const tmp = new THREE.Color();
        const updateWave = (t) => {
          const pos = geo.attributes.position;
          const col = geo.attributes.color;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i), y = pos.getY(i);
            const z = Math.sin(x * 0.18 + t) * 2.2 * Math.cos(y * 0.22 - t * 0.6) + Math.sin(y * 0.3 + t * 1.3) * 1.1;
            pos.setZ(i, z);
            const h = (z + 3.3) / 6.6;
            tmp.copy(PURPLE).lerp(GOLD, Math.max(0, Math.min(1, h)));
            col.setXYZ(i, tmp.r, tmp.g, tmp.b);
          }
          pos.needsUpdate = true;
          col.needsUpdate = true;
        };
        updateWave(0);
        onFrame = (t) => updateWave(t * 0.6);
      } else if (variant === 'orbit') {
        // دور و کم‌رنگ، درست روی لبه‌ی کادر — این پس‌زمینه‌ی صفحاتیه که خودِ متن مهم‌تره، نه جلوه.
        const group = new THREE.Group();
        const specs = [
          { geo: new THREE.IcosahedronGeometry(2.2, 0), color: GOLD, pos: edgePosition(-22, 0.92, 0.85), speed: [0.15, 0.22] },
          { geo: new THREE.OctahedronGeometry(1.6, 0), color: PURPLE, pos: edgePosition(-18, -0.95, -0.88), speed: [0.2, -0.18] },
          { geo: new THREE.TorusKnotGeometry(1.1, 0.28, 90, 12), color: LAV, pos: edgePosition(-26, 0.9, -0.9), speed: [-0.12, 0.16] },
          { geo: new THREE.IcosahedronGeometry(1.2, 1), color: GOLD, pos: edgePosition(-24, -0.93, 0.88), speed: [0.24, 0.1] },
        ];
        const meshes = specs.map((s) => {
          const mat = new THREE.MeshBasicMaterial({ color: s.color, wireframe: true, transparent: true, opacity: 0.32 });
          const mesh = new THREE.Mesh(s.geo, mat);
          mesh.position.set(s.pos[0], s.pos[1], s.pos[2]);
          group.add(mesh);
          geometries.push(s.geo);
          materials.push(mat);
          return { mesh, speed: s.speed };
        });
        scene.add(group);
        sceneObjects.push(group);

        onFrame = (_t, dt) => {
          group.rotation.y += dt * 0.03;
          meshes.forEach((m) => {
            m.mesh.rotation.x += dt * m.speed[0] * 0.3;
            m.mesh.rotation.y += dt * m.speed[1] * 0.3;
          });
        };
      } else {
        // اسپرایتِ نرمِ گرد، یک‌بار روی کانواسِ آفلاین کشیده می‌شود و به همه‌ی ذره‌ها می‌خورد.
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
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({
          size: 0.5, map: spriteTex, vertexColors: true, transparent: true,
          depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85,
        });
        const points = new THREE.Points(geo, mat);
        scene.add(points);
        sceneObjects.push(points);
        geometries.push(geo);
        materials.push(mat);
        textures.push(spriteTex);

        onFrame = (t, dt) => {
          points.rotation.y += dt * 0.05;
          points.rotation.x = Math.sin(t * 0.08) * 0.08;
        };
      }

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
          onFrame(t, dt);
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
        sceneObjects.forEach((o) => scene.remove(o));
        geometries.forEach((g) => g.dispose());
        materials.forEach((m) => m.dispose());
        textures.forEach((tx) => tx.dispose());
        renderer.dispose();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [variant]);

  return <canvas className="hero-canvas" ref={canvasRef} aria-hidden="true" />;
}
