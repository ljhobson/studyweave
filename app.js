const express = require('express');
const fs = require('fs');

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
var crypto = require('crypto');

require('dotenv').config();

const app = express();
const PORT = 3000; //updated

var mappings = {};
mappings['/'] = 'index.html';
mappings['/design'] = 'design.html';
mappings['/view/:id'] = 'view.html';
mappings['/contribute'] = 'error.html';
mappings['/wishlist'] = 'error.html';
mappings['/login'] = 'login.html';
mappings['/register'] = 'register.html';
mappings['/profile'] = 'profile.html';

var defaultMapping = 'error.html';


const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error("Error opening database:", err);
  } else {
    console.log('Connected to the SQLite database.');
  }
});


db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password TEXT
)`);

db.run(`CREATE TABLE IF NOT EXISTS sessions (
  session_id TEXT PRIMARY KEY,
  user_id INTEGER,
  username TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS user_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  filename TEXT,
  filepath TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id)
)`);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(PORT, (error) =>{
    if(!error)
        console.log("Server is Successfully Running, and App is listening on port "+ PORT);
    else 
        console.log("Error occurred, server can't start", error);
    }
);

app.post('/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  // Hash the password before saving to DB
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: 'Error hashing password.' });
    }

    db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword], function(err) {
      if (err) {
        return res.status(500).json({ message: 'Error saving user.' });
      }
      res.status(201).json({ message: 'User registered successfully.' });
    });
  });
});


app.post('/login', (req, res) => { // shouldn't override a sessionID token, just refresh the time, incase multiple people logged in
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const sql = 'SELECT * FROM users WHERE username = ?';
  db.get(sql, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: 'Error retrieving user.' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    bcrypt.compare(password, user.password, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Error comparing password.' });
      }

      if (result) {
		  // Generate random session ID
		  const sessionId = crypto.randomUUID(); // or use your own function
		  db.run(
			`INSERT INTO sessions (session_id, user_id, username) VALUES (?, ?, ?)`,
			[sessionId, user.id, user.username],
			(err) => {
			  if (err) return res.status(500).json({ message: 'Failed to store session.' });

			  // Set cookie
			  res.setHeader('Set-Cookie', `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=3600`);
			  res.status(200).json({ message: 'Login successful.' });
			}
		  );
	  } else {
        return res.status(400).json({ message: 'Incorrect Password.' });
	  }

    });
  });
});

app.post('/logout', (req, res) => { // shouldn't rely on sessionId tokens to know when logged in
  const sessionId = req.headers.cookie
    ?.split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('sessionId='))
    ?.split('=')[1];

  if (!sessionId) return res.status(200).send('Already logged out');

  db.run(`DELETE FROM sessions WHERE session_id = ?`, [sessionId], () => {
    res.setHeader('Set-Cookie', 'sessionId=; Max-Age=0; Path=/');
    res.status(200).send('Logged out');
  });
});

app.post('/upload-json', async (req, res) => {
  const filename = req.headers['x-filename'];
  if (!filename) {
    return res.status(400).send('Missing filename header');
  }
  
  // Get user_id from session
  const userId = await getUserIdFromSession(req);
  if (!userId) {
    return res.status(401).send('Unauthorized: No valid session');
  }

  const uploadDir = "user-resources/";
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  const filePath = uploadDir + Date.now() + '-' + filename;
  fs.writeFile(filePath, JSON.stringify(req.body), (err) => {
    if (err) {
      console.error('Failed to save file:', err);
      return res.status(500).send('Failed to save file');
    }
    // Insert into user_files table
    db.run(
      `INSERT INTO user_files (user_id, filename, filepath, last_updated) VALUES (?, ?, ?, ?)`,
      [userId, filename, filePath, Date.now()],
      function (dbErr) {
        if (dbErr) {
          console.error('Failed to save file info to DB:', dbErr);
          return res.status(500).send('File saved but failed to save metadata');
        }

        res.send('File uploaded and saved as ' + filePath);
      }
    );
  });
});

app.get('/api/my-files', async (req, res) => {
  const userId = await getUserIdFromSession(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.all(
    'SELECT id, filename, filepath, description, created_at FROM user_files WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, rows) => {
      if (err) {
        console.error('Error fetching user files:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Send JSON array of files
      res.json(rows);
    }
  );
});


// Protected route: only accessible by logged-in users
//app.get('/home', checkAuth, (req, res) => {
//  res.status(200).send(`Welcome, ${req.session.user.username}!`);
//});
//
// Public route: accessible by everyone
//app.get('/public', (req, res) => {
//  res.status(200).send('This is a public page.');
//});

function insertHTML(data, pattern, content) {
	return data.replace(new RegExp(pattern, 's'), `${content}`);
}

function getAttributes(element) {
  element = element.trim();

  const openTagStart = element.indexOf('<');
  const openTagEnd = element.indexOf('>');
  const closeTagStart = element.indexOf('</');

  if (openTagStart === -1 || openTagEnd === -1 || closeTagStart === -1) return {};

  const openTag = element.slice(openTagStart + 1, openTagEnd).trim();
  const parts = openTag.split(/\s+/);
  parts.shift(); // remove the tag name (e.g., 'a')

  const attrs = {};
  for (const part of parts) {
    const [key, val] = part.split('=');
    if (key && val) {
      attrs[key] = val;
    }
  }

  // Extract content between opening and closing tag
  const innerContent = element.slice(openTagEnd + 1, closeTagStart).trim();
  attrs.content = `"${innerContent}"`; // wrap in quotes for consistency

  return attrs;
}

function buildElementFromAttributes(attrs) {
  let attrString = '';
  let content = '';

  for (const key in attrs) {
    if (attrs.hasOwnProperty(key)) {
      if (key === 'content') {
        content = attrs[key].replace(/^"|"$/g, ''); // remove surrounding quotes
      } else {
        attrString += ` ${key}=${attrs[key]}`;
      }
    }
  }

  return `<a${attrString}>${content}</a>`;
}

function isLoggedIn(req) {
	return new Promise((resolve, reject) => {
		const cookie = req.headers.cookie || '';
		const sessionId = cookie.split(';').map(c => c.trim()).find(c => c.startsWith('sessionId='))?.split('=')[1];
		if (!sessionId) return resolve(false);

		db.get('SELECT username FROM sessions WHERE session_id = ?', [sessionId], (err, row) => {
			if (err || !row) {
				return resolve(false);
			}
			return resolve(true);
		});
	});
}

function getUserIdFromSession(req) {
  return new Promise((resolve) => {
    const cookie = req.headers.cookie || '';
    const sessionId = cookie
      .split(';')
      .map(c => c.trim())
      .find(c => c.startsWith('sessionId='))
      ?.split('=')[1];

    if (!sessionId) return resolve(null);

    db.get('SELECT user_id FROM sessions WHERE session_id = ?', [sessionId], (err, row) => {
      if (err || !row) return resolve(null);
      resolve(row.user_id);
    });
  });
}

for (var key in mappings) {
	app.get(key, async (req, res) => {
		var loggedInPromise = isLoggedIn(req); // start running in parallel
		var activeTab = "/" + req.path.split("/")[1];
		try {
			var resPath = mappings[activeTab];
			if (!resPath) {
				resPath = mappings[activeTab + "/:id"];
			}
			console.log(resPath);
			var data = await fs.promises.readFile(__dirname + "/resources/" + resPath, 'utf8');

			var nav = await fs.promises.readFile(__dirname + "/resources/nav.html", 'utf8');
			navItems = nav.split('\n');
			
      		var loggedIn = await loggedInPromise;
			navContent = "";
			for (var i = 0; i < navItems.length; i++) {
				var item = navItems[i];
				var attributes = getAttributes(item);
				if (attributes.href) {
					if (attributes.href.slice(1, -1) === activeTab) {
						attributes.class = '"active"';
						item = buildElementFromAttributes(attributes);
					}
				}
				if ("noauth" in attributes) {
					if (!loggedIn) {
						navContent += item;
					}
				} else if ("auth" in attributes) {
					if (loggedIn) {
						navContent += item;
					}
				} else {
					navContent += item;
				}
			}
			
			var finalHtml = insertHTML(data, `<nav class="nav">.*?<\/nav>`, navContent);

			res.status(200).send(finalHtml);
		} catch (err) {
			res.status(500).send('Error reading the HTML file or content file');
			console.error(err);
		}
	});
}




app.get('/resources/:resource', (req, res) => {
    res.status(200);
    res.sendFile(__dirname + "/resources/" + req.params.resource);
});

app.get('/curricula/:id', async (req, res) => {
	const userId = await getUserIdFromSession(req);
	if (!userId) {
		return res.status(401).json({ error: 'Unauthorized' });
	}
	
	db.all(
		'SELECT id, filename, filepath, created_at FROM user_files WHERE id = ? AND user_id = ? ORDER BY created_at DESC',
		[req.params.id, userId],
		(err, rows) => {
			if (err || rows.length < 1) {
				console.error('Error fetching user files:', err);
				return res.status(500).json({ error: 'Database error' });
			}
			
			console.log(rows[0]);
			res.status(200);
			res.setHeader('Content-Disposition', 'attachment; filename="' + rows[0].filename + '"')
			res.sendFile(__dirname + "/" + rows[0].filepath);
			
		}
	);
	
});

app.post('/api/new-curricula', async (req, res) => {
	
	// Get user_id from session
	const userId = await getUserIdFromSession(req);
	if (!userId) {
		return res.status(401).send('Unauthorized: No valid session');
	}
	
	const uploadDir = "user-resources/";
	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir);
	}
	
	const filename = "new curricula.json";
	const filePath = uploadDir + Date.now() + '-' + filename;

	const emptyCurriculumPath = 'resources/empty_curriculum.json';

	// Read the contents of empty_curriculum.json
	fs.readFile(emptyCurriculumPath, 'utf8', (readErr, data) => {
		if (readErr) {
			console.error('Failed to read empty curriculum file:', readErr);
			return res.status(500).send('Server error: could not read template');
		}

		// Write contents to the new file
		fs.writeFile(filePath, data, (writeErr) => {
			if (writeErr) {
				console.error('Failed to save file:', writeErr);
				return res.status(500).send('Failed to save file');
			}

			// Insert into user_files table
			db.run(
				`INSERT INTO user_files (user_id, filename, filepath, last_updated) VALUES (?, ?, ?, ?)`,
				[userId, filename, filePath, Date.now()],
				function (dbErr) {
					if (dbErr) {
						console.error('Failed to save file info to DB:', dbErr);
						return res.status(500).send('File saved but failed to save metadata');
					}
					
					res.status(200).send({ id: this.lastID });
				}
			);
		});
	});

});

app.post('/curricula/:id', async (req, res) => {
	const filename = req.headers['x-filename'];
	if (!filename) {
		return res.status(400).send('Missing filename header');
	}
	
	// Get user_id from session
	const userId = await getUserIdFromSession(req);
	if (!userId) {
		return res.status(401).send('Unauthorized: No valid session');
	}

	const uploadDir = "user-resources/";
	if (!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir);
	}

	db.all(
		'SELECT filepath FROM user_files WHERE id = ? AND user_id = ? ORDER BY created_at DESC',
		[req.params.id, userId],
		(err, rows) => {
			if (err || rows.length < 1) {
				console.error('Error fetching user files:', err);
				return res.status(500).json({ error: 'Database error' });
			}
			
			console.log(rows[0]);
			const filePath = rows[0].filepath;
			fs.writeFile(filePath, JSON.stringify(req.body), (err) => {
				if (err) {
					console.error('Failed to save file:', err);
					return res.status(500).send('Failed to save file');
				}
				// Update the date - update the last user to update it as well at some point
				db.run(
					`UPDATE user_files SET last_updated = ? WHERE id = ?`,
					[Date.now(), req.params.id],
					function (dbErr) {
						if (dbErr) {
							console.error('Failed to save file info to DB:', dbErr);
							return res.status(500).send('File saved but failed to save metadata');
						}
						
						return res.status(200).send('File saved');
						res.send('File changed and saved as ' + filePath);
					}
				);
			});
		}
	);

});

app.get('/api/generate/:topic', (req, res) => {
	const apiKey = process.env.GEMINI_API_KEY;

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
		// insert keyValues for testing
		for (var i = 0; i < nodes.length; i++) {
			nodes[i].tags = [["idea", "skill", "practical", "equation/law", "literacy/numeracy", "SLO"][i%6]];
		}
		// end keyValues testing
		res.status(200);
		var content = JSON.stringify({
			nodeStyle: {"fillColor":"hsl(" + Math.round(Math.random()*360) + ", 70%, 35%)","strokeColor":"#1c5980","textColor":"#fff","font":"16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif","shadowColor":"rgba(0,0,0,0.15)","shadowBlur":8,"borderRadius":8,"padding":12,"maxWidth":180,"lineHeight":20},
			nodes: nodes,
			tags: ["idea", "skill", "practical", "equation/law", "literacy/numeracy", "SLO"],
			tagColours: ["#f93","#993","#39f","#f39","#399","#93f"]
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
    res.sendFile(__dirname + '/resources/' + defaultMapping);
  } else {
    next();
  }
});
