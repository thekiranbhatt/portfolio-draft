const root = document.body;
const toggle = document.querySelector('.mode-toggle');
const savedMode = localStorage.getItem('kiran-mode');

if (savedMode === 'dark') root.classList.add('dark');
function syncModeButton() {
  const isLightAtmosphere = root.classList.contains('dark');
  toggle.setAttribute('aria-pressed', String(isLightAtmosphere));
  toggle.innerHTML = `<span aria-hidden="true">${isLightAtmosphere ? '◑' : '◐'}</span> ${isLightAtmosphere ? 'Night atmosphere' : 'Day atmosphere'}`;
}
syncModeButton();
toggle.addEventListener('click', () => {
  root.classList.toggle('dark');
  const isDark = root.classList.contains('dark');
  localStorage.setItem('kiran-mode', isDark ? 'dark' : 'light');
  syncModeButton();
});

document.getElementById('year').textContent = new Date().getFullYear();

const companion = document.getElementById('companion-widget');
const companionTrigger = document.getElementById('companion-trigger');
const companionStatus = document.getElementById('companion-status');
const hideCompanion = document.getElementById('hide-companion');
const showCompanion = document.getElementById('show-companion-btn');
const companionStorageKey = 'kiran-companion-visible';
let companionTimeout;
let lastCompanionNote = 0;
const companionCooldown = 10000;

function setCompanionVisibility(visible, persist = false) {
  companion.hidden = !visible;
  showCompanion.hidden = visible;
  if (persist) localStorage.setItem(companionStorageKey, String(visible));
}

function showCompanionNote(note, duration = 2400, force = false) {
  const now = Date.now();
  if (!force && now - lastCompanionNote < companionCooldown) return;
  lastCompanionNote = now;
  companionStatus.textContent = note;
  companionStatus.classList.add('visible');
  clearTimeout(companionTimeout);
  companionTimeout = setTimeout(() => companionStatus.classList.remove('visible'), duration);
}

if (localStorage.getItem(companionStorageKey) === 'false') setCompanionVisibility(false);

if ('IntersectionObserver' in window) {
  const companionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) showCompanionNote(entry.target.dataset.companionContext);
    });
  }, { threshold: 0.55 });
  document.querySelectorAll('[data-companion-context]').forEach(section => companionObserver.observe(section));
}

companionTrigger.addEventListener('click', () => showCompanionNote('Pacing steady', 2000, true));
hideCompanion.addEventListener('click', () => setCompanionVisibility(false, true));
showCompanion.addEventListener('click', () => {
  setCompanionVisibility(true, true);
  showCompanionNote('Pacing steady', 2000, true);
});

const graph = document.getElementById('trajectory-graph');
const nodeTitle = document.getElementById('node-title');
const nodeCopy = document.getElementById('node-copy');
const nodeLinks = document.getElementById('node-links');
const NS = 'http://www.w3.org/2000/svg';
const nodes = [
  { id:'wetlab', label:'Wet Lab\nBiotechnology', group:'origin', x:120, y:265, copy:'Molecular diagnostics, microbiology, and quality-control work built the original habit of documenting what happened at every step.', links:['BCSIR research internship','PCR-based food authentication','GLP quality-control records'] },
  { id:'genomics', label:'Computational\nGenomics', group:'core', x:325, y:100, copy:'Genomic databases and multi-omic coursework shifted the work from bench methods into computational analysis.', links:['ClinVar, gnomAD, COSMIC, and 1000 Genomes','Variant annotation and ROC analysis','Sequence alignment and phylogenetics'] },
  { id:'dataeng', label:'Data\nEngineering', group:'core', x:375, y:410, copy:'The question became how to move, model, check, and expose data reliably enough to use again.', links:['SQL, Python, PostgreSQL, and Airflow','Data Engineering Course repository','ETL and migration practice'] },
  { id:'clinical', label:'Clinical\nSystems', group:'current', x:675, y:295, copy:'Clinical datasets are where the biological context and pipeline discipline now meet.', links:['METABRIC clinical data platform','Bronze–Silver–Gold modelling','Governed Streamlit reporting'] },
  { id:'analysis', label:'Applied\nAnalysis', group:'branch', x:690, y:85, copy:'Small analytic studies are used to inspect data structure, model limits, and query design.', links:['K-Means clustering','Medical-insurance regression','Hospital SQL analysis'] }
];
const edges = [
  { source:'wetlab', target:'genomics', label:'bench → sequence', bend:28, labelDx:-13, labelDy:-9 },
  { source:'genomics', target:'dataeng', label:'analysis → infrastructure', bend:-45, labelDx:15, labelDy:2 },
  { source:'dataeng', target:'clinical', label:'pipeline → clinical records', bend:-25, labelDx:0, labelDy:20 },
  { source:'clinical', target:'wetlab', label:'clinical context → bench', bend:-120, labelDx:0, labelDy:23 },
  { source:'genomics', target:'analysis', label:'methods → applied analysis', bend:-42, labelDx:0, labelDy:-8 },
  { source:'analysis', target:'clinical', label:'models → clinical data', bend:-42, labelDx:-17, labelDy:0 }
];
const byId = Object.fromEntries(nodes.map(node => [node.id, node]));
const edgeLayer = document.createElementNS(NS, 'g');
const labelLayer = document.createElementNS(NS, 'g');
const nodeLayer = document.createElementNS(NS, 'g');
const isCompactGraph = window.matchMedia('(max-width: 800px)').matches;
graph.append(edgeLayer, labelLayer, nodeLayer);

