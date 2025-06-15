const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

var nodeStyle = {
//  fillColor: "#8729b9", // purple
//  strokeColor: "#501c89",
  fillColor: "#8029b9", // blue
  strokeColor: "#591c80",
//  fillColor: "#49b967", // green
//  strokeColor: "#2c8940",
  textColor: "#fff",
  font: "16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  shadowColor: "rgba(0,0,0,0.15)",
  shadowBlur: 8,
  borderRadius: 8,
  padding: 12,
  maxWidth: 180,
  lineHeight: 20,
};

var nodes = [
  { id: 0, text: "Binary & Data Representation", connections: [1, 2] },
  { id: 1, text: "Logic Gates", connections: [0, 3] },
  { id: 2, text: "Number Systems", connections: [0, 4] },
  { id: 3, text: "Boolean Algebra", connections: [1, 5] },
  { id: 4, text: "Data Types", connections: [2, 6, 7] },
  { id: 5, text: "Computer Architecture", connections: [3, 8] },
  { id: 6, text: "Variables & Memory", connections: [4, 9] },
  { id: 7, text: "File Storage & Encoding", connections: [4, 10] },
  { id: 8, text: "CPU & Instruction Cycle", connections: [5, 9, 11] },
  { id: 9, text: "Low-Level Programming", connections: [6, 8, 12] },
  { id: 10, text: "Operating Systems", connections: [7, 11, 13] },
  { id: 11, text: "Virtual Memory & Processes", connections: [8, 10] },
  { id: 12, text: "Compilers & Interpreters", connections: [9, 14] },
  { id: 13, text: "Concurrency & Threads", connections: [10, 15] },
  { id: 14, text: "Programming Languages", connections: [12, 16, 17] },
  { id: 15, text: "Parallel Computing", connections: [13, 18] },
  { id: 16, text: "Data Structures", connections: [14, 17, 19] },
  { id: 17, text: "Algorithms", connections: [14, 16, 20] },
  { id: 18, text: "Distributed Systems", connections: [15, 21] },
  { id: 19, text: "Object-Oriented Programming", connections: [16, 22] },
  { id: 20, text: "Algorithm Complexity", connections: [17, 23] },
  { id: 21, text: "Cloud Computing", connections: [18, 24] },
  { id: 22, text: "Software Design Patterns", connections: [19, 25] },
  { id: 23, text: "Search & Sorting", connections: [20] },
  { id: 24, text: "Web Development", connections: [21, 26] },
  { id: 25, text: "Software Engineering", connections: [22, 27] },
  { id: 26, text: "Client-Server Architecture", connections: [24, 28] },
  { id: 27, text: "Testing & Debugging", connections: [25, 29] },
  { id: 28, text: "Networking Protocols", connections: [26, 30] },
  { id: 29, text: "Version Control", connections: [27] },
  { id: 30, text: "Cybersecurity", connections: [28] }
];

var startNode = 4; // in this case


function importCurriculum(file) {
	if (!file) {
		return;
	}
	
	const reader = new FileReader();

	reader.onload = function(event) {
		var res = JSON.parse(event.target.result);
		nodes = res.nodes;
		nodeStyle = res.nodeStyle;
		makeBidirectional(nodes);
		nodeMap = {};
		nodes.forEach(updateNodeDimensions);
		nodes.forEach(n => nodeMap[n.id] = n);
		console.log("import complete");
		selectedNode = nodes[0];
		centerNode(selectedNode);
		positionConnections(selectedNode, 1);
	};
	
	console.log("attempting to import");
	
	reader.readAsText(file);

//	const formData = new FormData();
//	formData.append("myFile", file);
//	console.log(formData);
//	fetch("/upload", {
//		method: "POST",
//		body: formData
//	})
//	.then(response => {
//		if (!response.ok) throw new Error("Upload failed");
//		return response.text();
//	})
//	.then(result => {
//		console.log("Upload successful:", result);
//	})
//	.catch(error => {
//		console.error("Error uploading file:", error);
//	});
}

function generateTopic() {
	var topic = document.getElementById("topic").value;
	if (topic.length > 0) {
		const link = document.createElement('a');
		link.href = '/api/generate/' + topic;
		link.download = ''; // optional: lets browser download instead of navigating
		document.body.appendChild(link);
		link.click();
		link.remove();
	}
}

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

let selectedNode = nodes[startNode];
let oldNode = selectedNode;
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
