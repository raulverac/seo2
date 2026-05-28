document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initLogin();
    initScanner();
    loadGSCProperties(); // Load real properties if connected
    initExportPDF();
    initSidebarNav(); // New
    initSFUpload();
});

function checkAuth() {
    const isAuth = localStorage.getItem('seo_admin_auth');
    if (isAuth === 'true') {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
    } else {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('mainApp').style.display = 'none';
    }
}

function initLogin() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        // Simple security gate (can be updated to more robust method if needed)
        if (user === 'admin' && pass === 'seo2026') {
            localStorage.setItem('seo_admin_auth', 'true');
            checkAuth();
        } else {
            errorDiv.style.display = 'block';
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 3000);
        }
    });
}

function logout() {
    localStorage.removeItem('seo_admin_auth');
    window.location.reload();
}

function initSidebarNav() {
    const navLinks = document.querySelectorAll('.sidebar .nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const isCollapseToggle = this.hasAttribute('data-bs-toggle');
            
            if (!href || href === '#' || isCollapseToggle) return;
            
            e.preventDefault();
            const targetId = href.substring(1);
            
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            showView(targetId);
        });
    });

    // Mostrar vista activa al iniciar
    const activeLink = document.querySelector('.sidebar .nav-link.active');
    if (activeLink) {
        const href = activeLink.getAttribute('href');
        if (href && href.startsWith('#')) {
            showView(href.substring(1));
        }
    }
}

let lastSFData = null;

function showView(targetId) {
    if (!targetId) return;
    
    const sections = document.querySelectorAll('.dashboard-section');
    sections.forEach(el => {
        el.style.setProperty('display', 'none', 'important');
    });

    if (targetId === 'gscPerformanceSection') {
        ['gscPerformanceSection', 'gscDetailsSection', 'gscPagesSection'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.setProperty('display', (id.includes('Details') || id.includes('Pages')) ? 'flex' : 'block', 'important');
        });
    } else {
        if (targetId === 'screamingFrogSection') {
            const sfSection = document.getElementById('screamingFrogSection');
            const scanner = document.querySelector('.card.mb-4'); // El escáner
            if (sfSection && scanner) {
                scanner.after(sfSection); // Lo posiciona justo debajo del buscador
            }
            if (!healthScoreChart) initSFCharts();
            if (lastSFData) updateSFUI(lastSFData);
        }
        const el = document.getElementById(targetId);
        if (el) {
            const displayMode = (targetId.includes('Details') || targetId.includes('Pages') || targetId === 'keywordSection') ? 'flex' : 'block';
            el.style.setProperty('display', displayMode, 'important');
        }
    }
}

