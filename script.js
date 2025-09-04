/**
 * script.js — Interactions & animations for the portfolio
 * - Tabs & keyboard navigation
 * - Modal with focus trap for project details/media
 * - Intersection Observer reveal (staggered)
 * - Background canvas particles + subtle parallax
 * - Card tilt effect on pointer
 * - Nav toggle (mobile) + scroll spy + smooth scroll
 * - Contact form validation (demo)
 *
 * NOTE: This file is intentionally verbose with comments to help you edit
 */

/* -------------------------
   Helpers
   ------------------------- */
const $ = (selector, ctx = document) => ctx.querySelector(selector);
const $$ = (selector, ctx = document) => Array.from((ctx || document).querySelectorAll(selector));
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -------------------------
   On DOM ready
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  setYear();
  initNavToggle();
  initSmoothLinks();
  initTabs();
  initProjectCards();
  initModal();
  initReveal();
  initParticles();
  initTilt();
  initScrollSpy();
  initBackToTop();
});

/* -------------------------
   setYear in footer
   ------------------------- */
function setYear(){
  const y = new Date().getFullYear();
  const el = document.getElementById('year');
  if(el) el.textContent = y;
}

/* -------------------------
   Mobile nav toggle
   ------------------------- */
function initNavToggle(){
  const toggle = document.getElementById('navToggle');
  const list = document.getElementById('navList');
  if(!toggle || !list) return;
  toggle.addEventListener('click', () => {
    const open = list.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });
}

/* -------------------------
   Smooth scroll for internal links
   ------------------------- */
function initSmoothLinks(){
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if(href === '#' || href === '') return;
      const target = document.querySelector(href);
      if(target){
        e.preventDefault();
        target.scrollIntoView({behavior:'smooth', block:'start'});
        // close mobile nav if open
        const nav = document.getElementById('navList');
        const navToggle = document.getElementById('navToggle');
        if(nav && nav.classList.contains('open')){ 
          nav.classList.remove('open'); 
          if (navToggle) navToggle.setAttribute('aria-expanded','false'); 
          document.body.style.overflow=''; 
        }
      }
    });
  });
}

/* -------------------------
   Tabs (XR / SDE) with keyboard
   ------------------------- */
function initTabs(){
  const tabs = $$('.tab');
  if(!tabs.length) return;
  tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => activateTab(idx));
    tab.addEventListener('keydown', (e) => {
      let next = null;
      if(e.key === 'ArrowRight') next = (idx + 1) % tabs.length;
      if(e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length;
      if(e.key === 'Home') next = 0;
      if(e.key === 'End') next = tabs.length - 1;
      if(next !== null){ e.preventDefault(); tabs[next].focus(); activateTab(next); }
    });
  });

  function activateTab(i){
    tabs.forEach((t, j) => {
      const target = t.dataset.target;
      const panel = document.getElementById(`panel-${target}`);
      const active = i === j;
      t.classList.toggle('active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
      if(panel){ panel.classList.toggle('active', active); panel.hidden = !active; }
    });
  }
}

/* -------------------------
   Project cards: click / keyboard to open details
   ------------------------- */
function initProjectCards(){
  const cards = $$('.project-card');
  cards.forEach(card => {
    const handler = (e) => {
      const title = card.dataset.title || card.querySelector('h3')?.textContent || 'Project';
      const desc  = card.dataset.desc || card.querySelector('.short')?.textContent || '';
      const tags  = card.dataset.tags || '';
      const images = card.dataset.images || '';
      openProjectModal({title, desc, tags, images});
    };
    
    // Add event listeners for the project card itself
    card.addEventListener('click', handler);
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });

    // Small detail button inside card (if present)
    const detailBtn = card.querySelector('.detail');
    if(detailBtn) detailBtn.addEventListener('click', (e) => { e.stopPropagation(); handler(); });
    
    // Automatic slideshow for project card thumbnails
    const imagesAttr = card.getAttribute('data-images');
    if (imagesAttr) {
      const images = imagesAttr.split(',').map(url => url.trim());
      const imgElement = card.querySelector('.image-slider img');
      if (images.length > 1 && imgElement) {
        let currentImageIndex = 0;
        imgElement.src = images[currentImageIndex]; // Set initial image
        
        // Use setInterval to change images automatically
        setInterval(() => {
          currentImageIndex = (currentImageIndex + 1) % images.length;
          imgElement.src = images[currentImageIndex];
        }, 3000); // Change image every 3 seconds
      }
    }
  });
}

