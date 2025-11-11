// Fetch projects data
fetch('data/projects.json')
  .then(response => response.json())
  .then(projects => {
    const projectList = document.getElementById('project-list');

    projects.forEach(project => {
      const link = document.createElement('a');
      link.href = project.link;
      link.target = '_blank';
      link.classList.add('project-card-link');

      // Create the card container
      const card = document.createElement('div');
      card.classList.add('project-card');

      // Image with fallback
      const img = document.createElement('img');
      img.src = project.image;
      img.alt = project.title;
      img.onerror = () => {
        img.src = 'https://placehold.co/100';
      };

      // Card content
      const content = document.createElement('div');
      content.classList.add('project-content');
      content.innerHTML = `
        <h3>${project.title}</h3>
        <p>${project.description}</p>
      `;

      card.appendChild(img);
      card.appendChild(content);
      link.appendChild(card);
      projectList.appendChild(link);
    });
  })
  .catch(error => {
    console.error('Error loading project data:', error);

    const projectList = document.getElementById('project-list');
    projectList.innerHTML = `
      <a href="#" class="project-card-link">
        <div class="project-card">
          <img src="https://placehold.co/600x400" alt="Default project" />
          <div class="project-content">
            <h3>Example Project</h3>
            <p>Project data could not be loaded. Here's a sample placeholder project.</p>
          </div>
        </div>
      </a>
    `;
  });

const toggleButton = document.getElementById('theme-toggle');
const rootElement = document.documentElement;

// Check saved theme in localStorage
if(localStorage.getItem('theme') === 'dark') {
    rootElement.setAttribute('data-theme', 'dark');
}

// Detect system preference
const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Load saved theme from localStorage, or fallback to system preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    rootElement.setAttribute('data-theme', 'dark');
} else {
    rootElement.setAttribute('data-theme', 'light');
}

// Toggle button
toggleButton.addEventListener('click', () => {
    if (rootElement.getAttribute('data-theme') === 'dark') {
        rootElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
    } else {
        rootElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    }
});