// Fetch GSC Properties from Backend
async function loadGSCProperties() {
    try {
        const response = await fetch('http://localhost:3000/api/sites');
        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('domainInput');
            
            if (data.sites && data.sites.length > 0) {
                const currentSelection = select.value;
                // Clear existing options except placeholder
                select.innerHTML = '<option value="" disabled' + (!currentSelection ? ' selected' : '') + '>Selecciona una propiedad...</option>';
                data.sites.forEach(site => {
                    const option = document.createElement('option');
                    option.value = site;
                    option.textContent = site.replace(/https?:\/\//, '').replace(/\/$/, '');
                    if (site === currentSelection) option.selected = true;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.log('GSC properties not loaded (user might not be connected yet)');
    }
}

// Mock GSC data for demonstration
function initGSCMock() {
    const mockData = {
        clicks: '1,240',
        impressions: '45.2K',
        ctr: '2.74%',
        position: '12.4',
        queries: [
            { query: 'consultoria seo madrid', clicks: 156, impressions: 1200, position: 3.2 },
            { query: 'mejor agencia marketing', clicks: 98, impressions: 4500, position: 8.5 },
            { query: 'herramientas seo 2024', clicks: 87, impressions: 800, position: 1.2 },
            { query: 'auditoria web gratis', clicks: 65, impressions: 2100, position: 5.4 },
            { query: 'posicionamiento organico google', clicks: 42, impressions: 3200, position: 15.1 }
        ],
        countries: [
            { country: 'España', clicks: 850, percentage: 68 },
            { country: 'México', clicks: 120, percentage: 10 },
            { country: 'Colombia', clicks: 95, percentage: 8 },
            { country: 'Argentina', clicks: 75, percentage: 6 },
            { country: 'Chile', clicks: 50, percentage: 4 }
        ],
        pages: [
            { url: '/servicios/seo-tecnico', clicks: 450, impressions: 8500, ctr: '5.2%', position: 2.1 },
            { url: '/blog/como-posicionar-web', clicks: 320, impressions: 12400, ctr: '2.5%', position: 5.4 },
            { url: '/', clicks: 280, impressions: 15000, ctr: '1.8%', position: 8.2 },
            { url: '/contacto', clicks: 150, impressions: 2100, ctr: '7.1%', position: 1.5 },
            { url: '/casos-de-exito', clicks: 40, impressions: 7200, ctr: '0.5%', position: 12.8 }
        ],
        indexing: {
            indexed: 452,
            notIndexed: 84,
            history: [400, 410, 425, 430, 440, 445, 452]
        }
    };
    updateGSCUI(mockData);
}

function updateGSCUI(data) {
    // Populate data regardless of visibility
    if (data.clicks) document.getElementById('gscClicks').innerText = data.clicks;
    if (data.impressions) document.getElementById('gscImpressions').innerText = data.impressions;
    if (data.ctr) document.getElementById('gscCtr').innerText = data.ctr;
    if (data.position) document.getElementById('gscPosition').innerText = data.position;


    if (data.queries) {
        const tbody = document.getElementById('gscQueriesTable');
        if (tbody) {
            tbody.innerHTML = data.queries.map(q => `
                <tr>
                    <td class="fw-medium">${q.query || q.kw || '--'}</td>
                    <td class="text-center">${q.clicks}</td>
                    <td class="text-center">${q.impressions}</td>
                    <td class="text-center"><span class="badge-position">${q.position}</span></td>
                </tr>
            `).join('');
        }
    }

    if (data.countries) {
        const tbody = document.getElementById('gscCountriesTable');
        
        // Helper to convert GSC 3-letter code to 2-letter flag code and full name
        const countryCodes = {
            'chl': { id: 'cl', name: 'Chile' },
            'esp': { id: 'es', name: 'España' },
            'mex': { id: 'mx', name: 'México' },
            'usa': { id: 'us', name: 'Estados Unidos' },
            'col': { id: 'co', name: 'Colombia' },
            'arg': { id: 'ar', name: 'Argentina' },
            'per': { id: 'pe', name: 'Perú' },
            'ven': { id: 've', name: 'Venezuela' },
            'bra': { id: 'br', name: 'Brasil' },
            'ury': { id: 'uy', name: 'Uruguay' },
            'bol': { id: 'bo', name: 'Bolivia' },
            'ecu': { id: 'ec', name: 'Ecuador' },
            'pan': { id: 'pa', name: 'Panamá' },
            'cri': { id: 'cr', name: 'Costa Rica' },
            'dom': { id: 'do', name: 'Rep. Dominicana' },
            'gtm': { id: 'gt', name: 'Guatemala' },
            'hnd': { id: 'hn', name: 'Honduras' },
            'slv': { id: 'sv', name: 'El Salvador' },
            'nic': { id: 'ni', name: 'Nicaragua' },
            'pry': { id: 'py', name: 'Paraguay' },
            'can': { id: 'ca', name: 'Canadá' },
            'gbr': { id: 'gb', name: 'Reino Unido' },
            'fra': { id: 'fr', name: 'Francia' },
            'deu': { id: 'de', name: 'Alemania' },
            'ita': { id: 'it', name: 'Italia' }
        };

        if (tbody) {
            tbody.innerHTML = data.countries.map(c => {
                const gscCode = c.country.toLowerCase();
                const info = countryCodes[gscCode] || { id: gscCode.substring(0, 2), name: c.country };
                const flagUrl = `https://flagcdn.com/w20/${info.id}.png`;
                
                return `
                <tr>
                    <td>
                        <div class="d-flex align-items-center">
                            <img src="${flagUrl}" width="20" height="15" class="me-2 rounded-sm shadow-sm" alt="${info.name}" onerror="this.src='https://flagcdn.com/w20/un.png'">
                            <span>${info.name}</span>
                        </div>
                    </td>
                    <td class="text-center fw-bold">${c.clicks}</td>
                    <td class="text-center">
                        <div class="d-flex align-items-center justify-content-center">
                            <span class="me-2 small" style="min-width: 35px;">${c.percentage}%</span>
                            <div class="progress w-100 bg-light" style="height: 4px; max-width: 50px;">
                                <div class="progress-bar" role="progressbar" style="width: ${c.percentage}%; background-color: #4e73df;"></div>
                            </div>
                        </div>
                    </td>
                </tr>
            `}).join('');
        }
    }

    if (data.pages) {
        const tbody = document.getElementById('gscPagesTable');
        if (tbody) {
            tbody.innerHTML = data.pages.map(p => `
                <tr>
                    <td class="text-truncate" style="max-width: 250px;"><a href="#" class="text-decoration-none small" style="color: #4e73df;">${p.url}</a></td>
                    <td class="text-center fw-bold">${p.clicks}</td>
                    <td class="text-center opacity-75">${p.impressions}</td>
                    <td class="text-center" style="color: var(--accent-lime);">${p.ctr || '--'}</td>
                    <td class="text-center"><span class="badge-position">${p.position}</span></td>
                </tr>
            `).join('');
        }
    }

    if (data.indexing) {
        if (!indexingDonut) initIndexingCharts();
        updateIndexingUI(data.indexing);
    }

    if (data.cwv) {
        updateCWVUI(data.cwv);
    }

    if (data.ga) {
        updateAnalyticsUI(data.ga);
    }

    // Actualizar vista activa
    const activeLink = document.querySelector('.sidebar .nav-link.active');
    if (activeLink) {
        const targetId = activeLink.getAttribute('href').substring(1);
        showView(targetId);
    }
}

// Initialize Scanner Form
function initScanner() {
    const scanForm = document.getElementById('scanForm');
    if (!scanForm) return;

    scanForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const domainInput = document.getElementById('domainInput').value;
        const btn = document.getElementById('btnScan');
        
        // Configurar estado de carga
        const originalBtnHTML = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Escaneando...';
        btn.disabled = true;

        // Extraer hostname para mostrar (ej: google.com)
        let hostname = domainInput;
        try {
            hostname = new URL(domainInput).hostname;
        } catch(err) {
            // Si falla el parseo, usamos el texto original
        }

        // Llamada REAL al Backend
        fetch('http://localhost:3000/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: domainInput })
        })
        .then(response => response.json())
        .then(data => {
            // Restaurar botón
            btn.innerHTML = originalBtnHTML;
            btn.disabled = false;

            if(data.error) {
                alert('Error: ' + data.error);
                return;
            }

            // Actualizar tabla de palabras clave si hay datos reales
            if (data.metrics.topKeywords) {
                const tbody = document.getElementById('keywordsTable');
                let html = '';
                data.metrics.topKeywords.forEach(k => {
                    // Si viene de GSC real, el formato es diferente
                    const kwName = k.query || k.kw;
                    const kwClicks = k.clicks || k.vol;
                    const kwPos = k.position || k.diff;
                    const kwRank = k.rank || ('Pos: #' + Math.round(kwPos));

                    let badgeClass = kwPos < 10 ? 'bg-success' : 'bg-info';
                    html += `
                        <tr>
                            <td class="fw-medium text-dark"><i class="bi bi-google me-1 text-primary"></i> ${kwName}</td>
                            <td>${kwClicks}</td>
                            <td><span class="badge ${badgeClass}">${kwRank}</span></td>
                            <td>
                                <div class="d-flex flex-column">
                                    <span class="text-primary fw-bold">${k.comp || 'Tu Sitio'}</span>
                                    <small class="text-success fw-semibold"><i class="bi bi-star-fill"></i> ${kwRank}</small>
                                </div>
                            </td>
                        </tr>
                    `;
                });
                tbody.innerHTML = html;

            }
            
            // Actualizar Dashboard (GSC, CWV, GA)
            if (data.metrics) {
                const gscData = {
                    clicks: data.metrics.gscPerformance ? data.metrics.gscPerformance.clicks : null,
                    impressions: data.metrics.gscPerformance ? data.metrics.gscPerformance.impressions : null,
                    ctr: data.metrics.gscPerformance ? data.metrics.gscPerformance.ctr : null,
                    position: data.metrics.gscPerformance ? data.metrics.gscPerformance.position : null,
                    queries: data.metrics.topKeywords,
                    countries: data.metrics.gscCountries,
                    pages: data.metrics.gscPages,
                    indexing: data.metrics.gscIndexing,
                    cwv: data.metrics.cwv,
                    ga: data.metrics.ga
                };
                updateGSCUI(gscData);
                if (data.metrics.screamingFrog) {
                    if (!healthScoreChart) initSFCharts();
                    updateSFUI(data.metrics.screamingFrog);
                }
            }

            // Actualizar la tarjeta de "Nuevas Keywords"
            const kwCardEl = document.querySelector('.border-left-success .h5');
            if (kwCardEl) {
                kwCardEl.innerText = data.metrics.keywordsCount;
            }

            // Agregar nueva alerta de éxito en la sección de alertas
            const alertsContainer = document.getElementById('alertsList');
            const newAlert = `
                <a href="#" class="list-group-item list-group-item-action py-3 bg-success bg-opacity-10">
                    <div class="d-flex align-items-start">
                        <div class="flex-shrink-0 me-3">
                            <i class="bi bi-check-circle-fill fs-4 text-success"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1 text-dark fw-semibold" style="font-size: 0.9rem;">Análisis completado: ${data.domain}</h6>
                                <small class="text-muted" style="white-space: nowrap;">Ahora mismo</small>
                            </div>
                            <p class="mb-0 small text-muted">Tráfico: ${data.metrics.organicTraffic} clics | Keywords: ${data.metrics.keywordsCount}</p>
                        </div>
                    </div>
                </a>
            `;
            alertsContainer.insertAdjacentHTML('afterbegin', newAlert);
            
            // Actualizar contadores para dar sensación de cambio en vivo
            const compCountEl = document.querySelector('.border-left-primary .h5');
            if (compCountEl) {
                compCountEl.innerText = parseInt(compCountEl.innerText) + 1;
            }
        })
        .catch(error => {
            console.error('Error al conectar con el backend:', error);
            btn.innerHTML = originalBtnHTML;
            btn.disabled = false;
            alert('No se pudo conectar con el servidor backend. Asegúrate de que está corriendo en el puerto 3000.');
        });
    });
}

// Initialize Competitor Chart
function initChart() {
    const chartEl = document.getElementById('competitorChart');
    if (!chartEl) return;
    
    const ctx = chartEl.getContext('2d');
    
    // Gradient for primary line
    const gradientPrimary = ctx.createLinearGradient(0, 0, 0, 400);
    gradientPrimary.addColorStop(0, 'rgba(78, 115, 223, 0.5)');
    gradientPrimary.addColorStop(1, 'rgba(78, 115, 223, 0.0)');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['1 May', '5 May', '10 May', '15 May', '20 May', '25 May', '30 May'],
            datasets: [{
                label: 'Tu Sitio (MiMarca)',
                data: [45, 48, 50, 49, 52, 55, 60],
                borderColor: '#4e73df',
                backgroundColor: gradientPrimary,
                borderWidth: 2,
                pointRadius: 4,
                pointBackgroundColor: '#4e73df',
                fill: true,
                tension: 0.4
            },
            {
                label: 'Competidor A',
                data: [60, 58, 55, 54, 53, 50, 48],
                borderColor: '#e74a3b',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                pointRadius: 3,
                fill: false,
                tension: 0.4
            },
            {
                label: 'Competidor B',
                data: [30, 32, 35, 38, 42, 45, 47],
                borderColor: '#1cc88a',
                backgroundColor: 'transparent',
                borderWidth: 2,
                pointRadius: 3,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            family: "'Inter', sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    titleColor: '#333',
                    bodyColor: '#666',
                    borderColor: '#ddd',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: {
                        color: '#f0f0f0',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#888'
                    }
                },
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#888'
                    }
                }
            }
        }
    });
}