/* -------------------------
   Modal system (single modal)
   - focus trap
   - supports image slideshow
   ------------------------- */
function initModal(){
  const modal = $('#modal');
  const backdrop = modal?.querySelector('.modal-backdrop');
  const dialog = modal?.querySelector('.modal-dialog');
  const body = modal?.querySelector('#modalBody');
  const closeBtn = modal?.querySelector('.modal-close');
  let lastFocused = null;

  // Close when clicking backdrop
  backdrop?.addEventListener('click', closeModal);
  closeBtn?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => { if(e.key === 'Escape') closeModal(); });

  // helper accessible open/close
  window.openProjectModal = (opts) => {
    openModalWithProject(opts);
  };

  function openModalWithProject({title, desc, tags, images}){
    if(!modal || !body) return;
    lastFocused = document.activeElement;

    const mediaHtml = buildMediaHtml(images);
    const tagsHtml = tags ? `<div class="modal-tags">${escapeHtml(tags)}</div>` : '';
    body.innerHTML = `
      <div class="modal-body-inner" style="display:flex;flex-direction:column;height:100%">
        <div class="modal-media" style="flex:1;display:flex;align-items:center;justify-content:center;background:#000">${mediaHtml}</div>
        <div class="modal-meta" style="padding:18px;background:linear-gradient(180deg,rgba(0,0,0,0.6),#000);color:#fff">
          <h2 style="margin:0 0 8px">${escapeHtml(title)}</h2>
          <p style="margin:0 0 10px;color:rgba(255,255,255,0.9)">${escapeHtml(desc)}</p>
          ${tagsHtml}
        </div>
      </div>
    `;
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();

    const imageList = images ? images.split(',').map(url => url.trim()) : [];
    if (imageList.length > 1) {
      initModalSlideshow(body, imageList);
    }
    
    trapFocus(dialog);
  }

  function buildMediaHtml(images){
    const imageList = images ? images.split(',').map(url => url.trim()) : [];
    let sliderHtml = `<div class="image-slider-modal">`;
    imageList.forEach((url, index) => {
      const activeClass = index === 0 ? ' active' : '';
      sliderHtml += `<img src="${url}" alt="Project image ${index + 1}" class="modal-img${activeClass}" loading="lazy">`;
    });
    // Only add buttons if there are multiple images
    if (imageList.length > 1) {
      sliderHtml += `
        <button id="prevButton" class="modal-slider-btn" data-action="prev" aria-label="Previous image">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6 8 12l6 6 1.41-1.41L10.83 12z"/></svg>
        </button>
        <button id="nextButton" class="modal-slider-btn" data-action="next" aria-label="Next image">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6l-1.41 1.41L12.17 12l-3.58 3.59L10 18l6-6z"/></svg>
        </button>
      `;
    }
    sliderHtml += `</div>`;
    
    return sliderHtml;
  }

  function initModalSlideshow(modalBody, images) {
    const slider = modalBody.querySelector('.image-slider-modal');
    if (!slider) return;

    const imgs = $$('.modal-img', slider);
    let currentImageIndex = 0;
    
    const updateImage = (index) => {
      imgs.forEach((img, i) => {
        img.classList.toggle('active', i === index);
      });
      currentImageIndex = index;
    };

    const prevButton = $('#prevButton', slider); // Select by ID
    const nextButton = $('#nextButton', slider); // Select by ID

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        updateImage((currentImageIndex - 1 + images.length) % images.length);
      });
    }
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        updateImage((currentImageIndex + 1) % images.length);
      });
    }
    
    updateImage(currentImageIndex);
  }

  function closeModal(){
    if(!modal) return;
    modal.classList.remove('open'); modal.setAttribute('aria-hidden','true');
    modal.querySelector('#modalBody').innerHTML = '';
    document.body.style.overflow = '';
    lastFocused?.focus();
    releaseFocus();
  }

  // focus trap implementation
  let focusable = [];
  function trapFocus(container){
    if(!container) return;
    focusable = Array.from(container.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'))
      .filter(n => n.offsetWidth || n.offsetHeight || n.getClientRects().length);
    function handleTab(e){
      if(e.key !== 'Tab') return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
    container.addEventListener('keydown', handleTab);
    container._focusHandler = handleTab;
  }
  function releaseFocus(){
    // remove event listener if any
    const dialog = modal?.querySelector('.modal-dialog');
    if(dialog && dialog._focusHandler) dialog.removeEventListener('keydown', dialog._focusHandler);
    focusable = [];
  }
}

/* -------------------------
   Reveal (IntersectionObserver)
   ------------------------- */
function initReveal(){
  const nodes = $$('[data-section], .reveal, .project-card, .skill-card, .timeline-item');
  if(isReducedMotion){ nodes.forEach(n=>n.classList.add('in-view')); return; }
  if('IntersectionObserver' in window){
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          entry.target.classList.add('in-view');
          o.unobserve(entry.target);
        }
      });
    }, {threshold:0.12});
    nodes.forEach(n => obs.observe(n));
  } else {
    nodes.forEach(n => n.classList.add('in-view'));
  }
}

