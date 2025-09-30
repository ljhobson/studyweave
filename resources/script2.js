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

var settings = {};
function updateSettings() {
	document.getElementById("settings-actual-content").innerHTML = `<input type="checkbox">test</input>`;
	checkbox;
}


var xScaleFactor = 2;

var filename = null;
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
				if (res.tags) {
					tags = res.tags;
					tagColours = res.tagColours;
				}
				updateKeys();
				makeBidirectional(nodeData);
				nodeMap = {};
				nodeData.forEach(n => updateNodeDimensions(n));
				nodeData.forEach(n => nodeMap[n.id] = n);
				selected = 0;
				if (nodeData.length > 0) {
					displayNodesAround(selected, degree);
					openSelectedMenu(selected);
				}
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

var tags = [];
var tagColours = [];

function updateKeys() {
	var keys = document.getElementById("keys-content");
	
	var content = "";
	for (var i = 0; i < tags.length; i++) {
		content +=`<div style="color:${tagColours[i]};"><input type="checkbox" id="tag-${tags[i]}" checked onchange="updateTag('${tags[i]}')"></input> ${tags[i]}</div>`;
	}
	if (content === "") {
		content += "<i style='color:#666; font-size:14px;'>There are no tags in this curricula.</i>";
	}
	keys.innerHTML = content;
}

function updateTag(tag) {
	let checkbox = document.getElementById("tag-" + tag);
	for (var j = 0; j < nodes.length; j++) {
		if (nodes[j] && nodes[j].tags.includes(tag)) {
			nodes[j].isDot = !checkbox.checked;
		} else {
			
		}
	}
}