// Populate Real-time Alerts
function populateAlerts() {
    const alerts = [
        { type: 'down', text: 'Has bajado a posición #4 para "agencia marketing".', comp: 'Competidor B subió a #2.', time: 'Hace 5 min' },
        { type: 'up', text: '¡Subiste a posición #1 para "consultoría SEO"!', comp: 'Superaste a Competidor A.', time: 'Hace 12 min' },
        { type: 'new', text: 'Competidor C lanzó una nueva página pilar sobre "IA en Marketing".', comp: 'Detectado 15 backlinks nuevos hoy.', time: 'Hace 1 hora' },
        { type: 'down', text: 'Alerta de canibalización detectada en tu blog.', comp: '2 posts compitiendo por "tendencias seo 2024".', time: 'Hace 3 horas' },
    ];

    const alertsContainer = document.getElementById('alertsList');
    if (!alertsContainer) return;
    let html = '';

    alerts.forEach(alert => {
        const alertClass = alert.type === 'down' ? 'down' : (alert.type === 'up' ? 'up' : '');
        const iconClass = alert.type === 'down' ? 'bi-graph-down-arrow text-danger' : (alert.type === 'up' ? 'bi-graph-up-arrow text-lime' : 'bi-info-circle');
        
        html += `
            <div class="alert-item ${alertClass} mb-3">
                <div class="d-flex align-items-start">
                    <div class="bg-dark rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                        <i class="bi ${iconClass}"></i>
                    </div>
                    <div class="flex-grow-1">
                        <div class="d-flex justify-content-between">
                            <h6 class="mb-1 fw-bold" style="font-size: 0.85rem;">${alert.text}</h6>
                        </div>
                        <p class="mb-1 text-muted small">${alert.comp}</p>
                        <small class="text-uppercase opacity-50 fw-bold" style="font-size: 0.6rem;">${alert.time}</small>
                    </div>
                </div>
            </div>
        `;
    });

    alertsContainer.innerHTML = html;
}