/* -------------------------
   Particles (canvas): background subtle moving dots
   ------------------------- */
function initParticles(){
  const canvas = document.getElementById('bg-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d', {alpha: true});
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const particles = [];
  const COUNT = Math.max(50, Math.round((w*h)/90000));

  for(let i=0;i<COUNT;i++){
    particles.push({
      x: Math.random()*w,
      y: Math.random()*h,
      r: 0.6 + Math.random()*2,
      vx: (Math.random()-0.5)*0.4,
      vy: (Math.random()-0.5)*0.4,
      hue: 180 + Math.random()*140
    });
  }

  function resize(){
    w = canvas.width = innerWidth;
    h = canvas.height = innerHeight;
  }
  window.addEventListener('resize', throttle(resize, 220));

  let last = performance.now();
  function frame(now){
    const dt = Math.min(40, now - last); last = now;
    ctx.clearRect(0,0,w,h);
    // light vignette
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'rgba(0,0,0,0)');
    g.addColorStop(1,'rgba(0,0,0,0.08)');
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h);

    particles.forEach(p => {
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      if(p.x < -30) p.x = w + 30;
      if(p.x > w + 30) p.x = -30;
      if(p.y < -30) p.y = h + 30;
      if(p.y > h + 30) p.y = -30;

      ctx.beginPath();
      const hue = p.hue + Math.sin(now*0.0002)*40;
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, 0.06)`;
      ctx.arc(p.x, p.y, p.r*2, 0, Math.PI*2);
      ctx.fill();
    });

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* -------------------------
   Card tilt (pointer) subtle 3D parallax
   ------------------------- */
function initTilt(){
  const cards = $$('.project-card');
  cards.forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = (py - 0.5) * 8;
      const ry = (px - 0.5) * -8;
      card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(6px)`;
      const img = card.querySelector('.thumb img');
      if(img) img.style.transform = `translate(${(px-0.5)*8}px, ${(py-0.5)*8}px) scale(1.03)`;
    });
    card.addEventListener('pointerleave', () => {
      card.style.transform = '';
      const img = card.querySelector('.thumb img');
      if(img) img.style.transform = '';
    });
  });
}

/* -------------------------
   Scroll spy: nav highlights
   ------------------------- */