function updateTags() {
	for (var i = 0; i < tags.length; i++) {
		updateTag(tags[i]);
	}
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
	node.x = Math.random();
	node.y = Math.random();
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
	if (allNodes) {
		displayAllNodes();
		return;
	}
	nodes = [];
	var stack = [{distance: 0, node: nodeData[id], parentId: null}];
	var prevSearched = searched;
	searched = [id];
	
	while (stack.length > 0) {
		var current = stack.shift();
		if (!current.node) {
			continue;
		}
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
	
	updateTags();
	
}

function displayAllNodes() {
	nodes = [];
	for (var i = 0; i < nodeData.length; i++) {
		if (nodeData[i]) {
			nodeData[i].size = Math.floor(5 + nodeData[i].connections.length * 5);
			nodes.push(nodeData[i]);
		}
	}
}

function moveTab(i, x, y) {
	var tabs = document.getElementsByClassName("tab-draggable");
	var tab = tabs[i];
	tab.x = x - tab.xoff;
	tab.y = y - tab.yoff;
	
	tab.style.left = tab.x + "px";
	tab.style.top = tab.y + "px";
}

var draggingTab = null;
function createControls() { // most OP function I have ever written - could be more OP if change it to classes instead of ID's
	var tabs = document.getElementsByClassName("tab-controls");
	for (let i = 0; i < tabs.length; i++) {
		let tab = tabs[i];
		let minimize = document.createElement("a");
		tab.appendChild(minimize);
		minimize.classList.add("min-btn");
		document.getElementById(tab.id + "-content").style.display = "inline";
		minimize.onclick = function(event) {
			if (document.getElementById(tab.id + "-content").style.display === "none") {
				document.getElementById(tab.id + "-content").style.display = "inline";
				minimize.classList.remove("max-btn");
			} else {
				document.getElementById(tab.id + "-content").style.display = "none";
				minimize.classList.add("max-btn");
			}
			
		};
		
	}
	
}

function makeDraggable() {
	// make draggable
	var tabs = document.getElementsByClassName("tab-draggable");
	for (let i = 0; i < tabs.length; i++) {
		var tab = tabs[i];
		tab.onmousedown = function(event) {
			console.log(event.target.tagName);
			if (event.target.tagName === "INPUT") {
				return;
			}
			if (!tab.x && !tab.y) {
				tab.x = 0;
				tab.y = 0;
			}
			tab.xoff = (mouse.x*zoom - tab.x - scroll.x*zoom);
			tab.yoff = (mouse.y*zoom - tab.y - scroll.y*zoom);
			draggingTab = i;
		};
	}
}

var filename = null;
window.onload = async function(event) {
	createControls();
	makeDraggable();
	resize();
	var projectId = window.location.pathname.split("/")[2];
	const response = await fetch('/curricula/' + projectId, {
		method: 'GET',
	});
	var res = await response.blob();
	
	// get file name (sus depending on filename content)
	const disposition = response.headers.get('Content-Disposition');
	filename = 'download.json'; // fallback

	if (disposition && disposition.includes('filename=')) {
		const match = disposition.match(/filename="?(.+?)"?$/);
		if (match && match[1]) filename = match[1];
	}
	
	
	var worked = await importCurriculum(res);
	if (worked) {
		update();
		setSaveStatus(true);
	} else {
		window.location.href = "/";
	}
	
}

function setSaveStatus(saved) {
	if (saved) {
		if (!document.getElementById("save-btn").classList.contains("saved")) {
			document.getElementById("save-btn").classList.add("saved");
		}
		document.getElementById("save-btn").innerText = "Saved";
	} else {
		document.getElementById("save-btn").classList.remove("saved");
		document.getElementById("save-btn").innerText = "Save";
	}
}

async function save() {
	var curricula = {};
	curricula.nodes = nodeData;
	curricula.nodeStyle = nodeStyle;
	curricula.tags = tags;
	curricula.tagColours = tagColours;
	
	var projectId = window.location.pathname.split("/")[2];
	const response = await fetch('/curricula/' + projectId, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-filename': filename
		},
		body: JSON.stringify(curricula)
	});
	
	if ([200, 500].includes(response.status)) { // looks bad, but is algs dw
		setSaveStatus(true);
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

function addNode(x, y) {
	if (!(x != undefined && y != undefined)) {
		x = Math.random();
		y = Math.random();
	}
	nodeData.push( { id: nodeData.length, text: "new node", x: x, y: y, size: 5, connections: [], tags: [] });
	selected = nodeData.length-1;
	displayNodesAround(selected, degree);
	openSelectedMenu(selected);
	temperature = 1;
	setSaveStatus(false);
}

function addConnection(i, j) {
	console.log(i, j);
	nodeData[i].connections.push(j);
	nodeData[j].connections.push(i);
	displayNodesAround(i, degree);
	openSelectedMenu(i);
	temperature = 1;
	setSaveStatus(false);
}

function removeConnection(i, j) {
	if (nodeData[i].connections.includes(j)) {
		nodeData[i].connections.splice(nodeData[i].connections.indexOf(j), 1);
	}
	if (nodeData[j].connections.includes(i)) {
		nodeData[j].connections.splice(nodeData[j].connections.indexOf(i), 1);
	}
	displayNodesAround(i, degree);
	openSelectedMenu(i);
	temperature = 1;
	setSaveStatus(false);
}

function tryDelete() {
	if (confirm("Are you sure you want to delete " + nodeData[selected].text + "?")) {
		//nodeData[selected] = undefined;
		canvas.focus();
	}
}

var allNodes = true;

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

var zoom = 1;
var scroll = {x: 0, y: 0, xoff: 0, yoff: 0};
var scrolling = false;

window.onmousemove = function(event) {
	mouse.x = -canvas.width/2 + event.clientX - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	mouse.y = -canvas.height/2 + event.clientY;
	
	
	if (draggingTab !== null) {
		moveTab(draggingTab, mouse.x, mouse.y);
	}
	
	mouse.x /= zoom;
	mouse.y /= zoom;
	
	if (scrolling) {
		scroll.x = -mouse.x - scroll.xoff;
		scroll.y = -mouse.y - scroll.yoff;
	}
	
	mouse.x += scroll.x;
	mouse.y += scroll.y;
	
}

canvas.onmousedown = function(event) {
	mouse.down = true;
	mouse.x = -canvas.width/2 + event.clientX - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	mouse.y = -canvas.height/2 + event.clientY;
	
	mouse.x /= zoom;
	mouse.y /= zoom;
	console.log(event);
	
	mouse.x += scroll.x;
	mouse.y += scroll.y;
	
	
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
			scrolling = false;
			return;
			break;
		}
	}
	
	mouse.x -= scroll.x;
	mouse.y -= scroll.y;
	
	scrolling = true;
	scroll.xoff = -scroll.x - mouse.x;
	scroll.yoff = -scroll.y - mouse.y;
	moving = false;
	selected = false;
	closeSelectedMenu();
}

canvas.onwheel = function(event) {
	zoom *= 1+0.1*(1-2*(event.deltaY>0));
}

window.onmouseup = function(event) {
	mouse.down = false;
	mouse.x = -canvas.width/2 + event.clientX - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	mouse.y = -canvas.height/2 + event.clientY;
	mouse.x /= zoom;
	mouse.y /= zoom;
	
	scrolling = false;
	moving = false;
	draggingTab = null;
}

