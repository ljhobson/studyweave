const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const nodeStyle = {
  fillColor: "#2980b9",
  strokeColor: "#1c5980",
  textColor: "#fff",
  font: "16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  shadowColor: "rgba(0,0,0,0.15)",
  shadowBlur: 8,
  borderRadius: 8,
  padding: 12,
  maxWidth: 180,
  lineHeight: 20,
};

let nodes = [
  { id: 0, text: "Atom", connections: [1, 2, 3, 4] },
  { id: 1, text: "Electron", connections: [0, 2, 3] },
  { id: 2, text: "Proton", connections: [0, 1, 3] },
  { id: 3, text: "Nucleus", connections: [0, 1, 2] },
  { id: 4, text: "Quantum Mechanics", connections: [0, 1, 6, 8, 9] },
  { id: 5, text: "Gravity", connections: [6, 10, 11] },
  { id: 6, text: "General Relativity", connections: [5, 4, 11] },
  { id: 7, text: "Mass", connections: [5, 10] },
  { id: 8, text: "Wave-Particle Duality", connections: [1, 4, 9] },
  { id: 9, text: "Photon", connections: [1, 4, 8] },
  { id: 10, text: "Inertia", connections: [5, 7, 11] },
  { id: 11, text: "Force", connections: [5, 6, 10, 12] },
  { id: 12, text: "Newton's Laws", connections: [11, 13, 14] },
  { id: 13, text: "Acceleration", connections: [12, 14] },
  { id: 14, text: "Velocity", connections: [12, 13, 15] },
  { id: 15, text: "Kinetic Energy", connections: [14, 16, 17] },
  { id: 16, text: "Potential Energy", connections: [15, 17] },
  { id: 17, text: "Conservation of Energy", connections: [15, 16] },
  { id: 18, text: "Thermodynamics", connections: [17, 19, 20] },
  { id: 19, text: "Entropy", connections: [18, 20] },
  { id: 20, text: "Heat", connections: [18, 19] },
];


function makeBidirectional(nodes) {
  const map = new Map(nodes.map(n => [n.id, n]));
  nodes.forEach(node => {
    node.connections.forEach(id => {
      const target = map.get(id);
      if (target && !target.connections.includes(node.id)) {
        target.connections.push(node.id);
      }
    });
  });
}
makeBidirectional(nodes);

let nodeMap = {};
nodes.forEach(n => nodeMap[n.id] = n);

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";

  words.forEach((word) => {
    const testLine = line + (line ? " " : "") + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) lines.push(line);
  return lines;
}

function updateNodeDimensions(node) {
  ctx.font = nodeStyle.font;

  // Wrap text but no fixed maxWidth for width measurement
  const maxLineWidth = nodeStyle.maxWidth;
  const lines = wrapText(ctx, node.text, maxLineWidth);

  // Find max width of lines to set node width
  let maxWidth = 0;
  lines.forEach(line => {
    const lineWidth = ctx.measureText(line).width;
    if (lineWidth > maxWidth) maxWidth = lineWidth;
  });

  // Add padding to width and height
  node.w = maxWidth + nodeStyle.padding * 2;
  node.h = lines.length * nodeStyle.lineHeight + nodeStyle.padding * 2;
  node.lines = lines;
}

nodes.forEach(updateNodeDimensions);

let selectedNode = nodes[0];
let oldNode = nodes[0];
let transitioning = false;
let transitionProgress = 0;
let transitionFrom = null;
let transitionTo = null;
let transitionStartX = 0;
let transitionStartY = 0;
let transitionEndX = 0;
let transitionEndY = 0;

function updateDims() {
  canvas.width = window.innerWidth - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
  canvas.height = window.innerHeight;
}
window.onresize = updateDims;
updateDims();

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