function initScrollSpy(){
  const sections = Array.from($$('main section[id]'));
  const links = $$('.nav-link');
  if(!sections.length) return;
  if('IntersectionObserver' in window){
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${entry.target.id}`));
        }
      });
    }, {threshold: 0.45});
    sections.forEach(s => obs.observe(s));
  } else {
    // fallback: highlight based on scroll position
    window.addEventListener('scroll', throttle(() => {
      const y = window.scrollY;
      sections.forEach(s => {
        if(y >= s.offsetTop - 120){
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${s.id}`));
        }
      });
    }, 120));
  }
}

/* -------------------------
   Back to top
   ------------------------- */
function initBackToTop(){
  const btn = document.getElementById('backToTop');
  if(!btn) return;
  window.addEventListener('scroll', throttle(() => {
    btn.classList.toggle('show', window.scrollY > 600);
  }, 120));
  btn.addEventListener('click', ()=>window.scrollTo({top:0,behavior:'smooth'}));
}

/* -------------------------
   Utilities: throttle, escapeHtml
   ------------------------- */
function throttle(fn, wait=120){
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if(now - last > wait){ last = now; fn(...args); }
  };
}
function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* -------------------------
   Small helper to programmatically open a project modal
   (used by project-card handlers)
   ------------------------- */
function openProjectModal(opts){
  window.openProjectModal && window.openProjectModal(opts);
}

/* Image slideshow functionality */
function initSlideshow(card, images) {
  const slider = card.querySelector('.image-slider');
  if (!slider || images.length <= 1) return;

  const imgElement = slider.querySelector('img');
  let currentImageIndex = 0;

  // Set initial image
  imgElement.src = images[currentImageIndex];

  setInterval(() => {
    currentImageIndex = (currentImageIndex + 1) % images.length;
    imgElement.src = images[currentImageIndex];
  }, 3000); // Change image every 3 seconds
}

/* Image slideshow functionality for modal */
function initModalSlideshow(modalBody, images) {
  const slider = modalBody.querySelector('.image-slider-modal');
  if (!slider) return;

  const imgs = $$('.modal-img', slider);
  let currentImageIndex = 0;
  
  const updateImage = (index) => {
    imgs.forEach((img, i) => {
      img.classList.toggle('active', i === index);
    });
    currentImageIndex = index;
  };

  const prevButton = $('#prevButton', slider); // Select by ID
  const nextButton = $('#nextButton', slider); // Select by ID

  if (prevButton) {
    prevButton.addEventListener('click', () => {
      updateImage((currentImageIndex - 1 + images.length) % images.length);
    });
  }
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      updateImage((currentImageIndex + 1) % images.length);
    });
  }
  
  updateImage(currentImageIndex);
}
/* ... existing code ... */

function initProjectCards(){
  const cards = $$('.project-card');
  cards.forEach(card => {
    const handler = (e) => {
      const title = card.dataset.title || card.querySelector('h3')?.textContent || 'Project';
      const desc  = card.dataset.desc || card.querySelector('.short')?.textContent || '';
      const tags  = card.dataset.tags || '';
      const images = card.dataset.images || '';
      openProjectModal({title, desc, tags, images});
    };
    
    // Add event listeners for the project card itself
    card.addEventListener('click', handler);
    card.addEventListener('keydown', (e) => {
      if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }
    });

    // Small detail button inside card (if present)
    const detailBtn = card.querySelector('.detail');
    if(detailBtn) detailBtn.addEventListener('click', (e) => { e.stopPropagation(); handler(); });
    
    // Automatic slideshow for project card thumbnails
    const imagesAttr = card.getAttribute('data-images');
    if (imagesAttr) {
      const images = imagesAttr.split(',').map(url => url.trim());
      const imgElement = card.querySelector('.image-slider img');
      if (images.length > 1 && imgElement) {
        let currentImageIndex = 0;
        imgElement.src = images[currentImageIndex]; // Set initial image
        
        // Use setInterval to change images automatically
        setInterval(() => {
          currentImageIndex = (currentImageIndex + 1) % images.length;
          imgElement.src = images[currentImageIndex];
        }, 3000); // Change image every 3 seconds
      }
    }
  });
}

/* ... existing code ... */