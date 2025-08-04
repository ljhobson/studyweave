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

function openProject(projectId) {
	window.location.href = '/view/' + projectId;
}


if (window.location.pathname === "/profile") {
	window.onload = async function(event) {
		const response = await fetch('/api/my-files', {
			method: 'GET',
		});
		var res = await response.json();
		
		var content = `<div class="cards-container">`;
		for (var i = 0; i < res.length; i++) {
			var item = res[i];
			if (!item.description) {
				item.description = "<i>no description</i>";
			}
			content += `<div class="card" onclick="openProject(${item.id})"><b>${item.filename}</b><p>${item.description}</p></div>`;
		}
		content += "</div>";
		document.getElementsByClassName("my-curricula")[0].innerHTML = content;
	}
}