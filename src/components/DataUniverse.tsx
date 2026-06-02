import { useEffect, useRef, useMemo } from 'react';
import type { ParsedData } from '../types';

interface Props {
  data?: ParsedData | null;
  phase: 'idle' | 'active';
}

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  label: string;
  glow: string;
  type: 'kpi' | 'node' | 'packet' | 'stream';
  opacity: number;
  value?: number;
}

const KPI_LABELS = [
  '2.4 Cr', '+18.3%', 'Q4 Rev', '94 pts', '-2.1%', '84 L',
  'EBITDA', '72%', '1.2 Cr', '+31%', 'ARR', '32K/u',
  '3.2x', 'sync', '99.1%', 'CAC 4.8K', 'LTV 8.2L', '+12 NPS',
  'ROI', 'MRR', 'GPM', 'NDR', 'LTV:CAC', 'ARPU',
];

export default function DataUniverse({ data, phase }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<Node[]>([]);
  const timeRef = useRef(0);

  const density = useMemo(() => {
    if (!data) return 0.25;
    return Math.min(1, 0.25 + (data.rowCount / 500) * 0.75);
  }, [data]);

  const glowIntensity = useMemo(() => {
    if (!data) return 0.3;
    const numCols = data.headers.filter(h => {
      const vals = data.rows.slice(0, 10).map(r => Number(r[h]));
      return vals.filter(v => !isNaN(v) && isFinite(v)).length > 5;
    }).length;
    return Math.min(1, 0.3 + numCols * 0.1);
  }, [data]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const nodeCount = Math.floor(10 + density * 30);
    const packetCount = Math.floor(6 + density * 20);
    const streamCount = Math.floor(2 + density * 6);

    const colors = ['#6C63FF', '#00E5FF', '#A855F7', '#22D3EE', '#818CF8', '#67e8f9'];
    const nodes: Node[] = [];

    // Main network nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: 2 + Math.random() * 4,
        label: KPI_LABELS[i % KPI_LABELS.length],
        glow: colors[i % colors.length],
        type: 'node',
        opacity: 0.3 + Math.random() * 0.5,
      });
    }

    // KPI display nodes (larger, slower)
    for (let i = 0; i < Math.floor(3 + density * 5); i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.1,
        vy: (Math.random() - 0.5) * 0.1,
        radius: 6 + Math.random() * 4,
        label: KPI_LABELS[(i + 6) % KPI_LABELS.length],
        glow: colors[i % 3],
        type: 'kpi',
        opacity: 0.5 + Math.random() * 0.3,
        value: Math.random() * 100,
      });
    }

    // Data packets (fast, small)
    for (let i = 0; i < packetCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: 1.5,
        label: '',
        glow: colors[i % colors.length],
        type: 'packet',
        opacity: 0.4 + Math.random() * 0.4,
      });
    }

    // Revenue streams (horizontal flowing lines)
    for (let i = 0; i < streamCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: canvas.height * (0.2 + Math.random() * 0.6),
        vx: 0.5 + Math.random() * 0.5,
        vy: 0,
        radius: 1,
        label: '',
        glow: colors[i % 3],
        type: 'stream',
        opacity: 0.2 + Math.random() * 0.3,
      });
    }

    nodesRef.current = nodes;

    let frameCount = 0;
    const draw = () => {
      timeRef.current += 0.006;
      frameCount++;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const allNodes = nodesRef.current;
      const t = timeRef.current;

      // === LAYER 1: Deep background grid ===
      ctx.strokeStyle = 'rgba(108, 99, 255, 0.03)';
      ctx.lineWidth = 0.5;
      const gridSize = 60;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // === LAYER 2: Revenue streams ===
      allNodes.filter(n => n.type === 'stream').forEach((stream, idx) => {
        stream.x += stream.vx;
        if (stream.x > canvas.width + 100) stream.x = -100;

        const streamY = stream.y + Math.sin(t * 2 + idx) * 20;
        const grad = ctx.createLinearGradient(stream.x - 200, streamY, stream.x, streamY);
        grad.addColorStop(0, stream.glow + '00');
        grad.addColorStop(0.5, stream.glow + '33');
        grad.addColorStop(1, stream.glow + '00');

        ctx.beginPath();
        ctx.moveTo(stream.x - 200, streamY);
        for (let x = stream.x - 200; x <= stream.x; x += 5) {
          const yOff = Math.sin((x - stream.x) * 0.03 + t * 3) * 8;
          ctx.lineTo(x, streamY + yOff);
        }
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2 * glowIntensity;
        ctx.stroke();
      });

      // === LAYER 3: Neural connections ===
      const networkNodes = allNodes.filter(n => n.type === 'node' || n.type === 'kpi');
      for (let i = 0; i < networkNodes.length; i++) {
        for (let j = i + 1; j < networkNodes.length; j++) {
          const dx = networkNodes[i].x - networkNodes[j].x;
          const dy = networkNodes[i].y - networkNodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 180 + density * 100;
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.12 * glowIntensity;
            const grad = ctx.createLinearGradient(
              networkNodes[i].x, networkNodes[i].y,
              networkNodes[j].x, networkNodes[j].y
            );
            const hex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
            grad.addColorStop(0, networkNodes[i].glow + hex);
            grad.addColorStop(1, networkNodes[j].glow + hex);
            ctx.beginPath();
            ctx.moveTo(networkNodes[i].x, networkNodes[i].y);
            ctx.lineTo(networkNodes[j].x, networkNodes[j].y);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // === LAYER 4: Animated forecast waves ===
      const waveColors = ['#6C63FF', '#00E5FF', '#A855F7'];
      for (let l = 0; l < 3; l++) {
        ctx.beginPath();
        ctx.strokeStyle = waveColors[l] + '18';
        ctx.lineWidth = 1.5;
        const yBase = canvas.height * (0.15 + l * 0.28);
        const xStart = (t * 30 * (l + 1)) % canvas.width;
        for (let x = 0; x < canvas.width; x += 3) {
          const xPos = (xStart + x) % canvas.width;
          const y = yBase
            + Math.sin((x + t * 60) * 0.015 + l * 2) * 40
            + Math.sin((x + t * 40) * 0.04) * 15
            + Math.cos((x + t * 20) * 0.008) * 20;
          if (x === 0) ctx.moveTo(xPos, y);
          else ctx.lineTo(xPos, y);
        }
        ctx.stroke();
      }

      // === LAYER 5: Heatmap pulses ===
      if (frameCount % 2 === 0) {
        for (let i = 0; i < Math.floor(2 + density * 3); i++) {
          const pulse = allNodes[i % allNodes.length];
          if (!pulse) continue;
          const pulseRadius = ((t * 50 + i * 40) % 100);
          const pulseAlpha = Math.max(0, 1 - pulseRadius / 100) * 0.1 * glowIntensity;
          ctx.beginPath();
          ctx.arc(pulse.x, pulse.y, pulseRadius, 0, Math.PI * 2);
          const hex = Math.floor(pulseAlpha * 255).toString(16).padStart(2, '0');
          ctx.strokeStyle = pulse.glow + hex;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // === LAYER 6: Nodes and packets ===
      allNodes.forEach((node, idx) => {
        // Update position
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -20 || node.x > canvas.width + 20) node.vx *= -1;
        if (node.y < -20 || node.y > canvas.height + 20) node.vy *= -1;

        const pulse = 1 + Math.sin(t * 2.5 + idx * 0.7) * 0.25;

        if (node.type === 'kpi') {
          // Large KPI node with glow
          const grd = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, node.radius * 6 * pulse
          );
          grd.addColorStop(0, node.glow + '66');
          grd.addColorStop(0.5, node.glow + '22');
          grd.addColorStop(1, node.glow + '00');
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 6 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();

          // Core
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
          ctx.fillStyle = node.glow;
          ctx.globalAlpha = node.opacity;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Label
          if (phase === 'active') {
            ctx.font = 'bold 11px Inter, system-ui, sans-serif';
            ctx.fillStyle = node.glow + 'DD';
            ctx.fillText(node.label, node.x + node.radius + 6, node.y + 4);
          }
        } else if (node.type === 'node') {
          // Standard node with glow
          const grd = ctx.createRadialGradient(
            node.x, node.y, 0,
            node.x, node.y, node.radius * 4 * pulse
          );
          grd.addColorStop(0, node.glow + '88');
          grd.addColorStop(1, node.glow + '00');
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius * 4 * pulse, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = node.glow;
          ctx.globalAlpha = node.opacity;
          ctx.fill();
          ctx.globalAlpha = 1;

          if (phase === 'active' && node.label && idx % 3 === 0) {
            ctx.font = '9px Inter, system-ui, sans-serif';
            ctx.fillStyle = node.glow + '99';
            ctx.fillText(node.label, node.x + node.radius + 3, node.y + 3);
          }
        } else if (node.type === 'packet') {
          // Fast-moving data packet
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
          ctx.fillStyle = node.glow + '99';
          ctx.globalAlpha = node.opacity * 0.7;
          ctx.fill();
          ctx.globalAlpha = 1;

          // Trail
          const trailGrad = ctx.createLinearGradient(
            node.x - node.vx * 8, node.y - node.vy * 8,
            node.x, node.y
          );
          trailGrad.addColorStop(0, node.glow + '00');
          trailGrad.addColorStop(1, node.glow + '44');
          ctx.beginPath();
          ctx.moveTo(node.x - node.vx * 8, node.y - node.vy * 8);
          ctx.lineTo(node.x, node.y);
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // === LAYER 7: Floating percentages ===
      if (phase === 'active' && frameCount % 180 === 0) {
        const kpiNode = allNodes.find(n => n.type === 'kpi');
        if (kpiNode) {
          kpiNode.label = KPI_LABELS[Math.floor(Math.random() * KPI_LABELS.length)];
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [density, phase, glowIntensity]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