canvas.addEventListener("mousedown", (e) => {
  if (transitioning) return;
  const x = e.offsetX;
  const y = e.offsetY;
  if (!selectedNode) return;

  for (let conn of selectedNode.connections) {
    const node = nodeMap[conn];
    if (x >= node.x && x <= node.x + node.w && y >= node.y && y <= node.y + node.h) {
      transitionFrom = selectedNode;
      transitionTo = node;
      oldNode = selectedNode;
      selectedNode = node;
      transitioning = true;
      transitionProgress = 0;
      transitionStartX = node.x;
      transitionStartY = node.y;
      transitionEndX = canvas.width / 2 - node.w / 2;
      transitionEndY = canvas.height / 2 - node.h / 2;
      return;
    }
  }
});

function centerNode(node) {
  node.x = canvas.width / 2 - node.w / 2;
  node.y = canvas.height / 2 - node.h / 2;
}

function positionConnections(node, t) {
  const radius = 200 * t;
  const angleStep = (2 * Math.PI) / node.connections.length;
  node.connections.forEach((connId, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const connectedNode = nodeMap[connId];
    connectedNode.x = node.x + node.w / 2 + radius * Math.cos(angle) - connectedNode.w / 2;
    connectedNode.y = node.y + node.h / 2 + radius * Math.sin(angle) - connectedNode.h / 2;
  });
}

centerNode(selectedNode);
positionConnections(selectedNode, 1);

function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (transitioning && transitionFrom && transitionTo) {
    transitionProgress += 0.05;
    if (transitionProgress >= 1) {
      transitionProgress = 1;
      transitioning = false;
    }
    centerNode(transitionTo);
    positionConnections(transitionTo, transitionProgress);
    
    const easedProgress = easeInOutQuad(transitionProgress);
    const currentX = transitionStartX + (transitionEndX - transitionStartX) * easedProgress;
    const currentY = transitionStartY + (transitionEndY - transitionStartY) * easedProgress;
    
	ctx.strokeStyle = "#999";
	  ctx.lineWidth = 2;
	  selectedNode.connections.forEach(connId => {
		const target = nodeMap[connId];
		ctx.beginPath();
		ctx.moveTo(selectedNode.x + selectedNode.w / 2, selectedNode.y + selectedNode.h / 2);
		ctx.lineTo(target.x + target.w / 2, target.y + target.h / 2);
		ctx.stroke();
	  });
	
    drawNode({ ...transitionFrom });
    drawNode({ ...transitionTo, x: currentX, y: currentY });
    ctx.globalAlpha = 1 - easedProgress;
    oldNode.connections.forEach(connId => { if (connId !== selectedNode.id) { drawNode(nodeMap[connId]) }});
    ctx.globalAlpha = 1;
    //selectedNode.connections.forEach(connId => drawNode(nodeMap[connId]));
	
  } else {
  	ctx.strokeStyle = "#999";
	ctx.lineWidth = 2;
	selectedNode.connections.forEach(connId => {
		const target = nodeMap[connId];
		ctx.beginPath();
		ctx.moveTo(selectedNode.x + selectedNode.w / 2, selectedNode.y + selectedNode.h / 2);
		ctx.lineTo(target.x + target.w / 2, target.y + target.h / 2);
		ctx.stroke();
	});
    drawNode(selectedNode);
  }
  

    selectedNode.connections.forEach(connId => drawNode(nodeMap[connId]));

  requestAnimationFrame(render);
}

function drawNode(node) {
  ctx.fillStyle = nodeStyle.fillColor;
  ctx.strokeStyle = nodeStyle.strokeColor;
  ctx.lineWidth = 2;
  ctx.shadowColor = nodeStyle.shadowColor;
  ctx.shadowBlur = nodeStyle.shadowBlur;

  drawRoundedRect(ctx, node.x, node.y, node.w, node.h, nodeStyle.borderRadius);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.stroke();

  ctx.fillStyle = nodeStyle.textColor;
  ctx.font = nodeStyle.font;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  node.lines.forEach((line, i) => {
    const textX = node.x + nodeStyle.padding;
    const textY = node.y + nodeStyle.padding + nodeStyle.lineHeight / 2 + i * nodeStyle.lineHeight;
    ctx.fillText(line, textX, textY);
  });
}

render();
