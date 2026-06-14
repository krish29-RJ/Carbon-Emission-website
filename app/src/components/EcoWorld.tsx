import { useEffect, useRef, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, Info, Zap, Car, ShieldAlert } from 'lucide-react';

interface EcoWorldProps {
  total?: number;
  transport?: number;
  energy?: number;
  food?: number;
  lifestyle?: number;
  renewable?: boolean;
  interactive?: boolean;
}

const EcoWorld = memo(function EcoWorld({
  total = 600,
  transport = 150,
  energy = 200,
  food = 150,
  lifestyle = 100,
  renewable = false,
  interactive = true
}: EcoWorldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; content: string; icon: any } | null>(null);

  // Determine levels
  const isLow = total < 500;
  const isHigh = total > 1000;

  // Interactive areas check
  const checkClick = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !interactive) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Check click regions (approximate boundaries in 2D space)
    // Factory/Energy: Left-ish quadrant of the island
    if (x > centerX - 140 && x < centerX - 40 && y > centerY - 80 && y < centerY + 20) {
      setTooltip({
        x: clientX - rect.left,
        y: clientY - rect.top - 80,
        title: 'Energy & Lifestyle Industry',
        content: energy > 250 || lifestyle > 180 
          ? `Current output: ${energy + lifestyle} kg CO2e. Smog levels are high. Switch to renewable energy or reduce online delivery frequency to clear the air!`
          : `Eco-optimized: ${energy + lifestyle} kg CO2e. Energy grids are running clean and waste is minimal!`,
        icon: Zap
      });
      return;
    }
    // Forest/Food: Right-ish quadrant of the island
    if (x > centerX + 40 && x < centerX + 140 && y > centerY - 80 && y < centerY + 20) {
      setTooltip({
        x: clientX - rect.left,
        y: clientY - rect.top - 80,
        title: 'Agricultural Zone',
        content: food > 200 
          ? `High food impact: ${food} kg CO2e. The soil is dry and dead tree stumps have appeared. Consider a vegetarian or vegan diet to restore the lush forest.`
          : `Lush ecosystem: ${food} kg CO2e. Rich, healthy green canopy supported by low-carbon food choices!`,
        icon: Leaf
      });
      return;
    }
    // Roads/Transport: Center/bottom-ish quadrant of the island
    if (x > centerX - 80 && x < centerX + 80 && y > centerY + 10 && y < centerY + 90) {
      setTooltip({
        x: clientX - rect.left,
        y: clientY - rect.top - 80,
        title: 'Transit Corridor',
        content: transport > 180
          ? `Transit emissions: ${transport} kg CO2e. Streets are clogged with high-emission gasoline cars. Shift to cycling or train transport.`
          : `Green transit: ${transport} kg CO2e. Electric transit lines and bike paths are keeping commuter emissions minimal!`,
        icon: Car
      });
      return;
    }
    // Sky/Smog: Above the island
    if (y < centerY - 80) {
      setTooltip({
        x: clientX - rect.left,
        y: clientY - rect.top - 80,
        title: 'Atmospheric Quality',
        content: isHigh 
          ? `Smog Warning: Your total footprint is ${total} kg CO2e. The sky is dark and greenhouse gases are building up.`
          : isLow 
            ? `Clear Skies: Excellent total footprint of ${total} kg CO2e. The atmosphere is crisp and solar potential is maxed out!`
            : `Hazy Air: Moderate footprint of ${total} kg CO2e. Sky visibility is average. Some minor actions can clear it up.`,
        icon: ShieldAlert
      });
      return;
    }
    setTooltip(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Factory smoke particles
    const particles: {x: number; y: number; vx: number; vy: number; r: number; alpha: number; maxLife: number; life: number}[] = [];
    // Flying birds
    const birds: {x: number; y: number; speed: number; size: number; offset: number}[] = [
      { x: -50, y: 80, speed: 1.2, size: 6, offset: 0 },
      { x: -90, y: 110, speed: 1.0, size: 5, offset: 2 },
      { x: -130, y: 95, speed: 1.1, size: 5.5, offset: 4 }
    ];
    // Falling leaves / petals
    const leaves: {x: number; y: number; r: number; speedX: number; speedY: number; angle: number; rotSpeed: number}[] = [];
    if (isLow) {
      for (let i = 0; i < 15; i++) {
        leaves.push({
          x: Math.random() * 400 + 100,
          y: Math.random() * 200,
          r: Math.random() * 3 + 2,
          speedX: Math.random() * 0.5 - 0.2,
          speedY: Math.random() * 0.8 + 0.4,
          angle: Math.random() * Math.PI,
          rotSpeed: Math.random() * 0.02 - 0.01
        });
      }
    }

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = containerRef.current?.clientWidth || 600;
      const height = 360;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const render = () => {
      time += 0.025;
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. SKY GRADIENT (Emotional Atmosphere)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      if (isHigh) {
        // High Carbon = Smoggy Gray/Yellow
        skyGrad.addColorStop(0, '#111827');
        skyGrad.addColorStop(0.5, '#374151');
        skyGrad.addColorStop(1, '#4B5563');
      } else if (isLow) {
        // Low Carbon = Beautiful Electric Teal/Cyan/Green Glow
        skyGrad.addColorStop(0, '#042f2e');
        skyGrad.addColorStop(0.5, '#065f46');
        skyGrad.addColorStop(1, '#022c22');
      } else {
        // Moderate Carbon = Deep Space Navy/Orange Haze
        skyGrad.addColorStop(0, '#0f172a');
        skyGrad.addColorStop(0.6, '#1e1b4b');
        skyGrad.addColorStop(1, '#2e1065');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Background stars / pollution particles
      ctx.fillStyle = isLow ? 'rgba(255,255,255,0.25)' : 'rgba(239,68,68,0.08)';
      for (let i = 0; i < 20; i++) {
        const sx = (Math.sin(i * 99 + time * 0.1) * 0.5 + 0.5) * width;
        const sy = (Math.cos(i * 33) * 0.5 + 0.5) * (height - 120);
        ctx.beginPath();
        ctx.arc(sx, sy, isLow ? 1 : 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw floating island bounce
      const bounce = Math.sin(time) * 4;
      const islandY = centerY + bounce + 20;

      // 2. ISOMETRIC BASE LANDSCAPE
      // Drawing isometric diamond
      const drawIsoBlock = (cx: number, cy: number, w: number, h: number, depth: number, colorTop: string, colorLeft: string, colorRight: string) => {
        // Top Face
        ctx.fillStyle = colorTop;
        ctx.beginPath();
        ctx.moveTo(cx, cy - h / 2);
        ctx.lineTo(cx + w / 2, cy);
        ctx.lineTo(cx, cy + h / 2);
        ctx.lineTo(cx - w / 2, cy);
        ctx.closePath();
        ctx.fill();

        // Left Face
        ctx.fillStyle = colorLeft;
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, cy);
        ctx.lineTo(cx, cy + h / 2);
        ctx.lineTo(cx, cy + h / 2 + depth);
        ctx.lineTo(cx - w / 2, cy + depth);
        ctx.closePath();
        ctx.fill();

        // Right Face
        ctx.fillStyle = colorRight;
        ctx.beginPath();
        ctx.moveTo(cx + w / 2, cy);
        ctx.lineTo(cx, cy + h / 2);
        ctx.lineTo(cx, cy + h / 2 + depth);
        ctx.lineTo(cx + w / 2, cy + depth);
        ctx.closePath();
        ctx.fill();
      };

      // Base colors depending on level
      const landColorTop = isHigh ? '#374151' : isLow ? '#047857' : '#1e3a8a';
      const landColorLeft = isHigh ? '#1f2937' : isLow ? '#065f46' : '#172554';
      const landColorRight = isHigh ? '#111827' : isLow ? '#064e3b' : '#0f172a';

      // Draw main island
      drawIsoBlock(centerX, islandY, 320, 160, 45, landColorTop, landColorLeft, landColorRight);

      // Drawing a secondary grid texture on the top of the island
      ctx.strokeStyle = isLow ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) {
        // Lines parallel to top-left to bottom-right
        ctx.beginPath();
        ctx.moveTo(centerX + i * 32, islandY - 80 + Math.abs(i) * 16);
        ctx.lineTo(centerX - 160 + i * 32, islandY + Math.abs(i) * 16);
        ctx.stroke();

        // Lines parallel to top-right to bottom-left
        ctx.beginPath();
        ctx.moveTo(centerX + i * 32, islandY - 80 + Math.abs(i) * 16);
        ctx.lineTo(centerX + 160 + i * 32, islandY + Math.abs(i) * 16);
        ctx.stroke();
      }

      // 3. FACTORY / ENERGY SYSTEM (Left Quadrant)
      // High carbon = active factory smoke. Low carbon = solar panels / clean grid
      const drawSolarPanel = (x: number, y: number) => {
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x + 15, y - 2);
        ctx.lineTo(x + 5, y + 6);
        ctx.lineTo(x - 10, y - 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      };

      const drawFactory = (x: number, y: number) => {
        // Main block
        ctx.fillStyle = '#475569';
        ctx.fillRect(x - 15, y - 20, 30, 25);
        // Roof lines (sawtooth)
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.moveTo(x - 15, y - 20);
        ctx.lineTo(x - 5, y - 28);
        ctx.lineTo(x - 5, y - 20);
        ctx.lineTo(x + 5, y - 28);
        ctx.lineTo(x + 5, y - 20);
        ctx.lineTo(x + 15, y - 20);
        ctx.closePath();
        ctx.fill();

        // Chimney stack
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(x + 5, y - 40, 8, 20);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(x + 5, y - 43, 8, 3); // Red tip
      };

      if (isLow) {
        // Solar panels & glowing grid lines
        drawSolarPanel(centerX - 80, islandY - 20);
        drawSolarPanel(centerX - 105, islandY - 10);
      } else {
        // Factory puffing smoke
        drawFactory(centerX - 90, islandY - 20);
        
        // Spawn smoke particles
        if (Math.random() < (isHigh ? 0.25 : 0.08)) {
          particles.push({
            x: centerX - 81,
            y: islandY - 63,
            vx: Math.random() * 0.4 - 0.7,
            vy: Math.random() * 0.4 - 0.9,
            r: Math.random() * 3 + 2,
            alpha: 0.8,
            maxLife: Math.random() * 40 + 30,
            life: 0
          });
        }
      }

      // Render & update smoke particles
      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.r += 0.15;
        p.life++;
        p.alpha = 1 - (p.life / p.maxLife);

        ctx.fillStyle = isHigh 
          ? `rgba(100, 116, 139, ${p.alpha * 0.6})`  // Dark heavy smog
          : `rgba(203, 213, 225, ${p.alpha * 0.4})`; // Lighter puff
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        if (p.life >= p.maxLife) {
          particles.splice(idx, 1);
        }
      });

      // 4. AGRICULTURAL ZONE / FOREST (Right Quadrant)
      // High food emissions = dead stumps. Low food emissions = lush pine trees.
      const drawTree = (cx: number, cy: number, heightVal: number) => {
        // Trunk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 2, cy - heightVal * 0.3, 4, heightVal * 0.3);

        // Canopy
        ctx.fillStyle = isLow ? '#10b981' : '#047857';
        ctx.beginPath();
        ctx.moveTo(cx, cy - heightVal);
        ctx.lineTo(cx - 12, cy - heightVal * 0.25);
        ctx.lineTo(cx + 12, cy - heightVal * 0.25);
        ctx.closePath();
        ctx.fill();

        // Layer 2
        ctx.fillStyle = isLow ? '#34d399' : '#059669';
        ctx.beginPath();
        ctx.moveTo(cx, cy - heightVal * 1.3);
        ctx.lineTo(cx - 9, cy - heightVal * 0.6);
        ctx.lineTo(cx + 9, cy - heightVal * 0.6);
        ctx.closePath();
        ctx.fill();
      };

      const drawDeadStump = (cx: number, cy: number) => {
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.moveTo(cx - 5, cy);
        ctx.lineTo(cx - 3, cy - 8);
        ctx.lineTo(cx + 3, cy - 8);
        ctx.lineTo(cx + 5, cy);
        ctx.closePath();
        ctx.fill();

        // Split detail
        ctx.strokeStyle = '#1a0c02';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 8);
        ctx.lineTo(cx - 2, cy - 2);
        ctx.stroke();
      };

      if (isHigh) {
        // Dead stumps
        drawDeadStump(centerX + 80, islandY - 30);
        drawDeadStump(centerX + 105, islandY - 20);
        drawDeadStump(centerX + 95, islandY - 10);
      } else {
        // Lush forest
        const treeDensity = isLow ? 6 : 3;
        const positions = [
          { x: 80, y: -30, h: 25 },
          { x: 105, y: -20, h: 30 },
          { x: 90, y: -10, h: 22 },
          { x: 120, y: -35, h: 28 },
          { x: 70, y: -15, h: 26 },
          { x: 110, y: -5, h: 24 }
        ];

        for (let i = 0; i < treeDensity; i++) {
          const pos = positions[i];
          drawTree(centerX + pos.x, islandY + pos.y, pos.h);
        }
      }

      // 5. COMMUTE & TRANSIT CORRIDOR (Center/Bottom Quadrant)
      // High carbon = gasoline cars emitting smoke. Low carbon = Electric high-speed train or bike lanes.
      const drawRoad = () => {
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.moveTo(centerX - 100, islandY + 50);
        ctx.lineTo(centerX + 100, islandY - 50);
        ctx.stroke();

        // Lane markers
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(centerX - 100, islandY + 50);
        ctx.lineTo(centerX + 100, islandY - 50);
        ctx.stroke();
        ctx.setLineDash([]); // Reset
      };

      const drawTrainTrack = () => {
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(centerX - 100, islandY + 50);
        ctx.lineTo(centerX + 100, islandY - 50);
        ctx.stroke();

        // Sleepers
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        for (let i = -10; i <= 10; i++) {
          const tx = centerX + i * 10;
          const ty = islandY - i * 5;
          ctx.beginPath();
          ctx.moveTo(tx - 3, ty - 3);
          ctx.lineTo(tx + 3, ty + 3);
          ctx.stroke();
        }
      };

      if (isLow) {
        drawTrainTrack();
        // Render futuristic electric high-speed train
        const trainPos = (time * 15) % 360 - 180; // Animation loops
        const tx = centerX + trainPos;
        const ty = islandY - (trainPos * 0.5) - 4; // Floating offset above track
        
        if (tx > centerX - 100 && tx < centerX + 100) {
          // Train body
          ctx.fillStyle = '#06b6d4'; // Glowing Teal
          ctx.beginPath();
          ctx.moveTo(tx - 15, ty + 7);
          ctx.lineTo(tx + 15, ty - 8);
          ctx.lineTo(tx + 10, ty - 12);
          ctx.lineTo(tx - 20, ty + 3);
          ctx.closePath();
          ctx.fill();

          // Cabin glass glow
          ctx.fillStyle = '#e0f7fa';
          ctx.beginPath();
          ctx.moveTo(tx + 5, ty - 7);
          ctx.lineTo(tx + 12, ty - 10);
          ctx.lineTo(tx + 10, ty - 11);
          ctx.lineTo(tx + 3, ty - 8);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        drawRoad();
        // Render heavy combustion cars
        const carPos = (time * 8) % 240 - 120;
        const cx = centerX + carPos;
        const cy = islandY - (carPos * 0.5);

        if (cx > centerX - 80 && cx < centerX + 80) {
          // Car body
          ctx.fillStyle = '#ef4444'; // Gas car Red
          ctx.beginPath();
          ctx.moveTo(cx - 8, cy + 4);
          ctx.lineTo(cx + 8, cy - 4);
          ctx.lineTo(cx + 5, cy - 8);
          ctx.lineTo(cx - 11, cy);
          ctx.closePath();
          ctx.fill();

          // Exhaust smoke
          ctx.fillStyle = 'rgba(120, 113, 108, 0.4)';
          ctx.beginPath();
          ctx.arc(cx - 12, cy + 2, 3, 0, Math.PI * 2);
          ctx.arc(cx - 15, cy + 1, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 6. WIND TURBINE (Clean Grid - Top Center)
      const drawWindTurbine = (tx: number, ty: number) => {
        // Tower
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx, ty - 45);
        ctx.stroke();

        // Blades
        const bladeAngle = time * (isLow ? 2.5 : 1.2);
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        for (let b = 0; b < 3; b++) {
          const angle = bladeAngle + (b * Math.PI * 2 / 3);
          const bx = tx + Math.cos(angle) * 16;
          const by = ty - 45 + Math.sin(angle) * 16;
          ctx.beginPath();
          ctx.moveTo(tx, ty - 45);
          ctx.lineTo(bx, by);
          ctx.stroke();
        }

        // Center hub
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.arc(tx, ty - 45, 2.5, 0, Math.PI * 2);
        ctx.fill();
      };

      if (isLow || renewable) {
        drawWindTurbine(centerX, islandY - 65);
        if (isLow) {
          drawWindTurbine(centerX - 40, islandY - 50);
        }
      }

      // 7. BIRDS & LEAVES PARTICLES
      if (isLow) {
        // Birds flying
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.5;
        birds.forEach(b => {
          b.x += b.speed;
          if (b.x > width + 50) b.x = -50;
          
          const flap = Math.sin(time * 5 + b.offset) * b.size * 0.5;
          ctx.beginPath();
          ctx.moveTo(b.x - b.size, b.y + flap);
          ctx.lineTo(b.x, b.y);
          ctx.lineTo(b.x + b.size, b.y + flap);
          ctx.stroke();
        });

        // Falling green leaves
        ctx.fillStyle = '#10b981';
        leaves.forEach(l => {
          l.y += l.speedY;
          l.x += l.speedX;
          l.angle += l.rotSpeed;

          if (l.y > height) {
            l.y = -10;
            l.x = Math.random() * width;
          }

          ctx.save();
          ctx.translate(l.x, l.y);
          ctx.rotate(l.angle);
          ctx.beginPath();
          ctx.ellipse(0, 0, l.r * 1.5, l.r, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });
      }

      // 8. INTERACTIVE NODES CIRCLES (Visual hints for interactive mode)
      if (interactive && !tooltip) {
        const renderPulseGlow = (cx: number, cy: number, color: string) => {
          const pulse = Math.sin(time * 3) * 3 + 6;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(cx, cy, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
          ctx.stroke();
        };

        // Energy/Industry Node
        renderPulseGlow(centerX - 90, islandY - 10, 'rgba(6,182,212,0.3)');
        // Forest Node
        renderPulseGlow(centerX + 90, islandY - 15, 'rgba(16,185,129,0.3)');
        // Road/Commute Node
        renderPulseGlow(centerX, islandY + 30, 'rgba(245,158,11,0.3)');
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [total, transport, energy, food, lifestyle, renewable]);

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-2xl glass-card border border-white/10 select-none">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
          isLow ? 'bg-emerald-500/20 text-emerald-400' : isHigh ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
        }`}>
          <Leaf className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Living World Sandbox</h4>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Total Impact: <span className="font-bold text-white">{total}</span> kg CO₂e
          </p>
        </div>
      </div>

      <canvas 
        ref={canvasRef}
        onClick={(e) => checkClick(e.clientX, e.clientY)}
        className="block cursor-pointer"
      />

      {interactive && !tooltip && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-1 text-[10px] text-slate-400 pointer-events-none">
          <Info className="w-3.5 h-3.5" />
          <span>Click glowing nodes or regions to explore environmental impact details.</span>
        </div>
      )}

      {/* Tooltip Overlay */}
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ left: tooltip.x - 120, top: tooltip.y }}
            className="absolute z-20 w-60 p-4 rounded-xl glass-card border border-emerald-500/30 text-white shadow-2xl"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <tooltip.icon className="w-4 h-4 text-emerald-400" />
              <h5 className="text-xs font-bold text-emerald-300">{tooltip.title}</h5>
              <button 
                onClick={() => setTooltip(null)} 
                className="ml-auto text-slate-400 hover:text-white text-xs font-semibold"
              >
                ✕
              </button>
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">{tooltip.content}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default EcoWorld;
