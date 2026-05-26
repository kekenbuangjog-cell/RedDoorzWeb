import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    doc, 
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { escapeHtml, peso } from './utils.js';

let currentRole = null;

async function fetchPropertyDetails() {
    const content = document.getElementById('details-content');
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        window.location.href = 'listings.html';
        return;
    }

    try {
        const docRef = doc(db, "properties", id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            content.innerHTML = '<div class="col-12 text-center py-5"><h3>Property not found</h3><a href="listings.html" class="btn btn-red mt-3">Back to Listings</a></div>';
            return;
        }

        const property = docSnap.data();

        // Check if property is paused/deactivated
        if (property.isActive === false && currentRole !== 'admin' && currentRole !== 'partner') {
            content.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-eye-slash text-muted" style="font-size: 3rem;"></i>
                    <h3 class="mt-3">Property Unavailable</h3>
                    <p class="text-muted">This hotel is currently not accepting new bookings. Please check back later.</p>
                    <a href="listings.html" class="btn btn-red mt-3">Find other hotels</a>
                </div>
            `;
            return;
        }

        document.title = `${property.name || 'Hotel Details'} | RedDoorz`;

        const amenities = (property.amenities || '').split(',').map(a => a.trim()).filter(a => a);
        const labels = {
            'wifi': 'Free High-speed WiFi',
            'snow': 'Air Conditioning',
            'air-conditioning': 'Air Conditioning',
            'tv': 'Flat-screen TV',
            'water': '24/7 Hot Shower',
            'droplet': 'Mineral Water',
            'shield-check': '24-Hour Security'
        };

        const amenitiesHtml = amenities.map(icon => {
            const label = labels[icon] || icon.replace(/-/g, ' ').toUpperCase();
            return `
                <div class="col-md-4">
                    <i class="bi bi-${escapeHtml(icon)} text-danger me-2"></i> ${escapeHtml(label)}
                </div>
            `;
        }).join('');
        const maxGuests = Number(property.maxGuests || 2);
        let guestOptions = '';
        for (let i = 1; i <= maxGuests; i++) {
            guestOptions += `<option value="${i}" ${i === 2 ? 'selected' : ''}>${i} Guest${i > 1 ? 's' : ''}</option>`;
        }

        const isPartner = currentRole === 'partner';
        const detailsColumnClass = isPartner ? 'col-lg-12' : 'col-lg-8';
        const bookingColumnHtml = isPartner ? '' : `
            <!-- Right Side: Booking Card -->
            <div class="col-lg-4">
                <div class="card booking-card">
                    <div class="card-body p-4">
                        <div class="mb-4 text-end">
                            <span class="price-big">${peso(property.price)}</span>
                            <span class="text-muted">/ night</span>
                        </div>

                        <form id="booking-form">
                            <input type="hidden" name="prop_id" value="${escapeHtml(id)}">
                            <div class="mb-3">
                                <label class="form-label small fw-bold">Check-in</label>
                                <input type="date" name="check_in" id="check_in" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-bold">Check-out</label>
                                <input type="date" name="check_out" id="check_out" class="form-control" required>
                            </div>
                            <div class="mb-4">
                                <label class="form-label small fw-bold">Guests (Max: ${maxGuests})</label>
                                <select name="guests" class="form-select">
                                    ${guestOptions}
                                </select>
                            </div>
                            <button type="submit" class="btn btn-red w-100 py-3 fw-bold fs-5">Book Now</button>
                        </form>
                        
                        <div class="mt-4 text-center">
                            <p class="text-muted small">You won't be charged yet</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const rating = Number(property.rating || 0);
        const count = Number(property.reviewCount || 0);
        const ratingHtml = count > 0 
            ? `
                <div class="text-end">
                    <span class="badge bg-primary fs-5 px-3 py-2">${rating.toFixed(1)} / 5</span>
                    <p class="text-muted small mt-1">${count} verified reviews</p>
                </div>
            `
            : `
                <div class="text-end">
                    <span class="badge bg-secondary fs-5 px-3 py-2">New</span>
                    <p class="text-muted small mt-1">No reviews yet</p>
                </div>
            `;

        const images = property.images && property.images.length > 0 ? property.images : [property.image || 'assets/placeholder.jpg'];
        
        let mediaHtml = '';
        if (images.length > 1) {
            const indicators = images.map((_, i) => `
                <button type="button" data-bs-target="#propertyCarousel" data-bs-slide-to="${i}" class="${i === 0 ? 'active' : ''}"></button>
            `).join('');

            const slides = images.map((url, i) => `
                <div class="carousel-item ${i === 0 ? 'active' : ''}">
                    <img src="${escapeHtml(url)}" class="d-block w-100 main-img" alt="Property image ${i + 1}">
                </div>
            `).join('');

            mediaHtml = `
                <div id="propertyCarousel" class="carousel slide mb-4 rounded-4 overflow-hidden shadow-sm" data-bs-ride="carousel" data-bs-touch="true">
                    <div class="carousel-indicators">
                        ${indicators}
                    </div>
                    <div class="carousel-inner">
                        ${slides}
                    </div>
                    <button class="carousel-control-prev" type="button" data-bs-target="#propertyCarousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon"></span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#propertyCarousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon"></span>
                    </button>
                </div>
            `;
        } else {
            mediaHtml = `<img src="${escapeHtml(images[0])}" class="main-img mb-4 rounded-4 shadow-sm" alt="${escapeHtml(property.name)}">`;
        }

        content.innerHTML = `
            <!-- Left Side: Property Details -->
            <div class="${detailsColumnClass}">
                <div class="details-container">
                    ${mediaHtml}
                    
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h2 class="fw-bold mb-1">${escapeHtml(property.name)}</h2>
                            <p class="text-muted"><i class="bi bi-geo-alt"></i> ${escapeHtml(property.street)}, ${escapeHtml(property.city)} ${escapeHtml(property.zip)}</p>
                        </div>
                        ${ratingHtml}
                    </div>

                    <hr class="my-4">

                    <h4 class="fw-bold mb-3">About this Hotel</h4>
                    <p class="text-secondary">
                        ${escapeHtml(property.desc || '').replace(/\n/g, '<br>')}
                    </p>

                    <h4 class="fw-bold mt-4 mb-3">Amenities</h4>
                    <div class="row g-3">
                        ${amenitiesHtml}
                    </div>

                    <hr class="my-4">
                    <h4 class="fw-bold mb-3">Guest Reviews</h4>
                    <div id="reviews-container">
                        <div class="text-center py-4">
                            <div class="spinner-border spinner-border-sm text-danger" role="status"></div>
                            <span class="ms-2 text-muted">Loading reviews...</span>
                        </div>
                    </div>
                </div>
            </div>
            ${bookingColumnHtml}
        `;

        fetchAndRenderReviews(id);

        if (isPartner) return;

        // Set default dates
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const formatDate = (date) => date.toISOString().split('T')[0];
        
        const checkInEl = document.getElementById('check_in');
        const checkOutEl = document.getElementById('check_out');
        
        checkInEl.value = formatDate(today);
        checkInEl.min = formatDate(today);
        checkOutEl.value = formatDate(tomorrow);
        checkOutEl.min = formatDate(tomorrow);

        // Update checkout min date when check-in changes
        checkInEl.addEventListener('change', (e) => {
            const newCheckIn = new Date(e.target.value);
            const nextDay = new Date(newCheckIn);
            nextDay.setDate(nextDay.getDate() + 1);
            
            const minCheckOut = formatDate(nextDay);
            checkOutEl.min = minCheckOut;
            
            if (checkOutEl.value <= e.target.value) {
                checkOutEl.value = minCheckOut;
            }
        });

        const bookingForm = document.getElementById('booking-form');
        if (!bookingForm) return;

        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const bookingData = {
                propId: id,
                propName: property.name,
                propImage: property.image,
                checkIn: formData.get('check_in'),
                checkOut: formData.get('check_out'),
                guests: formData.get('guests')
            };
            
            localStorage.setItem('pending_booking', JSON.stringify(bookingData));
            window.location.href = 'booking_summary.html';
        });

    } catch (error) {
        console.error("Error fetching property:", error);
        content.innerHTML = '<div class="text-center py-5 text-danger">Failed to load property details.</div>';
    }
}

