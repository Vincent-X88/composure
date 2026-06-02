import React, { useEffect, useMemo, useState } from 'react';

const DURATION_MS = 3200;
const WIDTH = 960;
const HEIGHT = 540;

const TABS = [
  {
    id: 'behavioral',
    label: 'Behavioral Interview',
    eyebrow: 'Behavioral',
    title: 'Tell a stronger story in the moment',
    body: 'A calm answer builder that keeps your examples structured and easy to follow.',
  },
  {
    id: 'system-design',
    label: 'System Design',
    eyebrow: 'Architecture',
    title: 'Keep the big picture clear',
    body: 'Use a clean architecture layout to move from requirements to tradeoffs without losing momentum.',
  },
  {
    id: 'full-stack',
    label: 'Full Stack',
    eyebrow: 'Build',
    title: 'Move between code and product flow',
    body: 'Show implementation details and the user experience side by side in one smooth view.',
  },
  {
    id: 'ai-ml',
    label: 'AI/ML',
    eyebrow: 'Models',
    title: 'Explain pipelines with confidence',
    body: 'A model and metrics view that keeps the training loop, features, and outputs in sync.',
  },
  {
    id: 'consulting',
    label: 'Consulting',
    eyebrow: 'Strategy',
    title: 'Turn problems into a simple framework',
    body: 'Map the issue, insight, and recommendation in a polished presentation-style layout.',
  },
  {
    id: 'data-analyst',
    label: 'Data Analyst',
    eyebrow: 'Insights',
    title: 'Make the dashboard tell the story',
    body: 'Use filters, bars, and trends to surface the signal before the interviewer asks for it.',
  },
  {
    id: 'trading',
    label: 'Trading',
    eyebrow: 'Markets',
    title: 'Read price action without noise',
    body: 'A chart-centric view that keeps price, risk, and execution details in focus.',
  },
  {
    id: 'pm',
    label: 'PM',
    eyebrow: 'Roadmap',
    title: 'Keep the discussion grounded in priorities',
    body: 'A roadmap and scoring view to frame tradeoffs, sequencing, and user impact quickly.',
  },
  {
    id: 'other',
    label: 'Other',
    eyebrow: 'General',
    title: 'A flexible canvas for any interview',
    body: 'A universal layout that adapts to whatever the interviewer throws at you next.',
  },
];

const videoCache = new Map();
const videoPromiseCache = new Map();

