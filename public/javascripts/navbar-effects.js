document.addEventListener('DOMContentLoaded', function() {
  // Navbar scroll effect
  window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (navbar && window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else if (navbar) {
      navbar.classList.remove('scrolled');
    }
  });

  // Add ripple effect to navbar links
  const navLinks = document.querySelectorAll('.navbar-menu a');

  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = link.getBoundingClientRect();

      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.classList.add('ripple');

      // Remove existing ripples
      const currentRipples = link.querySelectorAll('.ripple');
      currentRipples.forEach(oldRipple => {
        oldRipple.remove();
      });

      link.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  });

  // Optional: Add hover effect for product categories (if they exist)
  const categories = document.querySelectorAll('.navbar-menu .category');
  if (categories.length > 0) {
    categories.forEach(category => {
      const products = category.querySelectorAll('.product-link');

      category.addEventListener('mouseenter', () => {
        products.forEach((product, index) => {
          setTimeout(() => {
            product.classList.add('animated');
          }, index * 50);
        });
      });

      category.addEventListener('mouseleave', () => {
        products.forEach(product => {
          product.classList.remove('animated');
        });
      });
    });
  }

  // Add 'current section' highlight as user scrolls (if there are sections with IDs)
  const sections = document.querySelectorAll('section[id]');
  if (sections.length > 0) {
    window.addEventListener('scroll', highlightCurrentSection);

    function highlightCurrentSection() {
      const scrollPosition = window.scrollY + 100;

      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        const sectionId = section.getAttribute('id');

        const navLink = document.querySelector(`.navbar-menu a[href="#${sectionId}"]`);

        if (navLink && scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
          document.querySelectorAll('.navbar-menu a').forEach(link => {
            link.classList.remove('active');
          });
          navLink.classList.add('active');
        }
      });
    }
  }

  // PERBAIKAN: Navbar toggle functionality - dibuat lebih robust
  const navbar = document.querySelector('.navbar');
  if (!navbar) return; // Keluar jika navbar tidak ditemukan

  // Hapus tombol toggle yang mungkin sudah ada untuk mencegah duplikasi
  const existingToggle = navbar.querySelector('.navbar-toggle');
  if (existingToggle) {
    existingToggle.remove();
  }

  // Buat tombol toggle baru
  const navbarToggle = document.createElement('button');
  navbarToggle.type = "button"; // Pastikan ini adalah button HTML yang valid
  navbarToggle.innerHTML = '<i class="fas fa-bars"></i>';
  navbarToggle.classList.add('navbar-toggle');
  navbarToggle.setAttribute('aria-label', 'Toggle navigation');
  navbarToggle.setAttribute('aria-expanded', 'false');

  // Tambahkan ke awal navbar
  navbar.insertBefore(navbarToggle, navbar.firstChild);

  // Tambahkan event listener dengan event debugging
  navbarToggle.onclick = function(event) {
    // Debug
    console.log('Toggle button clicked');

    // Mencegah event bubbling
    event.preventDefault();
    event.stopPropagation();

    // Toggle navbar class
    navbar.classList.toggle('navbar-expanded');

    // Perbarui aria-expanded untuk aksesibilitas
    const isExpanded = navbar.classList.contains('navbar-expanded');
    navbarToggle.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

    // Ganti ikon berdasarkan state
    navbarToggle.innerHTML = isExpanded ?
      '<i class="fas fa-times"></i>' :
      '<i class="fas fa-bars"></i>';

    return false;
  };

  // Tangani klik di luar navbar untuk menutup menu
  document.addEventListener('click', function(event) {
    // Hanya proses jika navbar expanded dan klik bukan pada navbar atau children-nya
    if (navbar.classList.contains('navbar-expanded') &&
        !navbar.contains(event.target)) {

      navbar.classList.remove('navbar-expanded');
      navbarToggle.innerHTML = '<i class="fas fa-bars"></i>';
      navbarToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Tutup menu navbar ketika link diklik
  const navbarLinks = navbar.querySelectorAll('.navbar-menu a');
  navbarLinks.forEach(link => {
    link.addEventListener('click', function() {
      navbar.classList.remove('navbar-expanded');
      navbarToggle.innerHTML = '<i class="fas fa-bars"></i>';
      navbarToggle.setAttribute('aria-expanded', 'false');
    });
  });
});
