/**
 * Vaelondrisyl — Mythical Bestiary Engine
 * Dynamic GitHub Pages Creature Auto-Discovery Script
 */

(function () {
  'use strict';

  // Default configuration
  const DEFAULT_CONFIG = {
    owner: 'JaredCraigSmith',
    repo: 'Vaelondrisyl',
    branch: 'main',
    folder: 'Creatures'
  };

  // Local manifest fallback for offline or file:// usage
  const LOCAL_MANIFEST = [
    'Axolcon.jpg',
    'Camraya.jpg',
    'Platyrag.jpg',
    'Seaunglin.jpg'
  ];

  // Image file extensions supported
  const IMAGE_EXT_REGEX = /\.(jpe?g|png|gif|webp|svg|avif)$/i;

  // App State
  const state = {
    config: { ...DEFAULT_CONFIG },
    allCreatures: [],
    filteredCreatures: [],
    viewMode: 'grid', // 'grid' or 'compact'
    sortOption: 'name-asc',
    searchQuery: '',
    currentModalIndex: -1,
    isLiveApi: false
  };

  // DOM Elements
  const elements = {
    gridContainer: document.getElementById('gallery-container'),
    loadingSkeleton: document.getElementById('loading-skeleton'),
    emptyState: document.getElementById('empty-state'),
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search'),
    sortSelect: document.getElementById('sort-select'),
    viewGridBtn: document.getElementById('view-grid'),
    viewCompactBtn: document.getElementById('view-compact'),
    refreshBtn: document.getElementById('refresh-btn'),
    refreshIcon: document.getElementById('refresh-icon'),
    statusBadge: document.getElementById('api-status-badge'),
    statusText: document.getElementById('status-text'),
    visibleCount: document.getElementById('visible-count'),
    totalCount: document.getElementById('total-count'),
    activeFilterTag: document.getElementById('active-filter-tag'),
    resetFilterBtn: document.getElementById('reset-filter-btn'),
    clearSearchEmptyBtn: document.getElementById('clear-search-empty-btn'),

    // Lightbox Modal Elements
    modal: document.getElementById('lightbox-modal'),
    modalClose: document.getElementById('modal-close'),
    modalPrev: document.getElementById('modal-prev'),
    modalNext: document.getElementById('modal-next'),
    modalImage: document.getElementById('modal-image'),
    modalTitle: document.getElementById('modal-title'),
    modalFilename: document.getElementById('modal-filename'),
    modalFilesize: document.getElementById('modal-filesize'),
    modalDownloadBtn: document.getElementById('modal-download-btn'),
    modalGithubLink: document.getElementById('modal-github-link')
  };

  /**
   * Automatically detect repository owner and name from window location
   */
  function autoDetectRepo() {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname.split('/').filter(Boolean);

    // E.g. username.github.io/reponame
    if (hostname.endsWith('.github.io')) {
      const owner = hostname.split('.')[0];
      const repo = pathname[0] || state.config.repo;
      state.config.owner = owner;
      state.config.repo = repo;
    }
  }

  /**
   * Format raw file name to clean creature title
   * e.g., "sea_unglin_dragon.jpg" -> "Sea Unglin Dragon"
   */
  function formatCreatureTitle(filename) {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
    return nameWithoutExt
      .replace(/[-_]/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  /**
   * Format bytes into human-readable size string
   */
  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Fetch Creatures from GitHub REST API with Fallback
   */
  async function fetchCreatures() {
    showLoading(true);
    setApiStatus('loading', 'Scanning Codex...');
    
    const { owner, repo, folder } = state.config;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${folder}`;

    try {
      const response = await fetch(apiUrl, { cache: 'no-cache' });

      if (!response.ok) {
        throw new Error(`GitHub API HTTP ${response.status}`);
      }

      const files = await response.json();
      if (!Array.isArray(files)) {
        throw new Error('API did not return a valid directory array');
      }

      // Filter valid images
      const creatureFiles = files.filter(
        (file) => file.type === 'file' && IMAGE_EXT_REGEX.test(file.name)
      );

      state.allCreatures = creatureFiles.map((file) => ({
        name: file.name,
        title: formatCreatureTitle(file.name),
        size: file.size,
        formattedSize: formatBytes(file.size),
        // Use relative path for local serving resilience or download_url
        imageUrl: `./${folder}/${file.name}`,
        downloadUrl: file.download_url || `./${folder}/${file.name}`,
        githubUrl: file.html_url || `https://github.com/${owner}/${repo}/blob/main/${folder}/${file.name}`
      }));

      state.isLiveApi = true;
      setApiStatus('live', 'Live GitHub Sync');
    } catch (err) {
      console.warn('GitHub API auto-discovery fallback engaged:', err.message);
      
      // Fallback to local manifest
      state.allCreatures = LOCAL_MANIFEST.map((filename) => ({
        name: filename,
        title: formatCreatureTitle(filename),
        size: 0,
        formattedSize: 'Image File',
        imageUrl: `./${folder}/${filename}`,
        downloadUrl: `./${folder}/${filename}`,
        githubUrl: `https://github.com/${owner}/${repo}/blob/main/${folder}/${filename}`
      }));

      state.isLiveApi = false;
      setApiStatus('local', 'Local Bestiary Mode');
    } finally {
      showLoading(false);
      applyFiltersAndRender();
    }
  }

  /**
   * Update API Status Badge
   */
  function setApiStatus(type, label) {
    elements.statusBadge.className = `status-badge ${type}`;
    elements.statusText.textContent = label;
  }

  /**
   * Show/Hide loading skeleton
   */
  function showLoading(isLoading) {
    if (isLoading) {
      elements.gridContainer.classList.add('hidden');
      elements.emptyState.classList.add('hidden');
      elements.loadingSkeleton.classList.remove('hidden');
      elements.refreshIcon.classList.add('spinning');
    } else {
      elements.loadingSkeleton.classList.add('hidden');
      elements.refreshIcon.classList.remove('spinning');
    }
  }

  /**
   * Filter, sort, and render creatures grid
   */
  function applyFiltersAndRender() {
    let result = [...state.allCreatures];

    // Filter by Search Query
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      result = result.filter(
        (c) => c.title.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
      );
      elements.clearSearchBtn.classList.remove('hidden');
      elements.activeFilterTag.classList.remove('hidden');
    } else {
      elements.clearSearchBtn.classList.add('hidden');
      elements.activeFilterTag.classList.add('hidden');
    }

    // Sort Result
    switch (state.sortOption) {
      case 'name-asc':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'name-desc':
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'size-desc':
        result.sort((a, b) => b.size - a.size);
        break;
      case 'size-asc':
        result.sort((a, b) => a.size - b.size);
        break;
    }

    state.filteredCreatures = result;

    // Update Counts
    elements.visibleCount.textContent = result.length;
    elements.totalCount.textContent = state.allCreatures.length;

    // Render HTML
    if (result.length === 0) {
      elements.gridContainer.classList.add('hidden');
      elements.emptyState.classList.remove('hidden');
    } else {
      elements.emptyState.classList.add('hidden');
      elements.gridContainer.classList.remove('hidden');
      renderGrid(result);
    }
  }

  /**
   * Render grid cards
   */
  function renderGrid(creatures) {
    elements.gridContainer.innerHTML = '';
    elements.gridContainer.className = `gallery-grid ${state.viewMode === 'compact' ? 'compact-view' : ''}`;

    creatures.forEach((creature, index) => {
      const card = document.createElement('article');
      card.className = 'creature-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', `View details for ${creature.title}`);

      card.innerHTML = `
        <div class="card-image-wrapper">
          <img src="${creature.imageUrl}" alt="${creature.title}" loading="lazy" onerror="this.src='https://placehold.co/600x600/121a2b/10b981?text=${encodeURIComponent(creature.title)}'">
          <div class="card-overlay">
            <span class="expand-badge"><i class="fa-solid fa-expand"></i></span>
          </div>
        </div>
        <div class="card-info">
          <h3 class="creature-name">${creature.title}</h3>
          <div class="card-meta">
            <span class="card-size"><i class="fa-solid fa-hard-drive"></i> ${creature.formattedSize}</span>
            <span class="card-arrow"><i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => openModal(index));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(index);
        }
      });

      elements.gridContainer.appendChild(card);
    });
  }

  /**
   * Lightbox Modal Functions
   */
  function openModal(index) {
    if (index < 0 || index >= state.filteredCreatures.length) return;

    state.currentModalIndex = index;
    const creature = state.filteredCreatures[index];

    elements.modalImage.src = creature.imageUrl;
    elements.modalImage.alt = creature.title;
    elements.modalTitle.textContent = creature.title;
    elements.modalFilename.textContent = creature.name;
    elements.modalFilesize.textContent = creature.formattedSize;

    elements.modalDownloadBtn.href = creature.downloadUrl;
    elements.modalGithubLink.href = creature.githubUrl;

    elements.modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    elements.modal.classList.add('hidden');
    document.body.style.overflow = '';
    state.currentModalIndex = -1;
  }

  function prevCreature() {
    if (state.currentModalIndex > 0) {
      openModal(state.currentModalIndex - 1);
    } else {
      openModal(state.filteredCreatures.length - 1); // Loop around
    }
  }

  function nextCreature() {
    if (state.currentModalIndex < state.filteredCreatures.length - 1) {
      openModal(state.currentModalIndex + 1);
    } else {
      openModal(0); // Loop around
    }
  }

  /**
   * Bind Event Listeners
   */
  function bindEvents() {
    // Search input
    elements.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      applyFiltersAndRender();
    });

    // Clear search
    elements.clearSearchBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      applyFiltersAndRender();
      elements.searchInput.focus();
    });

    elements.clearSearchEmptyBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      applyFiltersAndRender();
    });

    elements.resetFilterBtn.addEventListener('click', () => {
      elements.searchInput.value = '';
      state.searchQuery = '';
      applyFiltersAndRender();
    });

    // Sort selection
    elements.sortSelect.addEventListener('change', (e) => {
      state.sortOption = e.target.value;
      applyFiltersAndRender();
    });

    // View toggles
    elements.viewGridBtn.addEventListener('click', () => {
      state.viewMode = 'grid';
      elements.viewGridBtn.classList.add('active');
      elements.viewCompactBtn.classList.remove('active');
      applyFiltersAndRender();
    });

    elements.viewCompactBtn.addEventListener('click', () => {
      state.viewMode = 'compact';
      elements.viewCompactBtn.classList.add('active');
      elements.viewGridBtn.classList.remove('active');
      applyFiltersAndRender();
    });

    // Refresh button
    elements.refreshBtn.addEventListener('click', () => {
      fetchCreatures();
    });

    // Modal controls
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalPrev.addEventListener('click', prevCreature);
    elements.modalNext.addEventListener('click', nextCreature);

    // Modal backdrop click to close
    elements.modal.querySelector('.modal-backdrop').addEventListener('click', closeModal);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if (elements.modal.classList.contains('hidden')) return;

      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') prevCreature();
      if (e.key === 'ArrowRight') nextCreature();
    });
  }

  /**
   * Initialize Application
   */
  function init() {
    autoDetectRepo();
    bindEvents();
    fetchCreatures();
  }

  // Start app on DOMReady
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