// Populate Keywords Table
function populateKeywords() {
    const keywords = [
        { kw: 'automatización seo', vol: '1.2K', diff: 45, comp: 'Competidor A', rank: 'Nuevo (#12)' },
        { kw: 'estrategias linkbuilding 2024', vol: '850', diff: 60, comp: 'Competidor C', rank: 'Sube (#5)' },
        { kw: 'auditoria seo tecnica', vol: '3.4K', diff: 75, comp: 'Competidor B', rank: 'Baja (#8)' },
        { kw: 'herramientas seo gratuitas', vol: '12K', diff: 85, comp: 'Competidor A', rank: 'Estable (#2)' },
        { kw: 'seo local para pymes', vol: '5.4K', diff: 30, comp: 'Competidor D', rank: 'Nuevo (#22)' }
    ];

    const tbody = document.getElementById('keywordsTable');
    if (!tbody) return;
    let html = '';

    keywords.forEach(k => {
        let diffColor = k.diff > 70 ? 'bg-danger' : (k.diff > 40 ? 'bg-warning text-dark' : 'bg-success');
        let rankBadge = k.rank.includes('Nuevo') || k.rank.includes('Sube') ? 'text-success' : (k.rank.includes('Baja') ? 'text-danger' : 'text-secondary');
        let icon = k.rank.includes('Sube') ? 'bi-caret-up-fill' : (k.rank.includes('Baja') ? 'bi-caret-down-fill' : (k.rank.includes('Nuevo') ? 'bi-star-fill' : 'bi-dash'));

        html += `
            <tr>
                <td class="fw-medium text-dark">${k.kw}</td>
                <td>${k.vol}</td>
                <td><span class="badge ${diffColor}">${k.diff} / 100</span></td>
                <td>
                    <div class="d-flex flex-column">
                        <span>${k.comp}</span>
                        <small class="${rankBadge} fw-semibold"><i class="bi ${icon}"></i> ${k.rank}</small>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Populate Backlinks Table
function populateBacklinks() {
    const backlinks = [
        { domain: 'hubspot.es', dr: 92, target: 'Competidor A (/blog/seo)', type: 'Dofollow' },
        { domain: 'marketingdirecto.com', dr: 81, target: 'Competidor B (/noticias)', type: 'Nofollow' },
        { domain: 'entrepreneur.com', dr: 90, target: 'MiMarca (/guia-completa)', type: 'Dofollow' },
        { domain: 'foro-marketing.com', dr: 45, target: 'Competidor C (/recursos)', type: 'UGC' },
        { domain: 'medium.com/@seoguru', dr: 94, target: 'Competidor A (/herramientas)', type: 'Nofollow' }
    ];

    const tbody = document.getElementById('backlinksTable');
    if (!tbody) return;
    let html = '';

    backlinks.forEach(b => {
        let drColor = b.dr >= 80 ? 'text-success fw-bold' : (b.dr >= 50 ? 'text-warning fw-bold' : 'text-danger fw-bold');
        let typeBadge = b.type === 'Dofollow' ? 'bg-primary-subtle text-primary border border-primary-subtle' : 'bg-light text-secondary border';
        
        let targetFormat = b.target.includes('MiMarca') ? `<span class="text-success fw-semibold"><i class="bi bi-check-circle me-1"></i>${b.target}</span>` : b.target;

        html += `
            <tr>
                <td class="text-primary text-decoration-underline" style="cursor: pointer;">${b.domain}</td>
                <td class="${drColor}">${b.dr}</td>
                <td>${targetFormat}</td>
                <td><span class="badge ${typeBadge}">${b.type}</span></td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Global variables to store chart instances for updates
let indexingDonut = null;
let indexingLine = null;
let healthScoreChart = null;
let statusCodesChart = null;

function initSFCharts() {
    const healthCtx = document.getElementById('healthScoreChart');
    const statusCtx = document.getElementById('statusCodesChart');
    
    if (!healthCtx || !statusCtx) return;

    healthScoreChart = new Chart(healthCtx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [0, 100],
                backgroundColor: ['#1cc88a', '#f8f9fc'],
                borderWidth: 0
            }]
        },
        options: {
            cutout: '80%',
            plugins: { legend: { display: false }, tooltip: { enabled: false } }
        }
    });

    statusCodesChart = new Chart(statusCtx, {
        type: 'bar',
        data: {
            labels: ['2xx', '3xx', '4xx', '5xx'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#1cc88a', '#4e73df', '#f6c23e', '#e74a3b']
            }]
        },
    });
}

