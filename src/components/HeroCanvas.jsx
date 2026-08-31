import { useEffect, useRef } from 'react';

// یک پس‌زمینه‌ی جداگانه برای هر صفحه، مرتبط با محتوای همان صفحه — نه یک جلوه‌ی تکراری
// همه‌جا. کدام variant کجاست را همان صفحه‌ای که <HeroCanvas variant="..."/> را صدا می‌زند
// مشخص می‌کند؛ اینجا فقط منطق ساختن و برداشتنِ صحنه‌ی هر کدام است.
//
//   nebula  — ذراتِ درخشانِ طلایی/بنفش، تب مأموریت‌ها
//   warmup  — حباب‌های نرم و طلایی، فاز صفر (گرم‌کردن قبل از شروع)
//   dialogue— دو گره‌ی نبض‌دار با پیامی بینشان، گفت‌وگوی تخصصی
//   topics  — نقطه‌های نرمی که دور دو کانون می‌چرخند، ارائه‌ی فنی
//   network — نقطه‌هایی که نزدیکِ هم با خط وصل می‌شوند، تیم‌ها
//   path    — چند رگه‌ی نورِ کند و بلند، صفحه‌ی هر هفته
//   grid    — شبکه‌ی نقطه‌چینِ کم‌رنگ با موج مورب، کنسول ادمین
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
      // لبه‌ی کادر گذاشت، مستقل از نسبت تصویرِ واقعیِ کانتینر.
      function edgePosition(depthZ, xFrac, yFrac) {
        const aspect = Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1);
        const fovRad = (camera.fov * Math.PI) / 180;
        const dist = camera.position.z - depthZ;
        const halfH = dist * Math.tan(fovRad / 2);
        const halfW = halfH * aspect;
        return [xFrac * halfW, yFrac * halfH, depthZ];
      }

      // اسپرایتِ نرمِ گرد، پایه‌ی مشترکِ همه‌ی ذره‌ها.
      function makeGlowTexture() {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255,255,255,1)');
        grad.addColorStop(0.4, 'rgba(255,255,255,.55)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = grad;
        g.fillRect(0, 0, 64, 64);
        return new THREE.CanvasTexture(c);
      }
      // رگه‌ی نرمِ کشیده، برای دنباله‌ی «هفته‌ی N».
      function makeStreakTexture() {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 32;
        const g = c.getContext('2d');
        g.filter = 'blur(4px)';
        const grad = g.createLinearGradient(14, 0, 118, 0);
        grad.addColorStop(0, 'rgba(255,255,255,0)');
        grad.addColorStop(1, 'rgba(255,255,255,1)');
        g.fillStyle = grad;
        g.beginPath();
        g.ellipse(64, 16, 54, 6, 0, 0, Math.PI * 2);
        g.fill();
        return new THREE.CanvasTexture(c);
      }
      const glowTex = makeGlowTexture();

      function buildNebula() {
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
          tmp.copy(Math.random() < 0.55 ? PURPLE : Math.random() < 0.85 ? GOLD : LAV);
          colors[i * 3] = tmp.r;
          colors[i * 3 + 1] = tmp.g;
          colors[i * 3 + 2] = tmp.b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({
          size: 0.5, map: glowTex, vertexColors: true, transparent: true,
          depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85,
        });
        const points = new THREE.Points(geo, mat);
        scene.add(points);
        return {
          objects: [points], geometries: [geo], materials: [mat],
          update: (t, dt) => {
            points.rotation.y += dt * 0.05;
            points.rotation.x = Math.sin(t * 0.08) * 0.08;
          },
        };
      }

      function buildWarmup() {
        const count = 16;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const velocities = [];
        const tmp = new THREE.Color();
        for (let i = 0; i < count; i++) {
          positions[i * 3] = (Math.random() * 2 - 1) * 24;
          positions[i * 3 + 1] = (Math.random() * 2 - 1) * 14;
          positions[i * 3 + 2] = -4 - Math.random() * 20;
          tmp.copy(GOLD).lerp(PURPLE, Math.random() * 0.4);
          colors[i * 3] = tmp.r;
          colors[i * 3 + 1] = tmp.g;
          colors[i * 3 + 2] = tmp.b;
          velocities.push({ x: (Math.random() * 2 - 1) * 0.15, y: (Math.random() * 2 - 1) * 0.08 });
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({
          size: 8, map: glowTex, vertexColors: true, transparent: true,
          depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.32, sizeAttenuation: true,
        });
        const points = new THREE.Points(geo, mat);
        scene.add(points);
        return {
          objects: [points], geometries: [geo], materials: [mat],
          update: (_t, dt) => {
            const pos = geo.attributes.position;
            for (let i = 0; i < count; i++) {
              let x = pos.getX(i) + velocities[i].x * dt;
              let y = pos.getY(i) + velocities[i].y * dt;
              if (x > 28) x = -28;
              if (x < -28) x = 28;
              if (y > 17) y = -17;
              if (y < -17) y = 17;
              pos.setX(i, x);
              pos.setY(i, y);
            }
            pos.needsUpdate = true;
          },
        };
      }

      function buildDialogue() {
        const group = new THREE.Group();
        const posA = edgePosition(-14, 0.82, -0.8);
        const posB = edgePosition(-16, -0.82, -0.75);

        const matA = new THREE.SpriteMaterial({ map: glowTex, color: GOLD, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.8, depthWrite: false });
        const matB = new THREE.SpriteMaterial({ map: glowTex, color: PURPLE, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.8, depthWrite: false });
        const nodeA = new THREE.Sprite(matA);
        nodeA.position.set(...posA);
        nodeA.scale.set(3.4, 3.4, 1);
        const nodeB = new THREE.Sprite(matB);
        nodeB.position.set(...posB);
        nodeB.scale.set(3.4, 3.4, 1);
        group.add(nodeA, nodeB);

        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([...posA, ...posB]), 3));
        const lineMat = new THREE.LineBasicMaterial({ color: 0xbda2dd, transparent: true, opacity: 0.22 });
        const line = new THREE.Line(lineGeo, lineMat);
        group.add(line);

        const msgMat = new THREE.SpriteMaterial({ map: glowTex, color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, opacity: 0, depthWrite: false });
        const msg = new THREE.Sprite(msgMat);
        msg.scale.set(1, 1, 1);
        group.add(msg);
        scene.add(group);

        const cycle = 3.2;
        return {
          objects: [group], geometries: [lineGeo], materials: [matA, matB, lineMat, msgMat],
          update: (t) => {
            const breatheA = 3.2 + Math.sin(t * 1.3) * 0.35;
            const breatheB = 3.2 + Math.sin(t * 1.3 + Math.PI) * 0.35;
            nodeA.scale.set(breatheA, breatheA, 1);
            nodeB.scale.set(breatheB, breatheB, 1);
            matA.opacity = 0.65 + Math.max(0, Math.sin(t * 1.3)) * 0.3;
            matB.opacity = 0.65 + Math.max(0, Math.sin(t * 1.3 + Math.PI)) * 0.3;

            const phase = (t % cycle) / cycle;
            const forward = Math.floor(t / cycle) % 2 === 0;
            const from = forward ? posA : posB;
            const to = forward ? posB : posA;
            msg.position.set(
              from[0] + (to[0] - from[0]) * phase,
              from[1] + (to[1] - from[1]) * phase,
              from[2] + (to[2] - from[2]) * phase,
            );
            msgMat.opacity = Math.sin(phase * Math.PI) * 0.9;
          },
        };
      }

      function buildTopics() {
        const centers = [edgePosition(-18, 0.88, 0.82), edgePosition(-22, -0.9, -0.8)];
        const group = new THREE.Group();
        const nodes = [];
        centers.forEach((center) => {
          for (let i = 0; i < 3; i++) {
            const color = i % 2 === 0 ? GOLD : PURPLE;
            const mat = new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.75, depthWrite: false });
            const sprite = new THREE.Sprite(mat);
            sprite.scale.set(1.1, 1.1, 1);
            group.add(sprite);
            nodes.push({
              sprite, center, radius: 1.3 + i * 0.9,
              incline: 0.3 + i * 0.5, speed: 0.35 + Math.random() * 0.25, phase: Math.random() * Math.PI * 2,
            });
          }
        });
        scene.add(group);
        return {
          objects: [group], geometries: [], materials: nodes.map((n) => n.sprite.material),
          update: (t) => {
            nodes.forEach((n) => {
              const a = n.phase + t * n.speed;
              n.sprite.position.set(
                n.center[0] + Math.cos(a) * n.radius,
                n.center[1] + Math.sin(a) * n.radius * Math.cos(n.incline),
                n.center[2] + Math.sin(a) * n.radius * Math.sin(n.incline) * 0.6,
              );
            });
          },
        };
      }

      function buildNetwork() {
        const count = 46;
        const positions = new Float32Array(count * 3);
        const velocities = [];
        for (let i = 0; i < count; i++) {
          positions[i * 3] = (Math.random() * 2 - 1) * 26;
          positions[i * 3 + 1] = (Math.random() * 2 - 1) * 15;
          positions[i * 3 + 2] = -6 - Math.random() * 18;
          velocities.push({ x: (Math.random() * 2 - 1) * 0.28, y: (Math.random() * 2 - 1) * 0.15 });
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const mat = new THREE.PointsMaterial({ size: 0.26, color: 0xffe3ad, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
        const points = new THREE.Points(geo, mat);
        scene.add(points);

        const maxLines = count * 3;
        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxLines * 2 * 3), 3));
        lineGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(maxLines * 2 * 3), 3));
        const lineMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false });
        const lines = new THREE.LineSegments(lineGeo, lineMat);
        scene.add(lines);

        const edgeColor = new THREE.Color().copy(PURPLE).lerp(GOLD, 0.5);
        const threshold = 7;
        function rebuildLines() {
          const pos = geo.attributes.position;
          const lp = lineGeo.attributes.position;
          const lc = lineGeo.attributes.color;
          let seg = 0;
          for (let i = 0; i < count && seg < maxLines; i++) {
            for (let j = i + 1; j < count && seg < maxLines; j++) {
              const dx = pos.getX(i) - pos.getX(j);
              const dy = pos.getY(i) - pos.getY(j);
              const dz = pos.getZ(i) - pos.getZ(j);
              const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (d < threshold) {
                const a = seg * 2;
                lp.setXYZ(a, pos.getX(i), pos.getY(i), pos.getZ(i));
                lp.setXYZ(a + 1, pos.getX(j), pos.getY(j), pos.getZ(j));
                const alpha = 1 - d / threshold;
                lc.setXYZ(a, edgeColor.r * alpha, edgeColor.g * alpha, edgeColor.b * alpha);
                lc.setXYZ(a + 1, edgeColor.r * alpha, edgeColor.g * alpha, edgeColor.b * alpha);
                seg++;
              }
            }
          }
          lineGeo.setDrawRange(0, seg * 2);
          lp.needsUpdate = true;
          lc.needsUpdate = true;
        }
        rebuildLines();

        let frame = 0;
        return {
          objects: [points, lines], geometries: [geo, lineGeo], materials: [mat, lineMat],
          update: (_t, dt) => {
            const pos = geo.attributes.position;
            for (let i = 0; i < count; i++) {
              let x = pos.getX(i) + velocities[i].x * dt;
              let y = pos.getY(i) + velocities[i].y * dt;
              if (x > 28) x = -28;
              if (x < -28) x = 28;
              if (y > 17) y = -17;
              if (y < -17) y = 17;
              pos.setX(i, x);
              pos.setY(i, y);
            }
            pos.needsUpdate = true;
            frame++;
            if (frame % 3 === 0) rebuildLines();
          },
        };
      }

      function buildPath() {
        const streakTex = makeStreakTexture();
        const count = 3;
        const group = new THREE.Group();
        const comets = [];
        function place(sprite, fromEdge) {
          sprite.position.set(fromEdge ? -32 : Math.random() * 50 - 25, (Math.random() * 2 - 1) * 13, -6 - Math.random() * 14);
        }
        for (let i = 0; i < count; i++) {
          const angle = -0.16 - Math.random() * 0.1;
          const speed = 1.6 + Math.random() * 1.1;
          const mat = new THREE.SpriteMaterial({ map: streakTex, color: GOLD, transparent: true, blending: THREE.AdditiveBlending, opacity: 0.55, depthWrite: false });
          mat.rotation = angle;
          const sprite = new THREE.Sprite(mat);
          const len = 9 + i * 2.5;
          sprite.scale.set(len, len * 0.11, 1);
          place(sprite, false);
          sprite.userData.vx = Math.cos(angle) * speed;
          sprite.userData.vy = Math.sin(angle) * speed;
          group.add(sprite);
          comets.push(sprite);
        }
        scene.add(group);
        return {
          objects: [group], geometries: [], materials: comets.map((s) => s.material), textures: [streakTex],
          update: (_t, dt) => {
            comets.forEach((s) => {
              s.position.x += s.userData.vx * dt;
              s.position.y += s.userData.vy * dt;
              if (s.position.x > 34 || s.position.y < -18) place(s, true);
            });
          },
        };
      }

      function buildGrid() {
        const cols = 13;
        const rows = 8;
        const count = cols * rows;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const base = new THREE.Color(0x83679f);
        const spacingX = 4.4;
        const spacingY = 4.0;
        const originX = (-(cols - 1) * spacingX) / 2;
        const originY = (-(rows - 1) * spacingY) / 2;
        const grid = [];
        let idx = 0;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            positions[idx * 3] = originX + c * spacingX;
            positions[idx * 3 + 1] = originY + r * spacingY;
            positions[idx * 3 + 2] = -20;
            colors[idx * 3] = base.r;
            colors[idx * 3 + 1] = base.g;
            colors[idx * 3 + 2] = base.b;
            grid.push({ c, r });
            idx++;
          }
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        const mat = new THREE.PointsMaterial({ size: 0.5, map: glowTex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.42 });
        const points = new THREE.Points(geo, mat);
        scene.add(points);

        const tmp = new THREE.Color();
        function updateWave(t) {
          const col = geo.attributes.color;
          for (let i = 0; i < count; i++) {
            const g = grid[i];
            const wave = Math.sin((g.c + g.r) * 0.5 - t * 1.1);
            const bright = 0.3 + Math.max(0, wave) * 0.7;
            tmp.copy(base).lerp(GOLD, Math.max(0, wave) * 0.45);
            col.setXYZ(i, tmp.r * bright, tmp.g * bright, tmp.b * bright);
          }
          col.needsUpdate = true;
        }
        updateWave(0);
        return {
          objects: [points], geometries: [geo], materials: [mat],
          update: (t) => updateWave(t * 0.5),
        };
      }

      const BUILDERS = {
        nebula: buildNebula,
        warmup: buildWarmup,
        dialogue: buildDialogue,
        topics: buildTopics,
        network: buildNetwork,
        path: buildPath,
        grid: buildGrid,
      };
      const scenePieces = (BUILDERS[variant] || buildNebula)();
      const { objects: sceneObjects, geometries, materials, textures = [], update: onFrame } = scenePieces;
      textures.push(glowTex);

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
