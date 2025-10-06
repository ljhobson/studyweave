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
				for (var i = 0; i < nodeData.length; i++) {
					if (nodeData[i]) {
						updateNodeDimensions(nodeData[i])
						nodeData[i].id = i;
					}
				}
				selected = 0;
				if (nodeData.length > 0) {
					displayNodesAround(selected, degree);
					openSelectedMenu(selected);
				}
				console.log(nodeData[0]);
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
	if (!node) {
		return;
	}
	node.x = Math.random()*nodeData.length;
	node.y = Math.random()*nodeData.length;
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
			nodes[i] = (nodeData[i]);
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
				tab.y = -50;
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
		setTitle(filename);
		if (filename === "snake_curriculum.json") {
			snakeMode = true;
		}
		if (snakeMode) {
			snakeInit();
		}
		update();
		setSaveStatus(true);
	} else {
		window.location.href = "/";
	}
	
}

function setTitle(filename) {
	document.getElementsByClassName("curriculum-title")[0].value = filename;
}

function udpateTitle() {
	filename = document.getElementsByClassName("curriculum-title")[0].value;
	setSaveStatus(false);
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
	console.log(filename);
	const response = await fetch('/curricula/' + projectId, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'x-filename': filename
		},
		body: JSON.stringify(curricula)
	});
	
	if ([200].includes(response.status)) {
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

function addNode(x, y, name, tags) {
	if (!(x != undefined && y != undefined)) {
		x = Math.random();
		y = Math.random();
	}
	if (!name) {
		name = "new node";
	}
	if (!tags) {
		tags = [];
	}
	nodeData.push( { id: nodeData.length, text: name, x: x, y: y, size: 5, connections: [], tags: tags });
	selected = nodeData.length-1;
	displayNodesAround(selected, degree);
	openSelectedMenu(selected);
	if (!snakeMode) {
		temperature = 1;
	}
	setSaveStatus(false);
}

function addConnection(i, j) {
	console.log(i, j);
	nodeData[i].connections.push(j);
	nodeData[j].connections.push(i);
	displayNodesAround(i, degree);
	openSelectedMenu(i);
	if (!snakeMode) {
		temperature = 1;
	}
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
	if (!snakeMode) {
		temperature = 1;
	}
	setSaveStatus(false);
}

function tryDelete() {
	if (confirm("Are you sure you want to delete " + nodeData[selected].text + "?")) {
		deleteNode(selected);
	}
}
function deleteNode(selected) {
	for (var i = 0; i < nodeData.length; i++) {
		if (nodeData[i] && nodeData[i].connections.includes(selected)) {
			nodeData[i].connections.splice(nodeData[i].connections.indexOf(selected), 1);
		}
	}
	nodeData[selected] = undefined;
	nodes[selected] = undefined;
	selected = null;
	canvas.focus();
	displayAllNodes();
	setSaveStatus(false);
}

var snakeMode = false;

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
	mouse.screenX = -canvas.width/2 + event.clientX - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	mouse.screenY = -canvas.height/2 + event.clientY;
	
	updateMouse();
}