function updateSFUI(data) {
    if (!data) return;
    lastSFData = data;

    // Actualizar Puntuación de Salud
    if (healthScoreChart) {
        healthScoreChart.data.datasets[0].data = [data.healthScore, 100 - data.healthScore];
        healthScoreChart.update();
        const scoreEl = document.getElementById('healthScoreValue');
        if (scoreEl) scoreEl.innerText = data.healthScore + '%';
    }

    // Actualizar Códigos de Estado
    if (statusCodesChart) {
        statusCodesChart.data.datasets[0].data = [
            data.statusCodes.s2xx,
            data.statusCodes.s3xx,
            data.statusCodes.s4xx,
            data.statusCodes.s5xx
        ];
        statusCodesChart.update();
        
        const ids = ['status2xx', 'status3xx', 'status4xx', 'status5xx'];
        const values = [data.statusCodes.s2xx, data.statusCodes.s3xx, data.statusCodes.s4xx, data.statusCodes.s5xx];
        ids.forEach((id, i) => {
            const el = document.getElementById(id);
            if (el) el.innerText = values[i];
        });
    }

    // Actualizar texto de URLs
    const urlCountEl = document.getElementById('sfUrlCountText');
    if (urlCountEl) urlCountEl.innerText = `Basado en ${data.urlsCrawled} URLs rastreadas`;

    // Actualizar Tabla de Problemas
    const tableBody = document.getElementById('sfIssuesTable');
    if (tableBody && data.issues) {
        tableBody.innerHTML = data.issues.map(issue => `
            <tr>
                <td class="ps-4">
                    <div class="fw-bold text-dark">${issue.title}</div>
                    <div class="text-muted xsmall">Detectado en el reporte "Internal"</div>
                </td>
                <td class="text-center"><span class="fw-bold">${issue.count}</span></td>
                <td><span class="badge ${issue.severity === 'Alta' || issue.severity === 'Crítica' ? 'bg-danger' : (issue.severity === 'Media' ? 'bg-warning text-dark' : 'bg-info')}">${issue.severity}</span></td>
                <td class="text-center">
                    ${issue.status === 'OK' && issue.count === 0 ? '<i class="bi bi-check-circle-fill text-success fs-5"></i>' : 
                      (issue.status === 'OK' ? '<i class="bi bi-info-circle text-info fs-5"></i>' : 
                       '<i class="bi bi-x-octagon-fill text-danger fs-5"></i>')}
                </td>
            </tr>
        `).join('');
    }

    // Actualizar Tiempos de Respuesta
    const rtModule = document.getElementById('sfResponseTimeModule');
    if (rtModule && data.responseTime) {
        rtModule.style.display = 'block';
        const avgEl = document.getElementById('sfAvgRT');
        const maxEl = document.getElementById('sfMaxRT');
        if (avgEl) avgEl.innerText = data.responseTime.average + 's';
        if (maxEl) maxEl.innerText = (data.responseTime.max || 0).toFixed(3) + 's';
        
        const slowPagesList = document.getElementById('sfSlowPagesList');
        if (slowPagesList && data.responseTime.slowPages) {
            if (data.responseTime.slowPages.length > 0) {
                slowPagesList.innerHTML = data.responseTime.slowPages.map(p => `
                    <li class="list-group-item px-0 py-1 border-0 d-flex justify-content-between align-items-center">
                        <span class="text-truncate text-muted xsmall me-2" style="max-width: 80%;">${p.url}</span>
                        <span class="badge bg-danger-subtle text-danger xsmall">${p.time.toFixed(2)}s</span>
                    </li>
                `).join('');
            } else {
                slowPagesList.innerHTML = '<li class="list-group-item px-0 py-1 border-0 text-muted small italic">No se detectaron páginas lentas</li>';
            }
        }
    }
}