function openSelectedMenu(i) {
	if (i === undefined) {
		i = selected;
	} else {
		//document.getElementById("search-bar").value = "";
	}
	document.getElementById("selectedName").value = nodes[i].text;
	document.getElementById("selected-tags").value = nodes[i].tags;
	document.getElementsByClassName("selected")[0].style.display = "inline-block";
	var cons = "";
	for (let j = 0; j < nodeData[i].connections.length && j < 500000; j++) {
		var connId = nodeData[i].connections[j];
		if (connId === i || !nodeData[connId]) {
			continue;
		}
		var colour = "#999"; // default grey
		if (nodeData[connId].tags.length > 0) {
			var colIndex = tags.indexOf(nodeData[connId].tags[0]);
			colour = tagColours[colIndex];
			if (colIndex === -1) {
				colour = "#999"; // default grey
			}
		}
		
		cons += `<a class="node" onclick="removeConnection(${i}, ${connId})" style="background-color: ${colour};">${nodeData[connId].text}</a>`;
	}
	if (cons.length === 0) {
		cons = "<i>There are no connections</i>"
	}
	document.getElementById("connections-current").innerHTML = cons;
	var searchTerm = "";
	var searchBar = document.getElementById("search-bar");
	if (searchBar) {
		searchTerm = document.getElementById("search-bar").value;
	}
	cons = "";
	for (let j = 0; j < nodeData.length && j < 500000; j++) {
		if (j === i || !nodeData[j] || nodeData[j].connections.includes(i)) {
			continue;
		}
		if (searchTerm.length > 0) {
			if (!nodeData[j].text.toLowerCase().includes(searchTerm.toLowerCase())) {
				continue;
			}
		}
		var colour = "#999"; // default grey
		if (nodeData[j].tags.length > 0) {
			var colIndex = tags.indexOf(nodeData[j].tags[0]);
			colour = tagColours[colIndex];
			if (colIndex === -1) {
				colour = "#999"; // default grey
			}
		}
		
		cons += `<a class="node" onclick="addConnection(${i}, ${j})" style="background-color: ${colour};">${nodeData[j].text}</a>`;
	}
	if (cons.length === 0) {
		cons = "<i>There are no nodes to add</i>"
	}
	document.getElementById("connections-to-add").innerHTML = cons;
}

function closeSelectedMenu() {
	document.getElementsByClassName("selected")[0].style.display = "none";
}

function updateSelected() {
	nodeData[selected].text = document.getElementById("selectedName").value;
	nodeData[selected].tags = Array(document.getElementById("selected-tags").value);
	setSaveStatus(false);
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
	if (node.tags) {
		if (node.tags.length > 0) {
			var colIndex = tags.indexOf(node.tags[0]);
			ctx.fillStyle = tagColours[colIndex];
			if (colIndex === -1) {
				ctx.fillStyle = "#999"; // default grey
			}
		} else {
			ctx.fillStyle = "#999"; // default grey
		}
		ctx.strokeStyle = "#444";
	}
	ctx.lineWidth = 2 * zoom;
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
		ctx.arc(renderX * zoom, node.y * zoom, 5, 0, Math.PI * 2);
		ctx.fill();
		return;
	}
	
	ctx.font = (8 + Math.ceil(node.size/3)) + "px Arial";
	var textWidth = ctx.measureText(node.text).width;
	ctx.font = (8 + Math.ceil(node.size/3))*zoom + "px Arial";
	
	node.width = textWidth+node.size;
	node.height = node.size+10;
	drawRoundedRect(ctx, canvas.width/2 + (renderX-textWidth/2-node.size/2 - scroll.x) * zoom, canvas.height/2 + (node.y-node.size/2-5 - scroll.y) * zoom, node.width * zoom, node.height * zoom, 5*zoom);
	ctx.fill();
	ctx.shadowBlur = 0;
	if (selected === node.id) {
		ctx.strokeStyle = selectedStyle;
		ctx.lineWidth = 4 * zoom / 2;
		ctx.stroke();
		ctx.strokeStyle = nodeStyle.strokeColor;
		ctx.lineWidth = 2 * zoom / 2;
	}
	ctx.stroke();

	ctx.fillStyle = "#999";
	ctx.textAlign = "left";
	ctx.textBaseline = "middle";
	
	ctx.fillStyle = "#fff";
	ctx.fillText(node.text, canvas.width/2 + (renderX-textWidth/2 - scroll.x) * zoom, canvas.height/2 + (node.y - scroll.y) * zoom);
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
//	if (node.x < -canvas.width/2) {
//		node.x = -canvas.width/2;
//	}
//	if (node.x > canvas.width/2) {
//		node.x = canvas.width/2;
//	}
//	if (node.y < -canvas.height/2) {
//		node.y = -canvas.height/2;
//	}
//	if (node.y > canvas.height/2) {
//		node.y = canvas.height/2;
//	}
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
			
			dx += subject.size*(0/(2 * xScaleFactor) - subject.x) / (100000/speed);
			dy += subject.size*(0/2 - subject.y) / (100000/speed);
			
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
	
	// draw background
	ctx.fillStyle = "#ccc";
	ctx.fillRect(-scroll.x*zoom + canvas.width/2, 0, 2*zoom, canvas.height);
	ctx.fillRect(0, -scroll.y*zoom + canvas.height/2, canvas.width, 2*zoom);
	
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
				ctx.lineTo(canvas.width/2 + (subject.x * xScaleFactor - scroll.x) * zoom, canvas.height/2 + (subject.y - scroll.y) * zoom);
				ctx.lineTo(canvas.width/2 + (target.x * xScaleFactor - scroll.x) * zoom, canvas.height/2 + (target.y - scroll.y) * zoom);
				ctx.stroke();
			}
			ctx.lineWidth = 1 * zoom / 2;
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
