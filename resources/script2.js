var canvas = document.getElementById("canvas");
var ctx = canvas.getContext('2d');

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


var xScaleFactor = 2;

function importCurriculum(file) {
	if (!file) {
		return;
	}
	
	const reader = new FileReader();

	reader.onload = function(event) {
		var res = JSON.parse(event.target.result);
		nodeData = res.nodes;
		nodeStyle = res.nodeStyle;
		makeBidirectional(nodeData);
		nodeMap = {};
		nodeData.forEach(n => updateNodeDimensions(n));
		nodeData.forEach(n => nodeMap[n.id] = n);
		selected = 0;
		displayNodesAround(selected, degree);
		console.log(nodeData);
		console.log("import complete");
//		selectedNode = nodes[0];
//		centerNode(selectedNode);
//		positionConnections(selectedNode, 1);
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
function resize() {
	canvas.width = window.innerWidth - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	canvas.height = window.innerHeight;
//	canvas.width = window.innerWidth;
//	canvas.height = window.innerHeight;
}

var nodeData = [
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
resize();
function updateNodeDimensions(node) {
	node.x = canvas.width/(2 * xScaleFactor) + Math.random();
	node.y = canvas.height/(2) + Math.random();
	if (!node.width) {
		node.width = 0;
	}
	if (!node.height) {
		node.height = 0;
	}
}

for (var i = 0; i < nodeData.length; i++) {
	updateNodeDimensions(nodeData[i]);
}


function generateNodeData() {
	for (var i = 0; i < 200; i++) {
		var cons = [];
		for (var j = 0; j < Math.floor(Math.random() * Math.random() * Math.random() * 50); j++) {
			var number = Math.floor(Math.random() * 200);
			if (!cons.includes(number) && number !== i) {
				cons.push(number);
			}
		}
		nodeData.push( { id:i, x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: Math.floor(5 + cons.length * 5), connections: cons } )
	}
}

var searched = [];
function displayNodesAround(id, degree) {
	nodes = [];
	var stack = [{distance: 0, node: nodeData[id], parentId: null}];
	var prevSearched = searched;
	searched = [id];
	
	while (stack.length > 0) {
		var current = stack.pop();
		var subject = current.node;
		var distance = current.distance;
		var parentId = current.parentId; // for the re arranging if needed
//		console.log(current);
//		console.log(distance);
		subject.isDot = false;
		if (dotsOnFinal && distance === degree) {
			subject.isDot = true;
		}
		subject.degree = distance;
		nodes[subject.id] = (subject);
		if (!prevSearched.includes(subject.id) && parentId) { // re arrange all the new ones
			subject.x = nodes[parentId].x;
			subject.y = nodes[parentId].y;
		}
		// add all connections
		if (distance < degree) {
			for (var i = 0; i < subject.connections.length; i++) {
				var connId = subject.connections[i];
				if (!searched.includes(connId)) {
					stack.push({distance: distance+1, node: nodeData[connId], parentId: subject.id});
					searched.push(connId);
				}
			}
		}
	}
	
	// rejig the sizes
	for (var i = 0; i < nodes.length; i++) {
		if (!nodes[i]) { continue }; // skip over empty ones
		var count = 0; // count the active connections
		for (var j = 0; j < nodes[i].connections.length; j++) {
			if (searched.includes(nodes[i].connections[j])) {
				count++;
			}
		}
		
		nodes[i].size = Math.floor(5 + count * 5);
//		nodes[i].x = nodeData[id].x;
//		nodes[i].y = nodeData[id].y;
	}
	
	nodes[selected].size += 20;
	
}

window.onload = function(event) {
	resize();
	//generateNodeData();
	makeBidirectional(nodeData);
	
	displayNodesAround(selected, degree);
	
	console.log(nodes);
	
//	var size = nodes.length;
//	for (var i = 0; i < size; i++) {
//		for (var j = 0; j < Math.floor(Math.random()*10); j++) {
//			nodes[i].size += 5;
//			nodes.push( { x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: 5, connections: [i] } )
//		}
//	}
	
	update();
}

var degree = 4;
var transDegree = 2;
renderTransparent = true;
var dotsOnFinal = true;
var selected = 0;
var moving = false;
var mouse = {};

window.onmousemove = function(event) {
	mouse.x = event.layerX;
	mouse.y = event.layerY;
}

window.onmousedown = function(event) {
	mouse.down = true;
	mouse.x = event.layerX;
	mouse.y = event.layerY;
	
	for (var i = 0; i < nodes.length; i++) {
		if (!nodes[i]) { continue }; // skip over empty ones
		if (nodes[i].isDot) { continue }; // skip over dots
//		if (mag(mouse, nodes[i]) <= nodes[i].size*nodes[i].size) { // for circles
		var renderX = nodes[i].x * xScaleFactor - nodes[i].width/2;
		var renderY = nodes[i].y - nodes[i].height/2;
		if (mouse.x > renderX && mouse.x < renderX + nodes[i].width && mouse.y > renderY && mouse.y < renderY + nodes[i].height) {
			moving = i;
			selected = i;
			displayNodesAround(selected, degree);
			
			return;
			break;
		}
	}
	
	moving = false;
	selected = false;
}

window.onmouseup = function(event) {
	mouse.down = false;
	mouse.x = event.layerX;
	mouse.y = event.layerY;
	
	moving = false;
}



function makeBidirectional(nodes) {
	for (let i = 0; i < nodes.length; i++) {
		if (!nodes[i]) { continue }; // skip over empty ones
		let node = nodes[i];
		for (let j of node.connections) {
			if (!nodes[j]) { continue }; // skip over empty ones
			if (!nodes[j].connections.includes(i)) {
				nodes[j].connections.push(i);
			}
		}
	}
}

window.onresize = function(event) {
	resize();
}

var speed = 10;
var isRandom = true;
var nodes = [];

function drawNode(node) {
//	var strength = 0;
//	for (var i = 0; i < node.connections.length; i++) {
//		if (!nodes[i]) { continue }; // skip over empty ones
//		var tid = node.connections[i];
//		if (!nodes[tid]) { continue }; // skip over empty ones
//		strength += nodes[tid].size;
//	}
//	strength /= 180;
//	if (strength > 1) {
//		strength = 1;
//	}
//	ctx.fillStyle = `hsl(0, ${strength*50}%, ${strength*50}%)`;
//	ctx.beginPath();
//	ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
//	ctx.fill();
//	
	var renderX = node.x * xScaleFactor;
	ctx.fillStyle = nodeStyle.fillColor;
	ctx.strokeStyle = nodeStyle.strokeColor;
	ctx.lineWidth = 2;
	ctx.shadowColor = nodeStyle.shadowColor;
	ctx.shadowBlur = nodeStyle.shadowBlur;
	if (renderTransparent) {
		ctx.globalAlpha = Math.min(1, 1.2 - (node.degree-(degree-transDegree))/(transDegree));
	} else {
		ctx.globalAlpha = 1;
	}
	if (node.isDot) {
		ctx.fillStyle = nodeStyle.strokeColor;
		ctx.beginPath();
		ctx.arc(renderX, node.y, 5, 0, Math.PI * 2);
		ctx.fill();
		return;
	}
	
	ctx.font = (8 + Math.ceil(node.size/3)) + "px Arial";
	var textWidth = ctx.measureText(node.text).width;
	
	node.width = textWidth+node.size;
	node.height = node.size+10;
	drawRoundedRect(ctx, renderX-textWidth/2-node.size/2, node.y-node.size/2-5, node.width, node.height, 5);
	ctx.fill();
	ctx.shadowBlur = 0;
	ctx.stroke();

	if (selected === node.id) {
		ctx.lineWidth = 2;
		ctx.stroke();
		ctx.lineWidth = 1;
	}

	ctx.fillStyle = "#999";
	ctx.textAlign = "left";
	ctx.textBaseline = "middle";
	
	ctx.fillStyle = "#fff";
	ctx.fillText(node.text, renderX-textWidth/2, node.y);
}

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

function bound(node) {
	if (node.x < 0) {
		node.x = 0;
	}
	if (node.x > canvas.width) {
		node.x = canvas.width;
	}
	if (node.y < 0) {
		node.y = 0;
	}
	if (node.y > canvas.height) {
		node.y = canvas.height;
	}
}

function mag(a, b) {
	return ((b.x-a.x)) ** 2 + (b.y-a.y) ** 2;
}

//function mag(a, b) {
//	if (!a.width) {
//		a.width = 0;
//	}
//	if (!b.width) {
//		b.width = 0;
//	}
//	if (!a.height) {
//		a.height = 0;
//	}
//	if (!b.height) {
//		b.height = 0;
//	}
//	const aLeft = a.x - a.width / 2;
//	const aRight = a.x + a.width / 2;
//	const aTop = a.y - a.height / 2;
//	const aBottom = a.y + a.height / 2;
//
//	const bLeft = b.x - b.width / 2;
//	const bRight = b.x + b.width / 2;
//	const bTop = b.y - b.height / 2;
//	const bBottom = b.y + b.height / 2;
//
//	// Horizontal distance
//	let dx = 0;
//	if (aRight < bLeft) {
//		dx = bLeft - aRight;
//	} else if (bRight < aLeft) {
//		dx = aLeft - bRight;
//	}
//
//	// Vertical distance
//	let dy = 0;
//	if (aBottom < bTop) {
//		dy = bTop - aBottom;
//	} else if (bBottom < aTop) {
//		dy = aTop - bBottom;
//	}
//	dx /= 10;
//	dy /= 10;
//	return dx * dx + dy * dy;
//}

function update() {
	resize();
	
	for (var i = 0; i < nodes.length; i++) {
		if (!nodes[i]) { continue }; // skip over empty ones
		var subject = nodes[i];
		for (var j = 0; j < nodes.length; j++) {
			if (!nodes[j]) { continue }; // skip over empty ones
			var dx = 0;
			var dy = 0;
			if (j === i) {
				//continue;
			}
			var target = nodes[j];
			var group = 1;
			var dist2 = mag(subject, target);
			var tmass = target.size ** 3 / 5000;
			
			var c;
			if (subject.connections.includes(j)) {
				c = -(speed*1*tmass / (0.1 + dist2)); // bigger the distance the smaller the force
			} else {
				c = -(speed*5*tmass / (0.1 + dist2)); // bigger the distance the smaller the force
			}
			
			dx += c*(target.x - subject.x);
			dy += c*(target.y - subject.y);
			
//			subject.x += dx;
//			subject.y += dy;
			
			if (subject.connections.includes(j)) {
				c = (speed*(Math.sqrt(dist2)) / 100000); // bigger the distance the bigger the force
				dx += c*(target.x - subject.x);
				dy += c*(target.y - subject.y);
			}
			
//			subject.x += dx;
//			subject.y += dy;
			
			dx += subject.size*(canvas.width/(2 * xScaleFactor) - subject.x) / (100000/speed);
			dy += subject.size*(canvas.height/2 - subject.y) / (100000/speed);
			
			subject.x += dx;
			subject.y += dy;
			
			bound(subject);
		}
			
		if (moving !== false && moving === i) {
			subject.x = mouse.x / xScaleFactor;
			subject.y = mouse.y;
		}
	}
	
	// draw connections
	for (var i = 0; i < nodes.length; i++) {
		if (!nodes[i]) { continue }; // skip over empty ones
		var subject = nodes[i];
		for (var j = 0; j < nodes.length; j++) {
			if (!nodes[j]) { continue }; // skip over empty ones
			if (subject.connections.includes(j)) {
				ctx.strokeStyle = nodeStyle.strokeColor;
				if (subject.id === selected) {
					//ctx.lineWidth = 10;
				}
				var target = nodes[j];
				ctx.beginPath();
				ctx.lineTo(subject.x * xScaleFactor, subject.y);
				ctx.lineTo(target.x * xScaleFactor, target.y);
				ctx.stroke();
			}
			ctx.lineWidth = 1;
		}
	}
	
	// draw nodes
	for (var i = nodes.length-1; i >= 0 ; i--) {
		if (!nodes[i]) { continue }; // skip over empty ones
		var subject = nodes[i];
		drawNode(subject);
	}
	
	requestAnimationFrame(update);
}