function initIndexingCharts() {
    const donutCtx = document.getElementById('indexingDonutChart');
    const lineCtx = document.getElementById('indexingLineChart');
    
    if (!donutCtx || !lineCtx) return;

    indexingDonut = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
            labels: ['Indexadas', 'No indexadas'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#1cc88a', '#e74a3b'],
                hoverBackgroundColor: ['#17a673', '#be2617'],
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }],
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            cutout: '70%',
        },
    });

    indexingLine = new Chart(lineCtx, {
        type: 'line',
        data: {
            labels: ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5', 'Semana 6', 'Semana 7'],
            datasets: [{
                label: "Páginas Indexadas",
                lineTension: 0.3,
                backgroundColor: "rgba(78, 115, 223, 0.05)",
                borderColor: "rgba(78, 115, 223, 1)",
                pointRadius: 3,
                pointBackgroundColor: "rgba(78, 115, 223, 1)",
                pointBorderColor: "rgba(78, 115, 223, 1)",
                pointHoverRadius: 3,
                pointHoverBackgroundColor: "rgba(78, 115, 223, 1)",
                pointHoverBorderColor: "rgba(78, 115, 223, 1)",
                pointHitRadius: 10,
                pointBorderWidth: 2,
                data: [0, 0, 0, 0, 0, 0, 0],
            }],
        },
        options: {
            maintainAspectRatio: false,
            scales: {
                x: { grid: { display: false, drawBorder: false } },
                y: { ticks: { maxTicksLimit: 5, padding: 10 } },
            },
            plugins: { legend: { display: false } }
        }
    });
}

function updateIndexingUI(data) {
    if (!data) return;
    
    if (indexingDonut) {
        indexingDonut.data.datasets[0].data = [data.indexed, data.notIndexed];
        indexingDonut.update();
        
        const indexedEl = document.getElementById('indexedCountText');
        const notIndexedEl = document.getElementById('notIndexedCountText');
        
        if (indexedEl) indexedEl.innerText = data.indexed.toLocaleString();
        if (notIndexedEl) notIndexedEl.innerText = data.notIndexed.toLocaleString();
    }
    
    if (indexingLine && data.history) {
        indexingLine.data.datasets[0].data = data.history;
        indexingLine.update();
    }
}

function updateCWVUI(data) {
    if (!data) return;

    const metrics = [
        { id: 'cwvLcp', data: data.lcp },
        { id: 'cwvInp', data: data.inp },
        { id: 'cwvCls', data: data.cls }
    ];

    let allGood = true;

    metrics.forEach(m => {
        const valEl = document.getElementById(m.id + 'Value');
        const statusEl = document.getElementById(m.id + 'Status');
        
        if (valEl && statusEl) {
            valEl.innerText = m.data.value;
            statusEl.innerText = m.data.status === 'Good' ? 'BUENO' : (m.data.status === 'Needs Improvement' ? 'MEJORABLE' : 'POBRE');
            
            // Classes
            statusEl.className = 'badge rounded-pill px-3 py-2 mt-2';
            if (m.data.status === 'Good') {
                statusEl.classList.add('bg-success-subtle', 'text-success', 'border', 'border-success-subtle');
            } else if (m.data.status === 'Needs Improvement') {
                statusEl.classList.add('bg-warning-subtle', 'text-warning', 'border', 'border-warning-subtle');
                allGood = false;
            } else {
                statusEl.classList.add('bg-danger-subtle', 'text-danger', 'border', 'border-danger-subtle');
                allGood = false;
            }
        }
    });

    // Summary Card
    const summaryCard = document.getElementById('cwvSummaryCard');
    const iconEl = document.getElementById('cwvOverallIcon');
    const titleEl = document.getElementById('cwvOverallTitle');
    const descEl = document.getElementById('cwvOverallDesc');

    if (summaryCard) {
        summaryCard.style.display = 'block';
        if (allGood) {
            iconEl.innerHTML = '<i class="bi bi-check-circle-fill text-success"></i>';
            titleEl.innerText = 'Tu sitio pasa el umbral de Core Web Vitals';
            titleEl.className = 'mb-0 fw-bold text-success';
            descEl.innerText = 'Todas las métricas están en el rango "Bueno". Google favorece estas páginas en los resultados.';
        } else {
            iconEl.innerHTML = '<i class="bi bi-exclamation-triangle-fill text-warning"></i>';
            titleEl.innerText = 'Se detectaron oportunidades de mejora';
            titleEl.className = 'mb-0 fw-bold text-warning';
            descEl.innerText = 'Algunas métricas no alcanzan el umbral "Bueno". Optimiza estos elementos para mejorar el posicionamiento.';
        }
    }
}

