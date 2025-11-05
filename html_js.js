

console.log("html_js.js loaded");

// Initialize Map
const map = L.map('map').setView([19.0760, 72.8777], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Navbar scroll effect
document.addEventListener("DOMContentLoaded", function() {
  const navbar = document.getElementById('mainNav');
  
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
});

// Hero carousel auto play
document.addEventListener("DOMContentLoaded", function() {
  const carousel = document.getElementById('heroCarousel');
  if (carousel) {
    const carouselInstance = new bootstrap.Carousel(carousel, {
      interval: 5000,
      ride: 'carousel'
    });
  }
});

// Dark mode toggle
function myFunction() {
  var element = document.body;
  element.classList.toggle("dark-mode");
}

// Search bar functionality
window.addEventListener('DOMContentLoaded', function() {
  // Get elements
  const searchInput = document.getElementById('searchInput');
  const clearBtn = document.getElementById('clearBtn');
  const searcher = document.getElementById('searcher');
  
  // Check if elements exist
  if (!searchInput || !clearBtn || !searcher) {
    console.error('Search elements not found!');
    return;
  }
  
  console.log('Search elements connected:', {
    searchInput: searchInput,
    clearBtn: clearBtn,
    searcher: searcher
  });
  
  // Input event listener
  searchInput.addEventListener('input', function() {
    console.log('Input value:', this.value);
    
    if (this.value.length > 0) {
      clearBtn.style.display = 'flex';
      searcher.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
      searcher.style.transition = 'background-color 0.3s ease';
    } else {
      clearBtn.style.display = 'none';
      searcher.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    }
  });
  
  // Clear button click listener
  clearBtn.addEventListener('click', function() {
    console.log('Clear button clicked');
    searchInput.value = '';
    clearBtn.style.display = 'none';
    searcher.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    searchInput.focus();
  });
  
  // Focus event - change background when focused
  searchInput.addEventListener('focus', function() {
    searcher.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
    searcher.style.borderColor = '#4a9eff';
  });
  
  // Blur event - restore background when not focused
  searchInput.addEventListener('blur', function() {
    if (this.value.length === 0) {
      searcher.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
      searcher.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    }
  });
  
  // Notification click handler
  const notificationIcon = document.querySelector('.notification-icon');
  if (notificationIcon) {
    notificationIcon.addEventListener('click', function() {
      alert('You have 3 new notifications!');
    });
  }
});

// Theme toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  const themeToggle = document.getElementById('themeToggle');
  const body = document.body;
  
  if (themeToggle) {
    // Check for saved theme preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
      body.classList.add('dark-mode');
      themeToggle.checked = true;
    }
    
    // Toggle theme
    themeToggle.addEventListener('change', function() {
      if (this.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
      } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
      }
    });
  }
});

// Close mobile menu when clicking on a link
document.addEventListener('DOMContentLoaded', function() {
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
  const navbarCollapse = document.querySelector('.navbar-collapse');
  
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 992) {
        const bsCollapse = new bootstrap.Collapse(navbarCollapse, {
          toggle: true
        });
      }
    });
  });
});



// DARK MODE

