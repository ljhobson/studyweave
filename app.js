const express = require('express');
require('dotenv').config();

const app = express();
const PORT = 3000;

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT);
    else 
        console.log("Error occurred, server can't start", error);
    }
);

app.get('/', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/index.html");
});

app.get('/design', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/design.html");
});

app.get('/wishlist', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/error.html");
});

app.get('/contribute', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/error.html");
});

app.get('/view', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/view.html");
});

app.get('/profile', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/error.html");
});

app.get('/resources/:resource', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/" + req.params.resource);
});

app.get('/api/generate/:topic', (req, res) => {
console.log("key:");
	console.log(process.env.GEMINI_API_KEY);
	
	const apiKey = "AIzaSyCX1YH07-h1qKuKq1X1az2RkdLAH9yA_uI";

	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
	
	var message = `this is a list of nodes where each node is a concept, and each concpet is linked to other concepts. I want you to create something follwoing the following format for around 20 concepts on the topic ${req.params.topic}. Here is the format:
[
{ "id": 0, "text": "Binary & Data Representation", "connections": [1, 2] },
{ "id": 1, "text": "Logic Gates", "connections": [0, 3] },
{ "id": 2, "text": "Number Systems", "connections": [0, 4] },
] in your response only include the list of nodes, don't supply any extra text aside from the [] around the list`;
	console.log(message);
	const body = {
	  contents: [
		{
		  parts: [
		    {
		      text: message
		    }
		  ]
		}
	  ]
	};

	fetch(url, {
	  method: "POST",
	  headers: {
		"Content-Type": "application/json"
	  },
	  body: JSON.stringify(body)
	})
	.then(res => res.json())
	.then(data => {
		console.log("Gemini response:", data);
		var text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
		console.log(text);
		var cleaned = text
		.replace(/```json|```/g, '')
		.trim();
		var nodes = JSON.parse(cleaned);
		res.status(200);
		var content = JSON.stringify({
			nodeStyle: {"fillColor":"hsl(" + Math.round(Math.random()*360) + ", 70%, 35%)","strokeColor":"#1c5980","textColor":"#fff","font":"16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif","shadowColor":"rgba(0,0,0,0.15)","shadowBlur":8,"borderRadius":8,"padding":12,"maxWidth":180,"lineHeight":20},
			nodes: nodes
		});
		
		res.setHeader('Content-Type', 'text/json');
		res.setHeader('Content-Disposition', `attachment; filename="${req.params.topic}_curriculum.json"`);
		res.send(content);
		
	})
	.catch(err => {
		console.error("Error:", err);
	});
});

app.use((req, res, next) => {
  // If the request accepts HTML (browser), serve index.html fallback
  console.log(req.path)
  if (req.accepts('html')) {
    res.sendFile(__dirname + '/resources/index.html');
  } else {
    next();
  }
});