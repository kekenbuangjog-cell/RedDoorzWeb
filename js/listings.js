import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    collection, 
    query, 
    where, 
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { escapeHtml, peso } from './utils.js';

let currentRole = null;
let allProperties = []; // Cache properties to allow fast client-side filtering

async function fetchListings() {
    const listingsContainer = document.getElementById('listings-container');
    
    // Show loading spinner
    listingsContainer.innerHTML = `
        <div class="text-center py-5 w-100">
            <div class="spinner-border text-red" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Finding best deals for you...</p>
        </div>
    `;

    try {
        // Fetch all properties once to bypass index requirement and speed up filtering
        const q = query(collection(db, "properties"));
        const querySnapshot = await getDocs(q);
        
        allProperties = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Only show active properties (strict check against false for compatibility)
            if (data.isActive !== false) {
                allProperties.push({ id: doc.id, ...data });
            }
        });

        // Initial render based on URL params
        applyFiltersAndRender();

    } catch (error) {
        console.error("Error fetching listings:", error);
        listingsContainer.innerHTML = '<div class="text-center py-5 text-danger">Failed to load listings.</div>';
    }
}

function applyFiltersAndRender() {
    const listingsContainer = document.getElementById('listings-container');
    const hotelCountEl = document.getElementById('hotelCount');
    const searchLocationEl = document.getElementById('searchLocation');
    
    // Read current state from the DOM (no page reload needed)
    const searchInputEl = document.getElementById('search-input');
    const search = searchInputEl ? searchInputEl.value.trim() : '';
    const selectedPrices = Array.from(document.querySelectorAll('input[name="price"]:checked')).map(cb => cb.value);
    const selectedRatings = Array.from(document.querySelectorAll('input[name="rating"]:checked')).map(cb => cb.value);
    const sortSelectEl = document.getElementById('sort-select');
    const sort = sortSelectEl ? sortSelectEl.value : 'popularity';

    // Update the URL invisibly so users can still copy/paste the link
    const url = new URL(window.location);
    url.searchParams.delete('search');
    if (search) url.searchParams.set('search', search);
    
    url.searchParams.delete('price');
    selectedPrices.forEach(p => url.searchParams.append('price', p));
    
    url.searchParams.delete('rating');
    selectedRatings.forEach(r => url.searchParams.append('rating', r));
    
    url.searchParams.set('sort', sort);
    window.history.replaceState({}, '', url);

    // Update UI
    if (searchLocationEl) searchLocationEl.textContent = search ? `in "${search}"` : '';

    // 1. Filter by Search
    let properties = [...allProperties];
    if (search) {
        const s = search.toLowerCase();
        properties = properties.filter(p => 
            p.name?.toLowerCase().includes(s) || 
            p.city?.toLowerCase().includes(s) || 
            p.street?.toLowerCase().includes(s)
        );
    }

    // 2. Filter by Price
    if (selectedPrices.length > 0) {
        properties = properties.filter(p => {
            const price = Number(p.price);
            return selectedPrices.some(range => {
                if (range === '0-1000') return price <= 1000;
                if (range === '1000-2000') return price > 1000 && price <= 2000;
                if (range === '2000+') return price > 2000;
                return false;
            });
        });
    }

    // 3. Filter by Rating
    if (selectedRatings.length > 0) {
        const minRating = Math.min(...selectedRatings.map(Number));
        properties = properties.filter(p => {
            const rating = Number(p.rating || 0);
            return rating >= minRating;
        });
    }

    // 4. Sort
    if (sort === 'price_low') {
        properties.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === 'price_high') {
        properties.sort((a, b) => Number(b.price) - Number(a.price));
    } else {
        properties.sort((a, b) => b.id.localeCompare(a.id));
    }

    // 5. Render
    if (hotelCountEl) hotelCountEl.textContent = properties.length;
    
    if (properties.length === 0) {
        listingsContainer.innerHTML = `
            <div class="text-center py-5">
                <i class="bi bi-search fs-1 text-muted mb-3 d-block"></i>
                <h5>No properties found matching your criteria</h5>
                <p class="text-muted">Try adjusting your filters or search term.</p>
                <button type="button" class="btn btn-red mt-2" onclick="window.clearFilters()">Clear All Filters</button>
            </div>
        `;
        return;
    }

    listingsContainer.innerHTML = '';
    properties.forEach(item => {
        const amenities = (item.amenities || '').split(',').map(a => a.trim()).filter(a => a);
        const amenitiesHtml = amenities
            .map(a => `<span class="me-2">&bull; ${escapeHtml(a.replace(/-/g, ' '))}</span>`)
            .join('');
        const detailsUrl = `details.html?id=${encodeURIComponent(item.id)}`;
        const actionButton = currentRole === 'partner'
            ? `<a href="${detailsUrl}" class="btn btn-outline-secondary px-4" onclick="event.stopPropagation()">View Details</a>`
            : `<button type="button" class="btn btn-red px-4">Book Now</button>`;

        const rating = Number(item.rating || 0);
        const count = Number(item.reviewCount || 0);
        const ratingHtml = count > 0 
            ? `<span class="badge bg-primary h-100 px-2 py-1">${rating.toFixed(1)} / 5 (${count})</span>`
            : `<span class="badge bg-secondary h-100 px-2 py-1">New</span>`;

        const thumbUrl = (item.images && item.images.length > 0) ? item.images[0] : (item.image || 'assets/placeholder.jpg');

        const itemHtml = `
            <div class="property-card-list" onclick="location.href='${detailsUrl}'">
                <img src="${escapeHtml(thumbUrl)}" alt="${escapeHtml(item.name)}">
                <div class="p-4 flex-grow-1 d-flex flex-column justify-content-between">

                    <div>
                        <div class="d-flex justify-content-between">
                            <h5 class="fw-bold">${escapeHtml(item.name)}</h5>
                            ${ratingHtml}
                        </div>
                        <p class="text-muted small mb-2"><i class="bi bi-geo-alt"></i> ${escapeHtml(item.street)}, ${escapeHtml(item.city)}</p>
                        <p class="text-secondary small">
                            ${amenitiesHtml}
                        </p>
                    </div>

                    <div class="d-flex justify-content-between align-items-end">
                        <div>
                            <span class="price-text">${peso(item.price)}</span>
                            <small class="text-muted">/ night</small>
                        </div>
                        ${actionButton}
                    </div>
                </div>
            </div>
        `;
        listingsContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
}

// Global clear function for the empty state button and sidebar link
window.clearFilters = () => {
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('.filter-checkbox').forEach(cb => cb.checked = false);
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = 'popularity';
    
    applyFiltersAndRender();
};

function initFiltersFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = urlParams.get('search') || '';
    
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) sortSelect.value = urlParams.get('sort') || 'popularity';
    
    const prices = urlParams.getAll('price');
    const ratings = urlParams.getAll('rating');
    
    document.querySelectorAll('.filter-checkbox').forEach(cb => {
        if (cb.name === 'price' && prices.includes(cb.value)) cb.checked = true;
        if (cb.name === 'rating' && ratings.includes(cb.value)) cb.checked = true;
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initFiltersFromURL();

    // Intercept form submission to prevent page reload
    const form = document.getElementById('filterForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            applyFiltersAndRender();
        });
    }

    // Listen for checkbox and sort changes
    document.querySelectorAll('.filter-checkbox, #sort-select').forEach(el => {
        el.addEventListener('change', () => {
            applyFiltersAndRender();
        });
    });

    // Intercept the "Clear All" link in the sidebar
    const clearLinks = document.querySelectorAll('a.text-danger');
    clearLinks.forEach(link => {
        if (link.textContent.trim() === 'Clear All') {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                window.clearFilters();
            });
        }
    });
});

onAuthStateChanged(auth, async (user) => {
    currentRole = null;

    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        currentRole = userDoc.data()?.role || 'user';
    }

    fetchListings();
});
