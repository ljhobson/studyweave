async function handleLogin(event) {
	event.preventDefault(); // prevent regular form submission
	
	var form = document.getElementsByClassName("login-form")[0];
    const username = form.username.value.trim();
    const password = form.password.value;
	
	
    const response = await fetch('/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username, password: password })
    });

    const result = await response.json();
	
	var messageBox = document.getElementById("message-box");
	
    if (response.ok) {
      messageBox.textContent = 'Login successful!';
      messageBox.style.color = 'green';
      // Redirect or update UI
      window.location.href = '/';
    } else {
      messageBox.textContent = result.message;
      messageBox.style.color = 'red';
    }
}

async function handleRegister(event) {
	event.preventDefault(); // prevent regular form submission
	
	var form = document.getElementsByClassName("login-form")[0];
    const username = form.username.value.trim();
    const password = form.password.value;
	
	
    const response = await fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username: username, password: password })
    });

    const result = await response.json();
	
	var messageBox = document.getElementById("message-box");
	
    if (response.ok) {
      messageBox.textContent = 'Register successful!';
      messageBox.style.color = 'green';
      // Redirect or update UI
      window.location.href = '/login?message=registered';
    } else {
      messageBox.textContent = result.message;
      messageBox.style.color = 'red';
    }
    
    
}

async function logout(event) {
	event.preventDefault();
	const response = await fetch('/logout', {
      method: 'POST'
    });
    if (response.ok) {
      window.location.href = '/';
    }
}

if (window.location.pathname === "/login") {
	window.onload = function(event) {
		const params = new URLSearchParams(window.location.search);
		const msg = params.get('message');

		if (msg === 'registered') {
			const messageBox = document.getElementById('message-box');
			if (messageBox) {
				messageBox.textContent = '✅ Registered successfully! Please log in.';
				messageBox.style.color = 'green';
			}
		}
	}
}



