onAuthStateChanged(auth, async (user) => {
    currentRole = null;
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        currentRole = userDoc.data()?.role || 'user';
    }
    fetchPropertyDetails();
});

async function fetchAndRenderReviews(propId) {
    const container = document.getElementById('reviews-container');
    if (!container) return;

    try {
        const q = query(collection(db, "reviews"), where("propId", "==", propId));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            container.innerHTML = '<p class="text-muted small">No reviews yet. Be the first to review after your stay!</p>';
            return;
        }

        let reviews = [];
        snapshot.forEach(doc => {
            reviews.push({ id: doc.id, ...doc.data() });
        });

        // Sort client-side by date desc
        reviews.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });

        let html = '';
        reviews.forEach(review => {
            const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const date = review.createdAt ? new Date(review.createdAt.toMillis()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            
            html += `
                <div class="mb-3 pb-3 border-bottom">
                    <div class="d-flex justify-content-between mb-1">
                        <strong class="text-dark">Verified Guest</strong>
                        <span class="text-muted small">${date}</span>
                    </div>
                    <div class="mb-2 text-warning" style="font-size: 0.9rem;">${stars}</div>
                    <p class="mb-0 text-secondary" style="font-size: 0.95rem;">${escapeHtml(review.comment || 'No comment provided.')}</p>
                </div>
            `;
        });
        
        container.innerHTML = html;

    } catch (error) {
        console.error("Error fetching reviews:", error);
        container.innerHTML = '<p class="text-danger small">Failed to load reviews.</p>';
    }
}
