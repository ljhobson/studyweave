const express = require('express');

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
    res.sendFile(__dirname + "/resources/error.html");
});

app.get('/profile', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/error.html");
});

app.get('/resources/:resource', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/" + req.params.resource);
});

app.use((req, res, next) => {
  // If the request accepts HTML (browser), serve index.html fallback
  if (req.accepts('html')) {
    res.sendFile(__dirname + '/resources/index.html');
  } else {
    next();
  }
});