edges.forEach(edge => {
  const line = document.createElementNS(NS, 'path');
  line.setAttribute('class', 'edge');
  edge.line = line;
  edgeLayer.append(line);
  const label = document.createElementNS(NS, 'text');
  label.setAttribute('class', 'edge-label');
  label.textContent = edge.label;
  edge.text = label;
  labelLayer.append(label);
});

nodes.forEach(node => {
  const group = document.createElementNS(NS, 'g');
  group.setAttribute('class', `node ${node.group}`);
  group.setAttribute('role', 'button');
  group.setAttribute('tabindex', '0');
  group.setAttribute('aria-label', `Show ${node.label.replace('\n', ' ')}`);
  const circle = document.createElementNS(NS, 'circle');
  circle.setAttribute('r', node.group === 'current' ? '13' : '10');
  const text = document.createElementNS(NS, 'text');
  node.label.split('\n').forEach((line, index) => {
    const tspan = document.createElementNS(NS, 'tspan');
    tspan.setAttribute('x', '18');
    tspan.setAttribute('dy', index ? (isCompactGraph ? '27' : '14') : '4');
    tspan.textContent = line;
    text.append(tspan);
  });
  group.append(circle, text);
  group.addEventListener('click', () => selectNode(node.id));
  group.addEventListener('mouseenter', () => highlight(node.id));
  group.addEventListener('mouseleave', () => highlight(selectedId));
  group.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectNode(node.id); } });
  node.groupEl = group;
  nodeLayer.append(group);
});

let selectedId = 'wetlab';
function selectNode(id) {
  selectedId = id;
  const node = byId[id];
  nodeTitle.textContent = node.label.replace('\n', ' ');
  nodeCopy.textContent = node.copy;
  nodeLinks.replaceChildren(...node.links.map(item => { const li = document.createElement('li'); li.textContent = item; return li; }));
  highlight(id);
}
function highlight(id) {
  const connected = new Set([id]);
  edges.forEach(edge => { if (edge.source === id || edge.target === id) { connected.add(edge.source); connected.add(edge.target); } });
  nodes.forEach(node => node.groupEl.classList.toggle('inactive', !connected.has(node.id)));
  nodes.forEach(node => node.groupEl.classList.toggle('active', node.id === id));
  edges.forEach(edge => { const active = edge.source === id || edge.target === id; edge.line.classList.toggle('active', active); edge.text.classList.toggle('active', active); });
}
function render() {
  edges.forEach(edge => {
    const source = byId[edge.source], target = byId[edge.target];
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    const middleX = (source.x + target.x) / 2;
    const middleY = (source.y + target.y) / 2;
    const controlX = middleX + (-dy / distance) * edge.bend;
    const controlY = middleY + (dx / distance) * edge.bend;
    edge.line.setAttribute('d', `M ${source.x} ${source.y} Q ${controlX} ${controlY} ${target.x} ${target.y}`);
    edge.text.setAttribute('x', (source.x + 2 * controlX + target.x) / 4 + edge.labelDx);
    edge.text.setAttribute('y', (source.y + 2 * controlY + target.y) / 4 + edge.labelDy);
    edge.text.setAttribute('text-anchor', 'middle');
  });
  nodes.forEach(node => node.groupEl.setAttribute('transform', `translate(${node.x},${node.y})`));
}
render();
selectNode(selectedId);
