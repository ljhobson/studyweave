async function uploadFile(file) {
  
  if (!file) return;

  // Read file text first
  const text = await file.text();

  const response = await fetch('/upload-json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Filename': file.name
    },
    body: text // send the file text directly as JSON string
  });

//  const result = await response.text();
//  document.getElementById('status').innerText = result;
  window.location.href = '/profile';
};


if (window.location.pathname === "/profile") {
	window.onload = async function(event) {
		const response = await fetch('/api/my-files', {
			method: 'GET',
		});
		var res = await response.json();
		
		var content = "";
		for (var i = 0; i < res.length; i++) {
			content += `<div class="card">${res[i].filename}</div>`;
		}
		document.getElementsByClassName("my-curricula")[0].innerHTML = content;
	}
}