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

var selectedStyle = "#ff0";


var xScaleFactor = 2;

function importCurriculum(file) {
	if (!file) {
		return Promise.reject("No file provided");
	}
	
	console.log("attempting to import");
	return new Promise((resolve) => {
		const reader = new FileReader();
		
		reader.onload = function(event) {
			try {
				var res = JSON.parse(event.target.result);
				nodeData = res.nodes;
				nodeStyle = res.nodeStyle;
				makeBidirectional(nodeData);
				nodeMap = {};
				nodeData.forEach(n => updateNodeDimensions(n));
				nodeData.forEach(n => nodeMap[n.id] = n);
				selected = 0;
				displayNodesAround(selected, degree);
				openSelectedMenu(selected);
				console.log(nodeData);
				console.log("import complete");
				resolve(true); // RESOLVED
		//		selectedNode = nodes[0];
		//		centerNode(selectedNode);
		//		positionConnections(selectedNode, 1);
			} catch (err) {
				resolve(false); // REJECT
			}
		};
		
		reader.onerror = function() {
			resolve(false); // REJECT
		};
		
		reader.readAsText(file);
	});

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

var nodeData = [];


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
		var current = stack.shift();
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
		
		nodes[i].size = Math.floor(5 + count * 5 - nodes[i].degree * distanceScalingFactor);
		nodes[i].size = Math.max(5, nodes[i].size);
//		nodes[i].x = nodeData[id].x;
//		nodes[i].y = nodeData[id].y;
	}
	
	nodes[selected].size += 20;
	
}

window.onload = async function(event) {
	resize();
	var projectId = window.location.pathname.split("/")[2];
	const response = await fetch('/curricula/' + projectId, {
		method: 'GET',
	});
	var res = await response.blob();
	
	var worked = await importCurriculum(res);
	if (worked) {
		update();
	} else {
		window.location.href = "/";
	}
	
}

function loadNodeData() {
	for (var i = 0; i < nodeData.length; i++) {
		updateNodeDimensions(nodeData[i]);
	}
	
	makeBidirectional(nodeData);
	
	displayNodesAround(selected, degree);
	
	update();
}


var temperature = 1;
var cooling = 0.99;
var boundNodes = false;
var distanceScalingFactor = 0;
var degree = 6;
var transDegree = 2;
var renderTransparent = true;
var dotsOnFinal = true;
var selected = 0;
var moving = false;
var mouse = {};

window.onmousemove = function(event) {
	mouse.x = event.clientX - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	mouse.y = event.clientY;
}

canvas.onmousedown = function(event) {
	mouse.down = true;
	mouse.x = event.clientX - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	mouse.y = event.clientY;
	console.log(event);
	
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
			openSelectedMenu(selected);
			temperature = 1;
			
			return;
			break;
		}
	}
	
	moving = false;
	selected = false;
	closeSelectedMenu();
}

window.onmouseup = function(event) {
	mouse.down = false;
	mouse.x = event.clientX - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	mouse.y = event.clientY;
	
	moving = false;
}

function openSelectedMenu(i) {
	document.getElementById("selectedName").value = nodes[i].text;
	document.getElementsByClassName("selected")[0].style.display = "inline-block";
}

function closeSelectedMenu() {
	document.getElementsByClassName("selected")[0].style.display = "none";
}

function updateSelected() {
	nodeData[selected].text = document.getElementById("selectedName").value;
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
	if (selected === node.id) {
		ctx.strokeStyle = selectedStyle;
		ctx.lineWidth = 4;
		ctx.stroke();
		ctx.strokeStyle = nodeStyle.strokeColor;
		ctx.lineWidth = 2;
	}
	ctx.stroke();

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
	temperature *= cooling;
	
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
			
			subject.x += dx*temperature;
			subject.y += dy*temperature;
			
			if (boundNodes) {
				bound(subject);
			}
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