function initExportPDF() {
    const btn = document.getElementById('btnDownloadPDF');
    if (!btn) return;

    btn.addEventListener('click', function() {
        if (typeof html2pdf === 'undefined') {
            alert('La librería de PDF aún no ha cargado. Por favor espera un segundo o recarga la página.');
            return;
        }

        const element = document.querySelector('main');
        if (!element) {
            alert('No se encontró el contenido para exportar.');
            return;
        }

        // Asegurarse de que el scroll esté arriba para una captura limpia
        window.scrollTo(0,0);

        const opt = {
            margin:       10,
            filename:     'Reporte-SEO-Pro.pdf',
            image:        { type: 'jpeg', quality: 0.95 },
            html2canvas:  { 
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                letterRendering: true,
                scrollY: -window.scrollY
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        const originalHTML = btn.innerHTML;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Generando...';
        btn.disabled = true;

        // Pequeño delay para asegurar que el scroll y el estado del botón se procesen
        setTimeout(() => {
            html2pdf().set(opt).from(element).save().then(() => {
                btn.innerHTML = originalHTML;
                btn.disabled = false;
            }).catch(err => {
                console.error('Error detallado html2pdf:', err);
                btn.innerHTML = originalHTML;
                btn.disabled = false;
                // Si falla html2pdf, sugerimos imprimir como PDF
                if(confirm('El generador automático falló debido a la complejidad del diseño. ¿Deseas usar la función de impresión del navegador? (Selecciona "Guardar como PDF")')) {
                    window.print();
                }
            });
        }, 500);
    });
}
let gaChannelsChart = null;

function updateAnalyticsUI(data) {
    if (!data) return;
    
    document.getElementById('gaUsers').innerText = data.users || '--';
    document.getElementById('gaSessions').innerText = data.sessions || '--';
    document.getElementById('gaEngagement').innerText = data.engagementRate || '--';
    document.getElementById('gaDuration').innerText = data.duration || '--';

    if (data.channels) {
        initGAChannelsChart(data.channels);
    }
}

function initGAChannelsChart(channels) {
    const ctx = document.getElementById('gaChannelsChart');
    if (!ctx) return;

    if (gaChannelsChart) {
        gaChannelsChart.destroy();
    }

    gaChannelsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: channels.map(c => c.name),
            datasets: [{
                label: 'Sesiones por Canal',
                data: channels.map(c => c.value),
                backgroundColor: [
                    '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'
                ],
                borderRadius: 5
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) { return value + '%'; }
                    }
                }
            }
        }
    });
}

// --- NUEVO: Manejo de CSV de Screaming Frog ---
function initSFUpload() {
    const csvInput = document.getElementById('sfCsvInput');
    if (csvInput) {
        csvInput.addEventListener('change', handleSfCsv);
    }
}

function handleSfCsv(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        processSfCsv(text);
    };
    reader.readAsText(file);
}

