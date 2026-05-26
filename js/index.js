import { db } from './firebase-config.js';
import { 
    collection, 
    query, 
    limit, 
    getDocs,
    addDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { escapeHtml, peso } from './utils.js';

const initialHotels = [
    {
        partnerId: "system_seed",
        name: "RedDoorz Plus @ AS Fortuna Cebu",
        desc: "A comfortable stay in the heart of Mandaue, close to shopping malls and business districts. Enjoy our premium beds and fast WiFi.",
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        amenities: "wifi,snow,tv,water,droplet",
        street: "AS Fortuna St, Mandaue City",
        city: "Cebu",
        zip: "6014",
        price: 1200,
        createdAt: new Date()
    },
    {
        partnerId: "system_seed",
        name: "RedDoorz near Cebu IT Park",
        desc: "Perfect for business travelers and tourists alike. Walking distance to Cebu IT Park and numerous dining options.",
        image: "https://images.unsplash.com/photo-1551882547-ff40c0d1398c?auto=format&fit=crop&w=800&q=80",
        amenities: "wifi,snow,tv,shield-check",
        street: "Apas, Lahug",
        city: "Cebu",
        zip: "6000",
        price: 1500,
        createdAt: new Date()
    },
    {
        partnerId: "system_seed",
        name: "RedDoorz @ Jones Avenue Cebu",
        desc: "Affordable and accessible. Located along Osmena Boulevard, near Fuente Osmena Circle and major historical landmarks.",
        image: "https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?auto=format&fit=crop&w=800&q=80",
        amenities: "wifi,snow,tv,water",
        street: "Osmena Blvd",
        city: "Cebu",
        zip: "6000",
        price: 900,
        createdAt: new Date()
    },
    {
        partnerId: "system_seed",
        name: "RedDoorz Premium @ Mabolo Cebu",
        desc: "Premium experience on a budget. Features modern amenities, spacious rooms, and a relaxing atmosphere away from the busy streets.",
        image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80",
        amenities: "wifi,snow,tv,water,shield-check,droplet",
        street: "Mabolo",
        city: "Cebu",
        zip: "6000",
        price: 2200,
        createdAt: new Date()
    }
];

async function autoSeedDatabase() {
    for (const hotel of initialHotels) {
        await addDoc(collection(db, "properties"), hotel);
    }
}

async function fetchRecommendedProperties() {
    const propertiesContainer = document.getElementById('recommended-properties');
    
    propertiesContainer.innerHTML = `
        <div class="col-12 text-center py-4">
            <div class="spinner-border text-red" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

    try {
        const q = query(collection(db, "properties"), limit(4));
        let querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            propertiesContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-building-exclamation fs-1 text-muted mb-3 d-block"></i>
                    <p class="text-muted mb-0">No recommended properties found at the moment.</p>
                </div>
            `;
            return;
        }

        propertiesContainer.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const property = doc.data();
            const propertyId = doc.id;
            const detailsUrl = `details.html?id=${encodeURIComponent(propertyId)}`;
            
            const cardHtml = `
                <div class="col-md-3">
                    <div class="card property-card h-100" onclick="location.href='${detailsUrl}'" style="cursor: pointer;">
                        <img src="${escapeHtml(property.image || 'assets/placeholder.jpg')}" class="card-img-top" alt="${escapeHtml(property.name)}">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-2">
                                <span class="badge bg-primary me-2">4.5 / 5</span>
                                <small class="text-muted">${escapeHtml(property.city)}</small>
                            </div>
                            <h5 class="card-title fw-bold text-truncate">${escapeHtml(property.name)}</h5>
                            <div class="mt-3">
                                <span class="price-tag">${peso(property.price)}</span>
                                <small class="text-muted">/ night</small>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            propertiesContainer.insertAdjacentHTML('beforeend', cardHtml);
        });
    } catch (error) {
        console.error("Error fetching properties:", error);
        propertiesContainer.innerHTML = '<div class="col-12 text-center text-danger">Failed to load properties.</div>';
    }
}

async function fetchAvailableCities() {
    const container = document.getElementById('quick-search-container');
    if (!container) return;

    try {
        const q = query(collection(db, "properties"));
        const querySnapshot = await getDocs(q);
        
        const cities = new Set();
        querySnapshot.forEach(doc => {
            const data = doc.data();
            if (data.city && data.isActive !== false) {
                cities.add(data.city.trim());
            }
        });

        // Convert Set to sorted Array
        const sortedCities = Array.from(cities).sort();

        let html = '<small class="text-muted me-2">Available Cities:</small>';
        
        if (sortedCities.length === 0) {
            html += '<small class="text-muted italic">No cities listed yet</small>';
        } else {
            sortedCities.forEach(city => {
                html += `<a href="listings.html?search=${encodeURIComponent(city)}" class="quick-search-chip">${escapeHtml(city)}</a>`;
            });
        }

        container.innerHTML = html;

    } catch (error) {
        console.error("Error fetching cities:", error);
        container.innerHTML = '<small class="text-danger">Failed to load cities.</small>';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchRecommendedProperties();
    fetchAvailableCities();
    
    // Check for booking success in localStorage
    const hotelName = localStorage.getItem('booking_success');
    if (hotelName) {
        const container = document.getElementById('booking-success-container');
        const messageEl = document.getElementById('success-message');
        
        if (container && messageEl) {
            messageEl.textContent = `Your stay at ${hotelName} is reserved!`;
            container.classList.remove('d-none');
            
            // Auto-hide after 6 seconds with a fade effect
            setTimeout(() => {
                container.style.transition = 'opacity 1s ease, transform 1s ease';
                container.style.opacity = '0';
                container.style.transform = 'translate(-50%, -20px)';
                
                setTimeout(() => {
                    container.classList.add('d-none');
                    localStorage.removeItem('booking_success');
                }, 1000);
            }, 6000);
        }
    }
});