function updateMouse() {
	if (!mouse.screenX || !mouse.screenY) {
		mouse.screenX = 0;
		mouse.screenY = 0;
	}
	mouse.x = mouse.screenX;
	mouse.y = mouse.screenY;
	
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
	mouse.screenX = -canvas.width/2 + event.clientX - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	mouse.screenY = -canvas.height/2 + event.clientY;
	mouse.x = mouse.screenX;
	mouse.y = mouse.screenY;
	
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
	mouse.screenX = -canvas.width/2 + event.clientX - Math.ceil(document.getElementsByClassName("sidebar")[0]?.getBoundingClientRect().width || 0);
	mouse.screenY = -canvas.height/2 + event.clientY;
	mouse.x = mouse.screenX;
	mouse.y = mouse.screenY;
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
	if (!nodeData[i]) {
		return;
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

function unitify(snake, mouse) {
	if (mouse.x === undefined || mouse.y === undefined) {
		mouse.x = 0;
		mouse.y = 0;
	}
	var dist = Math.sqrt(mag(snake, mouse));
	if (dist === 0) {
		dist = 0.01;
	}
	return {x: (mouse.x - snake.x) / dist, y: (mouse.y - snake.y) / dist};
}
var snake = {};
function snakeInit() {
	snake = {x: 0, y: 0, size: 	11, speed: 1.2, growth: 1, colour: 100, trail: [], direction: {x: 0, y: 0}, dir1: {x: 0, y: 0}, dir2: {x: 0, y: 0}};
	for (var i = 0; i < 15; i++) {
		snake.trail.push({x: snake.x, y: snake.y, size: snake.size});
	}
	
	// spawn some apples
	if (nodeData.length === 0) {
		for (var i = 0; i < 100; i++) {
			addNode(100*(1-2*Math.random()) * canvas.width/xScaleFactor, 100*(1-2*Math.random())*canvas.height, "apple", ["food"]);
		}
	}
	
	zoom = 2;
	
	
	if (!tags.includes("food")) {
		tags.push("food");
		tagColours.push("#e31");
	}
	if (!tags.includes("boss")) {
		tags.push("boss");
		tagColours.push("#a10");
	}
	
	closeSelectedMenu();
}
var spawnBoss = false;
function spawnApple() {
	if (nodeData.length > 100) {
		if (snake.size > 40 && Math.random() < 0.01) {
			spawnBoss = true;
		} else if (!spawnBoss) {
			addNode(snake.x + (1-6*Math.random()*Math.random())*canvas.width/xScaleFactor, snake.y + (1-6*Math.random()*Math.random())*canvas.height, "apple", ["food"]);
		}
	} else {
		for (var i = 0; i < 3; i++) {
			addNode(snake.x + (1-4*Math.random()*Math.random())*canvas.width/xScaleFactor, snake.y + (1-4*Math.random()*Math.random())*canvas.height, "apple", ["food"]);
		}
	}
	if (spawnBoss && nodeData.filter(item => item !== undefined).length < 300) {
		spawnBoss = false;
		addNode(snake.x + 1.5*(1-2*(Math.random() > 0.5))*canvas.width/xScaleFactor / zoom, snake.y + 1.5*(1-2*(Math.random() > 0.5))*canvas.height / zoom, "Boss", ["boss"]);
		for (var i = 0; i < snake.size/4 + 20 * Math.random(); i++) {
			addNode(nodeData[nodeData.length-1-i].x + 100*(1-2*Math.random()), nodeData[nodeData.length-1-i].y + 100*(1-2*Math.random()), "apple", ["boss"]);
			
			addConnection(nodeData.length - 1, nodeData.length - 2 - i);
		}
	}
	for (var i = 0; i < snake.trail.length / 100; i++) {
		var node1 = Math.floor(Math.random() * nodeData.length);
		var min = 9999999999999999;
		var node2 = null;
		for (var j = 0; j < nodeData.length; j++) {
			if (!nodeData[node1] || !nodeData[j]) {
				continue;
			}
			var dist2 = mag(nodeData[node1], nodeData[j]);
			if (dist2 < 100) {
				parent = j;
				break;
			}
			if (dist2 < min) {
				node2 = j;
				min = dist2;
			}
		}
		if (nodes[node1] && nodes[node2]) {
			addConnection(node1, node2);
		}
	}
	
	
	if (!tags.includes("food")) {
		tags.push("food");
		tagColours.push("#e31");
	}
	if (!tags.includes("boss")) {
		tags.push("boss");
		tagColours.push("#a10");
	}
	
	temperature = Math.max(temperature, 0.01);
	
	closeSelectedMenu();
	
}
var counter = 0;
function updateSnake() {
	var movement = unitify(snake, mouse);
	snake.direction = movement;
	snake.eye1 = {x: snake.x + (snake.direction.x * snake.size/2 + snake.direction.y * snake.size/2), y: snake.y + (-snake.direction.x * snake.size/2 + snake.direction.y * snake.size/2)};
	snake.eye2 = {x: snake.x + (snake.direction.x * snake.size/2 - snake.direction.y * snake.size/2), y: snake.y + (snake.direction.x * snake.size/2 + snake.direction.y * snake.size/2)};
	snake.closest1 = null;
	snake.closest2 = null;
	var min1 = 999999999999;
	var min2 = 999999999999;
	for (var i = 0; i < nodes.length; i++) {
		if (!nodes[i]) {
			continue;
		}
		var scaledSnake = {x: snake.x / xScaleFactor, y: snake.y};
		var dist2 = mag(scaledSnake, nodes[i]);
		var tmass = nodes[i].size ** 2 / 5000;
		var c = 1 * ((Math.log(snake.size*nodes[i].size*speed) ** 0.5) / (0.1 + dist2*2));
		var dx = c*(nodes[i].x - scaledSnake.x);
		var dy = c*(nodes[i].y - scaledSnake.y);
		nodes[i].x += 5*dx;
		nodes[i].y += 5*dy;
		if (snake.size <= nodes[i].size) {
			snake.x -= dx;
			snake.y -= dy;
		}
		if (dist2 <= (snake.size*0.98) ** 2 && snake.size > nodes[i].size) {
			var gained = (nodes[i].size ** 2) / (snake.size ** 2) * snake.growth * 8;
			snake.size += gained;
			for (var j = 0; j < gained * 3; j++) {
				snake.trail.push({x: snake.trail[snake.trail.length-1].x, y: snake.trail[snake.trail.length-1].y, size: snake.trail[snake.trail.length-1].size});
			}
			snake.speed = (snake.trail.length / 100 + 1.2);
			nodeData[i].markedForEat = 1;
			deleteNode(i);
			spawnApple();
			counter++;
			zoom *= 0.99 + 0.005 * (2 - zoom);
			continue;
		}
		
		// calculate closest to the eyes
		if (snake.closest1 === null || mag({x: snake.eye1.x / xScaleFactor, y: snake.eye1.y}, nodes[i]) < min1) {
			min1 = mag({x: snake.eye1.x / xScaleFactor, y: snake.eye1.y}, nodes[i]);
			snake.closest1 = i;
		}
		if (snake.closest2 === null || mag({x: snake.eye2.x / xScaleFactor, y: snake.eye2.y}, nodes[i]) < min2) {
			min2 = mag({x: snake.eye2.x / xScaleFactor, y: snake.eye2.y}, nodes[i]);
			snake.closest2 = i;
		}
		
	}
	if (mag(snake, mouse) <= snake.size * snake.size) {
		return;
	}
	snake.x += movement.x * snake.speed;
	snake.y += movement.y * snake.speed;
	snake.eye1 = {x: snake.x + (snake.direction.x * snake.size/2 + snake.direction.y * snake.size/2), y: snake.y + (-snake.direction.x * snake.size/2 + snake.direction.y * snake.size/2)};
	snake.eye2 = {x: snake.x + (snake.direction.x * snake.size/2 - snake.direction.y * snake.size/2), y: snake.y + (snake.direction.x * snake.size/2 + snake.direction.y * snake.size/2)};
	//update trail
	snake.trail[0].x = snake.x;
	snake.trail[0].y = snake.y;
	snake.trail[0].size = snake.size;
	for (var i = snake.trail.length - 1; i > 0; i--) {
		snake.trail[i].x = (snake.trail[i-1].x + snake.trail[i].x) / 2;
		snake.trail[i].y = (snake.trail[i-1].y + snake.trail[i].y) / 2;
		snake.trail[i].size = (snake.trail[i-1].size + snake.trail[i].size) / 2;
	}
}
function drawSnake() {
	var snakeX = (snake.x - scroll.x) * zoom + canvas.width/2;
	var snakeY = (snake.y - scroll.y) * zoom + canvas.height/2;
	
	ctx.fillStyle = "#000";
	for (var i = snake.trail.length - 1; i > 0; i--) {
		ctx.fillStyle = `hsl(${snake.colour + i + 30}, 80%, 20%)`;
		ctx.beginPath();
		ctx.arc((snake.trail[i].x - scroll.x) * zoom + canvas.width/2, (snake.trail[i].y - scroll.y) * zoom + canvas.height/2, snake.trail[i].size * zoom * 1.1, 0, 2*Math.PI);
		ctx.fill();
	}
	ctx.beginPath();
	ctx.arc(snakeX, snakeY, snake.size * zoom * 1.1, 0, 2*Math.PI);
	ctx.fill();
	
	for (var i = snake.trail.length - 1; i > 0; i--) {
		ctx.fillStyle = `hsl(${snake.colour + i}, 80%, 50%)`;
		ctx.beginPath();
		ctx.arc((snake.trail[i].x - scroll.x) * zoom + canvas.width/2, (snake.trail[i].y - scroll.y) * zoom + canvas.height/2, snake.trail[i].size * zoom, 0, 2*Math.PI);
		ctx.fill();
	}
	ctx.beginPath();
	ctx.arc(snakeX, snakeY, snake.size * zoom, 0, 2*Math.PI);
	ctx.fill();
	
	var eyeRadius = snake.size * 0.25;
	
	var eye1 = snake.eye1;
	var eye2 = snake.eye2;
	ctx.lineWidth = zoom * eyeRadius * 0.4;
	ctx.strokeStyle = "#000";
	ctx.fillStyle = "#fff";
	ctx.beginPath();
	ctx.arc((eye1.x - scroll.x) * zoom + canvas.width/2, (eye1.y - scroll.y) * zoom + canvas.height/2, snake.size * 0.5 * zoom, 0, 2*Math.PI);
	ctx.fill();
	ctx.stroke();
	ctx.beginPath();
	ctx.arc((eye2.x - scroll.x) * zoom + canvas.width/2, (eye2.y - scroll.y) * zoom + canvas.height/2, snake.size * 0.5 * zoom, 0, 2*Math.PI);
	ctx.fill();
	ctx.stroke();
	
	if (snake.closest1 !== null && nodes[snake.closest1]) {
		dir1New = unitify({x: snake.eye1.x / xScaleFactor, y: snake.eye1.y}, nodes[snake.closest1]);
		snake.dir1 = {x: (snake.dir1.x + dir1New.x) / 2, y: (snake.dir1.y + dir1New.y) / 2};
	} else {
		dir1New = unitify(snake.eye1, mouse);
		snake.dir1 = {x: (snake.dir1.x + dir1New.x) / 2, y: (snake.dir1.y + dir1New.y) / 2};
	}
	if (snake.closest2 !== null && nodes[snake.closest2]) {
		dir2New = unitify({x: snake.eye2.x / xScaleFactor, y: snake.eye2.y}, nodes[snake.closest2]);
		snake.dir2 = {x: (snake.dir2.x + dir2New.x) / 2, y: (snake.dir2.y + dir2New.y) / 2};
	} else {
		dir2New = unitify(snake.eye2, mouse);
		snake.dir2 = {x: (snake.dir2.x + dir2New.x) / 2, y: (snake.dir2.y + dir2New.y) / 2};
	}
	ctx.fillStyle = "#000";
	ctx.beginPath();
	ctx.arc((eye1.x - scroll.x + snake.dir1.x * eyeRadius) * zoom + canvas.width/2, (eye1.y - scroll.y + snake.dir1.y * eyeRadius) * zoom + canvas.height/2, snake.size * 0.2 * zoom, 0, 2*Math.PI);
	ctx.fill();
	ctx.beginPath();
	ctx.arc((eye2.x - scroll.x + snake.dir2.x * eyeRadius) * zoom + canvas.width/2, (eye2.y - scroll.y + snake.dir2.y * eyeRadius) * zoom + canvas.height/2, snake.size * 0.2 * zoom, 0, 2*Math.PI);
	ctx.fill();
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
	
	// draw snake
	if (snakeMode) {
		updateSnake();
		drawSnake();
		if (!scrolling) {
			scroll.x = (scroll.x * 15 + snake.x) / 16;
			scroll.y = (scroll.y * 15 + snake.y) / 16;
			updateMouse();
		}
	}
	
	requestAnimationFrame(update);
}