function roundRect(ctx, x, y, w, h, r) {
  const radius = typeof r === 'number' ? { tl: r, tr: r, br: r, bl: r } : r;
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + w - radius.tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
  ctx.lineTo(x + w, y + h - radius.br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
  ctx.lineTo(x + radius.bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}

function fillRoundRect(ctx, x, y, w, h, r, fillStyle) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

function strokeRoundRect(ctx, x, y, w, h, r, strokeStyle, lineWidth = 1) {
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

function text(ctx, value, x, y, options = {}) {
  const {
    color = '#f5f5f3',
    font = '600 18px Inter, sans-serif',
    align = 'left',
    baseline = 'alphabetic',
    alpha = 1,
  } = options;

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.globalAlpha = alpha;
  ctx.fillText(value, x, y);
  ctx.restore();
}

function gradientBackground(ctx, activeId, t) {
  const palette = {
    behavioral: ['#1d2235', '#0d0f15', '#202940'],
    'system-design': ['#18222c', '#0b1018', '#16324f'],
    'full-stack': ['#181d2a', '#0c0f14', '#252f45'],
    'ai-ml': ['#132425', '#0a0f11', '#1b3b34'],
    consulting: ['#241d14', '#120f0b', '#3a2e1e'],
    'data-analyst': ['#182132', '#0b1016', '#1a3e63'],
    trading: ['#251719', '#120b0e', '#41222a'],
    pm: ['#1b1b27', '#0c0c12', '#34324a'],
    other: ['#17171a', '#0d0d11', '#27272d'],
  };

  const [a, b, c] = palette[activeId] ?? palette.other;
  const g = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  g.addColorStop(0, a);
  g.addColorStop(0.5, b);
  g.addColorStop(1, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const orb = ctx.createRadialGradient(
    WIDTH * (0.2 + Math.sin(t * 0.0008) * 0.04),
    HEIGHT * (0.18 + Math.cos(t * 0.0012) * 0.04),
    10,
    WIDTH * 0.5,
    HEIGHT * 0.5,
    500,
  );
  orb.addColorStop(0, 'rgba(143, 247, 196, 0.14)');
  orb.addColorStop(0.4, 'rgba(143, 247, 196, 0.05)');
  orb.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawChrome(ctx, activeTab) {
  fillRoundRect(ctx, 22, 20, WIDTH - 44, HEIGHT - 40, 28, 'rgba(10, 10, 12, 0.76)');
  strokeRoundRect(ctx, 22, 20, WIDTH - 44, HEIGHT - 40, 28, 'rgba(255, 255, 255, 0.08)', 1);

  fillRoundRect(ctx, 42, 40, WIDTH - 84, 54, 18, 'rgba(255, 255, 255, 0.04)');
  ['#ff5f57', '#febc2e', '#28c840'].forEach((dot, index) => {
    ctx.beginPath();
    ctx.fillStyle = dot;
    ctx.arc(66 + index * 18, 67, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  text(ctx, 'Interview Copilot', 114, 70, {
    color: '#cfd5de',
    font: '700 16px Inter, sans-serif',
  });
  text(ctx, activeTab.label, WIDTH - 74, 70, {
    color: '#a3a9b5',
    font: '700 12px Inter, sans-serif',
    align: 'right',
  });
}

function drawBehavioral(ctx, t) {
  fillRoundRect(ctx, 74, 118, 330, 300, 24, 'rgba(13, 15, 20, 0.72)');
  fillRoundRect(ctx, 454, 118, 420, 300, 24, 'rgba(255, 255, 255, 0.94)');
  strokeRoundRect(ctx, 74, 118, 330, 300, 24, 'rgba(255, 255, 255, 0.08)', 1);
  strokeRoundRect(ctx, 454, 118, 420, 300, 24, 'rgba(255, 255, 255, 0.08)', 1);

  text(ctx, 'Question', 102, 154, {
    color: '#8b90a0',
    font: '700 12px Inter, sans-serif',
  });
  text(ctx, 'Tell me about a time you failed.', 102, 196, {
    color: '#f1f3f6',
    font: '700 24px Space Grotesk, sans-serif',
  });

  const bullets = ['Situation', 'Action', 'Result'];
  bullets.forEach((label, index) => {
    const y = 240 + index * 44;
    fillRoundRect(ctx, 102, y, 204, 28, 14, 'rgba(143, 247, 196, 0.08)');
    text(ctx, label, 122, y + 19, {
      color: '#d9f7e9',
      font: '700 13px Inter, sans-serif',
      baseline: 'middle',
    });
  });

  const pulse = 0.5 + Math.sin(t * 0.006) * 0.5;
  ctx.save();
  ctx.strokeStyle = `rgba(143, 247, 196, ${0.15 + pulse * 0.35})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(302, 310, 32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  text(ctx, 'Structured answer', 482, 154, {
    color: '#6f7686',
    font: '700 12px Inter, sans-serif',
  });
  text(ctx, '1. Frame the context', 486, 202, {
    color: '#101319',
    font: '700 22px Space Grotesk, sans-serif',
  });
  text(ctx, '2. State the tradeoff', 486, 244, {
    color: '#101319',
    font: '700 22px Space Grotesk, sans-serif',
  });
  text(ctx, '3. End with what you learned', 486, 286, {
    color: '#101319',
    font: '700 22px Space Grotesk, sans-serif',
  });

  fillRoundRect(ctx, 730, 180, 92, 36, 18, 'rgba(143, 247, 196, 0.88)');
  text(ctx, 'Live', 776, 204, {
    color: '#07110c',
    font: '800 13px Inter, sans-serif',
    align: 'center',
    baseline: 'middle',
  });
}

function drawSystemDesign(ctx, t) {
  const boxes = [
    [92, 180, 150, 88, 'Client'],
    [290, 128, 160, 88, 'API'],
    [514, 128, 160, 88, 'Cache'],
    [514, 254, 160, 88, 'Queue'],
    [734, 190, 120, 88, 'DB'],
  ];
  boxes.forEach(([x, y, w, h, label], index) => {
    fillRoundRect(ctx, x, y, w, h, 18, index === 2 ? 'rgba(143, 247, 196, 0.16)' : 'rgba(255, 255, 255, 0.05)');
    strokeRoundRect(ctx, x, y, w, h, 18, 'rgba(255, 255, 255, 0.09)', 1);
    text(ctx, label, x + w / 2, y + h / 2 + 2, {
      color: '#edf1f4',
      font: '700 18px Space Grotesk, sans-serif',
      align: 'center',
      baseline: 'middle',
    });
  });

  const arrows = [
    [242, 224, 48, 0],
    [450, 172, 56, 0],
    [672, 172, 54, 0],
    [672, 298, 54, 0],
  ];
  ctx.save();
  ctx.strokeStyle = 'rgba(143, 247, 196, 0.75)';
  ctx.lineWidth = 4;
  arrows.forEach(([x, y, len]) => {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + len, y);
    ctx.lineTo(x + len - 12, y - 8);
    ctx.lineTo(x + len - 12, y + 8);
    ctx.closePath();
    ctx.fillStyle = 'rgba(143, 247, 196, 0.75)';
    ctx.fill();
  });
  ctx.restore();

  const nodes = [
    [516, 128, 12],
    [516, 254, 12],
    [734, 190, 12],
  ];
  nodes.forEach(([x, y, r], index) => {
    const glow = 0.3 + Math.sin(t * 0.004 + index) * 0.2;
    ctx.save();
    ctx.fillStyle = `rgba(143, 247, 196, ${0.2 + glow})`;
    ctx.beginPath();
    ctx.arc(x + 80, y + 44, r + 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawFullStack(ctx, t) {
  fillRoundRect(ctx, 88, 120, 360, 300, 22, 'rgba(13, 17, 24, 0.96)');
  fillRoundRect(ctx, 468, 120, 400, 300, 22, 'rgba(255, 255, 255, 0.95)');
  strokeRoundRect(ctx, 88, 120, 360, 300, 22, 'rgba(255, 255, 255, 0.08)', 1);
  strokeRoundRect(ctx, 468, 120, 400, 300, 22, 'rgba(255, 255, 255, 0.08)', 1);

  text(ctx, 'editor.tsx', 116, 152, {
    color: '#a2a8b7',
    font: '700 12px Inter, sans-serif',
  });
  const codeLines = [
    'const answer = useInterviewState();',
    'const preview = answer.map(format);',
    'return <Dashboard value={preview} />;',
  ];
  codeLines.forEach((line, index) => {
    text(ctx, line, 116, 198 + index * 34, {
      color: index === 1 ? '#8ff7c4' : '#dce1e8',
      font: '600 20px SFMono-Regular, Consolas, monospace',
    });
  });

  fillRoundRect(ctx, 512, 160, 248, 48, 16, 'rgba(143, 247, 196, 0.12)');
  text(ctx, 'Live preview', 636, 191, {
    color: '#0f1220',
    font: '700 16px Inter, sans-serif',
    align: 'center',
    baseline: 'middle',
  });
  fillRoundRect(ctx, 512, 230, 168, 94, 18, 'rgba(18, 20, 26, 0.08)');
  fillRoundRect(ctx, 692, 230, 126, 94, 18, 'rgba(143, 247, 196, 0.1)');
  const y = 348 + Math.sin(t * 0.004) * 8;
  ctx.save();
  ctx.strokeStyle = 'rgba(33, 111, 252, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(512, y);
  ctx.lineTo(762, y - 24);
  ctx.lineTo(814, y - 10);
  ctx.stroke();
  ctx.restore();
}

function drawAiMl(ctx, t) {
  fillRoundRect(ctx, 76, 132, 282, 246, 20, 'rgba(13, 22, 20, 0.82)');
  fillRoundRect(ctx, 388, 132, 222, 246, 20, 'rgba(255, 255, 255, 0.94)');
  fillRoundRect(ctx, 640, 132, 218, 246, 20, 'rgba(15, 17, 22, 0.9)');
  const points = [
    [118, 180, 'Dataset'],
    [118, 234, 'Features'],
    [118, 288, 'Model'],
  ];
  points.forEach(([x, y, label], index) => {
    fillRoundRect(ctx, x, y, 172, 34, 16, index === 1 ? 'rgba(143, 247, 196, 0.15)' : 'rgba(255, 255, 255, 0.06)');
    text(ctx, label, x + 86, y + 22, {
      color: '#e6e9ed',
      font: '600 14px Inter, sans-serif',
      align: 'center',
      baseline: 'middle',
    });
  });

  const chartBaseX = 416;
  const chartBaseY = 334;
  ctx.save();
  ctx.strokeStyle = 'rgba(143, 247, 196, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const x = chartBaseX + i * 34;
    const y = chartBaseY - (Math.sin(i * 0.9 + t * 0.003) * 20 + i * 5);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 6; i += 1) {
    const x = chartBaseX + i * 34;
    const y = chartBaseY - (Math.sin(i * 0.9 + t * 0.003) * 20 + i * 5);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(143, 247, 196, 0.92)';
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'Model accuracy', 692, 178, {
    color: '#e7eaee',
    font: '700 18px Space Grotesk, sans-serif',
    align: 'center',
  });
  text(ctx, '94.8%', 692, 236, {
    color: '#8ff7c4',
    font: '800 56px Space Grotesk, sans-serif',
    align: 'center',
  });
}

function drawConsulting(ctx) {
  fillRoundRect(ctx, 84, 126, 320, 260, 22, 'rgba(18, 14, 10, 0.86)');
  fillRoundRect(ctx, 436, 126, 408, 260, 22, 'rgba(255, 255, 255, 0.95)');
  text(ctx, 'Problem framing', 118, 162, {
    color: '#7f8693',
    font: '700 12px Inter, sans-serif',
  });
  ['Market', 'Cost', 'Execution'].forEach((label, index) => {
    fillRoundRect(ctx, 118, 202 + index * 50, 194, 32, 15, 'rgba(143, 247, 196, 0.09)');
    text(ctx, label, 146, 223 + index * 50, {
      color: '#dff4e9',
      font: '700 15px Inter, sans-serif',
      baseline: 'middle',
    });
  });
  text(ctx, 'Recommendation', 470, 166, {
    color: '#7f8693',
    font: '700 12px Inter, sans-serif',
  });
  text(ctx, 'Go narrow, test quickly, scale what works.', 470, 226, {
    color: '#101319',
    font: '700 24px Space Grotesk, sans-serif',
  });
  text(ctx, 'Use a crisp framework and move with confidence.', 470, 270, {
    color: '#4f5663',
    font: '600 16px Inter, sans-serif',
  });
}

function drawDataAnalyst(ctx, t) {
  fillRoundRect(ctx, 80, 126, 318, 262, 22, 'rgba(12, 16, 22, 0.9)');
  fillRoundRect(ctx, 432, 126, 412, 262, 22, 'rgba(255, 255, 255, 0.95)');
  ['Revenue', 'Retention', 'Conversion'].forEach((label, index) => {
    fillRoundRect(ctx, 114 + index * 92, 162, 78, 30, 14, index === 1 ? 'rgba(143, 247, 196, 0.14)' : 'rgba(255, 255, 255, 0.06)');
    text(ctx, label, 153 + index * 92, 182, {
      color: index === 1 ? '#dff4e9' : '#c6ccd6',
      font: '700 12px Inter, sans-serif',
      align: 'center',
      baseline: 'middle',
    });
  });
  const bars = [42, 70, 95, 118, 144];
  bars.forEach((height, index) => {
    fillRoundRect(ctx, 126 + index * 42, 330 - height, 24, height, 10, 'rgba(143, 247, 196, 0.85)');
  });
  ctx.save();
  ctx.strokeStyle = 'rgba(33, 111, 252, 0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(472, 312);
  for (let i = 0; i < 6; i += 1) {
    const x = 472 + i * 54;
    const y = 310 - Math.sin(i * 0.8 + t * 0.004) * 22 - i * 4;
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  text(ctx, 'Dashboard snapshot', 472, 164, {
    color: '#101319',
    font: '700 24px Space Grotesk, sans-serif',
  });
}

function drawTrading(ctx, t) {
  fillRoundRect(ctx, 78, 126, 320, 262, 22, 'rgba(20, 11, 13, 0.9)');
  fillRoundRect(ctx, 432, 126, 412, 262, 22, 'rgba(255, 255, 255, 0.95)');
  text(ctx, 'Price action', 112, 164, {
    color: '#e6e9ee',
    font: '700 20px Space Grotesk, sans-serif',
  });
  ctx.save();
  ctx.strokeStyle = 'rgba(143, 247, 196, 0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const x = 118 + i * 28;
    const y = 304 - Math.sin(i * 0.7 + t * 0.005) * 18 - i * 4;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 7; i += 1) {
    const x = 480 + i * 42;
    const base = 320 - (i % 2) * 18;
    const top = base - (22 + Math.sin(i * 0.8 + t * 0.004) * 12);
    fillRoundRect(ctx, x, top, 18, base - top, 6, i % 2 === 0 ? 'rgba(143, 247, 196, 0.9)' : 'rgba(255, 79, 79, 0.88)');
  }
  text(ctx, 'Risk / reward', 472, 164, {
    color: '#101319',
    font: '700 24px Space Grotesk, sans-serif',
  });
}

function drawPm(ctx) {
  fillRoundRect(ctx, 78, 126, 318, 262, 22, 'rgba(16, 16, 23, 0.92)');
  fillRoundRect(ctx, 432, 126, 412, 262, 22, 'rgba(255, 255, 255, 0.95)');
  ['Now', 'Next', 'Later'].forEach((label, index) => {
    fillRoundRect(ctx, 112 + index * 88, 162, 74, 30, 14, index === 0 ? 'rgba(143, 247, 196, 0.14)' : 'rgba(255, 255, 255, 0.06)');
    text(ctx, label, 149 + index * 88, 182, {
      color: index === 0 ? '#e2f7eb' : '#c6ccd6',
      font: '700 12px Inter, sans-serif',
      align: 'center',
      baseline: 'middle',
    });
  });
  ['Research', 'Prototype', 'Ship'].forEach((item, index) => {
    fillRoundRect(ctx, 114, 214 + index * 40, 160, 28, 12, 'rgba(143, 247, 196, 0.08)');
    text(ctx, item, 140, 232 + index * 40, {
      color: '#dff4e9',
      font: '600 14px Inter, sans-serif',
    });
  });
  text(ctx, 'Prioritization view', 472, 166, {
    color: '#101319',
    font: '700 24px Space Grotesk, sans-serif',
  });
  fillRoundRect(ctx, 472, 210, 196, 52, 16, 'rgba(143, 247, 196, 0.12)');
  text(ctx, 'User impact: high', 570, 243, {
    color: '#101319',
    font: '700 16px Inter, sans-serif',
    align: 'center',
    baseline: 'middle',
  });
}

function drawOther(ctx) {
  fillRoundRect(ctx, 78, 126, 772, 262, 22, 'rgba(255, 255, 255, 0.95)');
  text(ctx, 'A flexible session canvas', 112, 168, {
    color: '#101319',
    font: '700 26px Space Grotesk, sans-serif',
  });
  text(ctx, 'Adapt to the interview in front of you.', 112, 208, {
    color: '#4f5663',
    font: '600 16px Inter, sans-serif',
  });
  fillRoundRect(ctx, 112, 248, 250, 40, 16, 'rgba(143, 247, 196, 0.12)');
  text(ctx, 'Prompt, structure, deliver', 137, 273, {
    color: '#101319',
    font: '700 15px Inter, sans-serif',
    baseline: 'middle',
  });
  fillRoundRect(ctx, 390, 248, 430, 40, 16, 'rgba(18, 18, 22, 0.08)');
}

function drawScene(ctx, activeTab, t) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  gradientBackground(ctx, activeTab.id, t);
  drawChrome(ctx, activeTab);

  switch (activeTab.id) {
    case 'behavioral':
      drawBehavioral(ctx, t);
      break;
    case 'system-design':
      drawSystemDesign(ctx, t);
      break;
    case 'full-stack':
      drawFullStack(ctx, t);
      break;
    case 'ai-ml':
      drawAiMl(ctx, t);
      break;
    case 'consulting':
      drawConsulting(ctx, t);
      break;
    case 'data-analyst':
      drawDataAnalyst(ctx, t);
      break;
    case 'trading':
      drawTrading(ctx, t);
      break;
    case 'pm':
      drawPm(ctx, t);
      break;
    default:
      drawOther(ctx, t);
      break;
  }

  const accentX = 820 + Math.sin(t * 0.004) * 8;
  const accentY = 472 + Math.cos(t * 0.0035) * 6;
  ctx.save();
  ctx.fillStyle = 'rgba(143, 247, 196, 0.9)';
  ctx.beginPath();
  ctx.arc(accentX, accentY, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

async function loadClip(activeTab) {
  if (videoCache.has(activeTab.id)) {
    return videoCache.get(activeTab.id);
  }

  if (videoPromiseCache.has(activeTab.id)) {
    return videoPromiseCache.get(activeTab.id);
  }

  const promise = new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d');

      if (!ctx || !canvas.captureStream || typeof MediaRecorder === 'undefined') {
        reject(new Error('Video capture is not supported in this browser.'));
        return;
      }

      const mimeCandidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];
      const mimeType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const stream = canvas.captureStream(24);
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks = [];
      const startedAt = performance.now();

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recorder.mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        videoCache.set(activeTab.id, url);
        resolve(url);
      };

      recorder.onerror = (event) => reject(event.error ?? new Error('Unable to generate video.'));

      let frameId = 0;
      const render = (time) => {
        drawScene(ctx, activeTab, time - startedAt);
        if (time - startedAt < DURATION_MS) {
          frameId = requestAnimationFrame(render);
        }
      };

      recorder.start();
      frameId = requestAnimationFrame(render);

      setTimeout(() => {
        cancelAnimationFrame(frameId);
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }, DURATION_MS + 50);
    } catch (error) {
      reject(error);
    }
  });

  videoPromiseCache.set(activeTab.id, promise);
  return promise;
}

export function InterviewTypesShowcase() {
  const [activeId, setActiveId] = useState('behavioral');
  const [videoSrc, setVideoSrc] = useState('');
  const [loading, setLoading] = useState(true);
  const activeTab = useMemo(() => TABS.find((tab) => tab.id === activeId) ?? TABS[0], [activeId]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setVideoSrc('');

    loadClip(activeTab)
      .then((url) => {
        if (isMounted) {
          setVideoSrc(url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  return (
    <section className="content-section section-inner interview-types-section" id="interview-types">
      <div className="interview-types-header">
        <div>
          <p className="eyebrow">Interview types</p>
          <h2 className="section-title">
            Works across every
            <br />
            interview type
          </h2>
        </div>
        <p className="section-body interview-types-copy">
          Switch the tab to preview a different short video for each interview style.
        </p>
      </div>

      <div className="interview-types-shell">
        <aside className="interview-tabs" aria-label="Interview type tabs">
          <div className="interview-tabs-brand">
            <img src="/logo_two.png" alt="" aria-hidden="true" />
            <span>Composure</span>
          </div>

          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === activeId ? 'is-active' : ''}
              onClick={() => setActiveId(tab.id)}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </aside>

        <div className="interview-video-panel" data-reveal>
          <div className="interview-video-frame">
            <div className="interview-video-topbar">
              <div className="interview-video-topbar-left">
                <img src="/logo_two.png" alt="" aria-hidden="true" />
                <div>
                  <strong>{activeTab.label}</strong>
                  <span>{activeTab.eyebrow}</span>
                </div>
              </div>
              <span className="interview-video-chip">Preview</span>
            </div>

            <div className="interview-video-stage">
              {loading ? (
                <div className="interview-video-loading">
                  <span className="interview-video-loading-ring" />
                  <p>Generating video preview...</p>
                </div>
              ) : null}

              {videoSrc ? (
                <video
                  key={videoSrc}
                  className="interview-video"
                  src={videoSrc}
                  autoPlay
                  muted
                  loop
                  playsInline
                  controls={false}
                />
              ) : null}
            </div>
          </div>

          <div className="interview-video-copy">
            <p className="value-kicker">{activeTab.eyebrow}</p>
            <h3>{activeTab.title}</h3>
            <p>{activeTab.body}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
