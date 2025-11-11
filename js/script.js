// Fetch projects data
fetch('data/projects.json')
  .then(response => response.json())
  .then(projects => {
    const projectList = document.getElementById('project-list');

    projects.forEach(project => {
      const card = document.createElement('div');
      card.classList.add('project-card');

      // Create image element with fallback
      const img = document.createElement('img');
      img.src = project.image;
      img.alt = project.title;

      // If image fails to load, use the placeholder
      img.onerror = () => {
        img.src = 'https://placehold.co/100';
      };

      // Build the rest of the card
      card.innerHTML = `
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <a href="${project.link}" target="_blank">View Project</a>
      `;

      // Insert image before text content
      card.prepend(img);

      projectList.appendChild(card);
    });
  })
  .catch(error => {
    console.error('Error loading project data:', error);

    // Fallback UI if JSON fails completely
    const projectList = document.getElementById('project-list');
    projectList.innerHTML = `
      <div class="project-card">
        <img src="https://placehold.co/600x400" alt="Default project" />
        <h3>Example Project</h3>
        <p>Project data could not be loaded. Here's a sample placeholder project.</p>
      </div>
    `;
  });