function processSfCsv(csvText) {
    const allLines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
    if (allLines.length < 2) {
        alert("El archivo CSV parece estar vacío o no es válido.");
        return;
    }

    // Screaming Frog a veces incluye líneas de metadata al inicio. 
    // Buscamos la línea que contiene "Address" o "Status Code" para identificar los encabezados.
    let headerLineIdx = -1;
    let delimiter = ',';

    for (let i = 0; i < Math.min(allLines.length, 10); i++) {
        const line = allLines[i].toLowerCase();
        if (line.includes('status code') || line.includes('address') || line.includes('código de estado') || line.includes('dirección')) {
            headerLineIdx = i;
            delimiter = allLines[i].includes(';') ? ';' : ',';
            break;
        }
    }

    if (headerLineIdx === -1) {
        // Fallback: buscar la línea con más delimitadores en las primeras 5 líneas
        let maxDelims = -1;
        for (let i = 0; i < Math.min(allLines.length, 5); i++) {
            const commaCount = (allLines[i].match(/,/g) || []).length;
            const semiCount = (allLines[i].match(/;/g) || []).length;
            const currentMax = Math.max(commaCount, semiCount);
            if (currentMax > maxDelims && currentMax > 2) { // Al menos 2 columnas para ser cabecera
                maxDelims = currentMax;
                headerLineIdx = i;
                delimiter = semiCount > commaCount ? ';' : ',';
            }
        }
        if (headerLineIdx === -1) headerLineIdx = 0;
    }

    const headers = allLines[headerLineIdx].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    
    // Alias para mayor compatibilidad (idiomas, versiones)
    const findIdx = (aliases) => headers.findIndex(h => aliases.some(alias => h.toLowerCase() === alias.toLowerCase() || h.toLowerCase().includes(alias.toLowerCase())));

    const idxStatusCode = findIdx(['status code', 'status', 'estado', 'código de estado', 'code']);
    const idxTitle = findIdx(['title 1', 'título 1', 'title', 'título']);
    const idxResponseTime = findIdx(['response time', 'tiempo de respuesta', 'time', 'tiempo']);
    const idxDesc = findIdx(['meta description 1', 'meta descripción 1', 'description', 'descripción', 'descrip']);
    const idxH1 = findIdx(['h1-1', 'h1 1', 'heading 1', 'h1']);
    
    if (idxStatusCode === -1) {
        alert("No se pudo identificar la columna de 'Status Code'. Por favor, asegúrate de subir una exportación de 'Internal' de Screaming Frog (en formato CSV).");
        return;
    }

    for (let i = 0; i < dataLines.length; i++) {
        // Manejo básico de celdas con comas (comillas)
        const cells = dataLines[i].split(delimiter).map(c => c.trim().replace(/"/g, ''));
        if (cells.length < headers.length) continue;

        stats.totalUrls++;
        const code = parseInt(cells[idxStatusCode]);
        if (code >= 200 && code < 300) stats.s2xx++;
        else if (code >= 300 && code < 400) stats.s3xx++;
        else if (code >= 400 && code < 500) stats.s4xx++;
        else if (code >= 500) stats.s5xx++;

        if (idxTitle !== -1 && (!cells[idxTitle] || cells[idxTitle].toLowerCase() === 'null' || cells[idxTitle] === '')) stats.missingTitle++;
        if (idxDesc !== -1 && (!cells[idxDesc] || cells[idxDesc].toLowerCase() === 'null' || cells[idxDesc] === '')) stats.missingDesc++;
        if (idxH1 !== -1 && (!cells[idxH1] || cells[idxH1].toLowerCase() === 'null' || cells[idxH1] === '')) stats.missingH1++;

        // Tiempos de respuesta
        if (idxResponseTime !== -1 && cells[idxResponseTime]) {
            const rt = parseFloat(cells[idxResponseTime].replace(',', '.'));
            if (!isNaN(rt)) {
                stats.totalResponseTime += rt;
                if (rt > stats.maxResponseTime) stats.maxResponseTime = rt;
                
                if (rt > 1.5 && idxAddress !== -1) {
                    stats.slowPages.push({ url: cells[idxAddress], time: rt });
                }
            }
        }
    }

    // Ordenar páginas lentas y limitar a top 5
    stats.slowPages.sort((a, b) => b.time - a.time);
    stats.slowPages = stats.slowPages.slice(0, 5);

    const avgRT = stats.totalUrls > 0 ? (stats.totalResponseTime / stats.totalUrls).toFixed(3) : 0;

    let healthScore = 100;
    if (stats.totalUrls > 0) {
        const issuePoints = (stats.missingTitle * 10) + (stats.missingDesc * 5) + (stats.missingH1 * 5) + (stats.s4xx * 20) + (stats.s5xx * 50);
        const maxPoints = stats.totalUrls * 20;
        healthScore = Math.max(0, 100 - Math.round((issuePoints / maxPoints) * 100));
        if (healthScore > 100) healthScore = 100;
    }

    const mappedData = {
        healthScore: healthScore,
        statusCodes: {
            s2xx: stats.s2xx,
            s3xx: stats.s3xx,
            s4xx: stats.s4xx,
            s5xx: stats.s5xx
        },
        issues: [
            { title: 'Meta Descriptions Vacías', count: stats.missingDesc, severity: 'Alta', status: stats.missingDesc > 0 ? 'Error' : 'OK' },
            { title: 'Títulos Missing', count: stats.missingTitle, severity: 'Crítica', status: stats.missingTitle > 0 ? 'Error' : 'OK' },
            { title: 'H1 Missing', count: stats.missingH1, severity: 'Alta', status: stats.missingH1 > 0 ? 'Error' : 'OK' },
            { title: 'Errores 4xx/5xx', count: stats.s4xx + stats.s5xx, severity: 'Crítica', status: (stats.s4xx + stats.s5xx) > 0 ? 'Error' : 'OK' }
        ],
        urlsCrawled: stats.totalUrls,
        responseTime: {
            average: avgRT,
            max: stats.maxResponseTime,
            slowPages: stats.slowPages
        },
        isSimulated: false
    };

    if (!healthScoreChart) initSFCharts();
    updateSFUI(mappedData);
}
