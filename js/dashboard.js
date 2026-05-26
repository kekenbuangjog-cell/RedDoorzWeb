import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    addDoc, 
    doc, 
    getDoc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { escapeHtml } from './utils.js';

// --- Cloudinary Configuration ---
// REPLACE THESE WITH YOUR ACTUAL CLOUDINARY DETAILS
const CLOUDINARY_CLOUD_NAME = "dluil7sle"; 
const CLOUDINARY_UPLOAD_PRESET = "ml_default"; 

let currentUser = null;
let partnerProperties = [];
let partnerBookings = [];

function peso(value) {
    return `PHP ${Number(value || 0).toLocaleString()}`;
}

function updateStats(properties) {
    const activeEl = document.getElementById('stat-active');
    const lowestEl = document.getElementById('stat-lowest');
    const citiesEl = document.getElementById('stat-cities');

    if (!activeEl || !lowestEl || !citiesEl) return;

    const prices = properties.map((prop) => Number(prop.price)).filter((price) => price > 0);
    const cities = new Set(properties.map((prop) => String(prop.city || '').trim().toLowerCase()).filter(Boolean));

    activeEl.textContent = properties.length;
    lowestEl.textContent = prices.length ? peso(Math.min(...prices)) : 'PHP 0';
    citiesEl.textContent = cities.size;
}

// ---------------------------------------------------------
// Property Management Functions (CRUD)
// ---------------------------------------------------------

async function uploadToCloudinary(file) {
    const cloudFormData = new FormData();
    cloudFormData.append("file", file);
    cloudFormData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: cloudFormData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary");
    }

    const data = await response.json();
    return data.secure_url;
}

async function handleAddProperty(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const errorEl = document.getElementById('add-prop-error');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Publishing...';
    errorEl.classList.add('d-none');

    const formData = new FormData(e.target);
    const imageFiles = document.getElementById('imageFiles').files;

    // Collect amenities from checkboxes
    const amenityCheckboxes = document.querySelectorAll('#amenities-container-add .amenity-checkbox:checked');
    const amenities = Array.from(amenityCheckboxes).map(cb => cb.value).join(',');

    if (imageFiles.length > 5) {
        alert("You can only upload a maximum of 5 images.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Publish Listing';
        return;
    }

    try {
        let imageUrls = [];
        if (imageFiles.length > 0) {
            // Upload up to 5 images in parallel
            const uploadPromises = Array.from(imageFiles).slice(0, 5).map(file => uploadToCloudinary(file));
            imageUrls = await Promise.all(uploadPromises);
        }

        await addDoc(collection(db, "properties"), {
            partnerId: currentUser.uid,
            name: formData.get('name'),
            desc: formData.get('desc'),
            image: imageUrls[0] || '', // First image as main cover
            images: imageUrls, // Full array for carousel
            amenities: amenities,
            street: formData.get('street'),
            city: formData.get('city'),
            zip: formData.get('zip'),
            price: Number(formData.get('price')),
            maxGuests: Number(formData.get('maxGuests') || 2),
            isActive: true,
            createdAt: new Date()
        });

        location.reload();
    } catch (error) {
        console.error("Error adding property:", error);
        errorEl.textContent = error.message;
        errorEl.classList.remove('d-none');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Publish Listing';
    }
}

async function handleEditProperty(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('edit-submit-btn');
    const errorEl = document.getElementById('edit-prop-error');
    const propId = document.getElementById('edit-prop-id').value;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';
    errorEl.classList.add('d-none');

    const formData = new FormData(e.target);
    const imageFiles = document.getElementById('imageFilesEdit').files;
    const existingProp = partnerProperties.find(p => p.id === propId);

    // Collect amenities from checkboxes
    const amenityCheckboxes = document.querySelectorAll('#amenities-container-edit .amenity-checkbox-edit:checked');
    const amenities = Array.from(amenityCheckboxes).map(cb => cb.value).join(',');

    if (imageFiles.length > 5) {
        alert("You can only upload a maximum of 5 images.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Changes';
        return;
    }

    try {
        let imageUrls = existingProp?.images || [existingProp?.image].filter(Boolean) || [];
        
        // Only upload to Cloudinary if new files were selected
        if (imageFiles.length > 0) {
            const uploadPromises = Array.from(imageFiles).slice(0, 5).map(file => uploadToCloudinary(file));
            imageUrls = await Promise.all(uploadPromises);
        }

        await updateDoc(doc(db, "properties", propId), {
            name: formData.get('name'),
            desc: formData.get('desc'),
            image: imageUrls[0] || '',
            images: imageUrls,
            amenities: amenities,
            street: formData.get('street'),
            city: formData.get('city'),
            zip: formData.get('zip'),
            price: Number(formData.get('price')),
            maxGuests: Number(formData.get('maxGuests')),
            updatedAt: new Date()
        });

        const modalEl = document.getElementById('editPropertyModal');
        bootstrap.Modal.getInstance(modalEl).hide();
        fetchMyProperties();
        
    } catch (error) {
        console.error("Error updating property:", error);
        errorEl.textContent = error.message;
        errorEl.classList.remove('d-none');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Save Changes';
    }
}

async function handleDeleteProperty(propId) {
    if (!confirm("Are you sure you want to permanently delete this property? This will not affect existing bookings.")) return;

    try {
        await deleteDoc(doc(db, "properties", propId));
        fetchMyProperties(); // Refresh UI
    } catch (error) {
        console.error("Error deleting property:", error);
        alert("Failed to delete property. Please try again.");
    }
}

function openEditModal(propId) {
    const prop = partnerProperties.find(p => p.id === propId);
    if (!prop) return;

    document.getElementById('edit-prop-id').value = prop.id;
    document.getElementById('edit-name').value = prop.name || '';
    document.getElementById('edit-desc').value = prop.desc || '';
    
    // Set amenities checkboxes
    const savedAmenities = (prop.amenities || '').split(',');
    document.querySelectorAll('#amenities-container-edit .amenity-checkbox-edit').forEach(cb => {
        cb.checked = savedAmenities.includes(cb.value);
    });

    document.getElementById('edit-street').value = prop.street || '';
    document.getElementById('edit-city').value = prop.city || '';
    document.getElementById('edit-zip').value = prop.zip || '';
    document.getElementById('edit-price').value = prop.price || 0;
    document.getElementById('edit-maxGuests').value = prop.maxGuests || 2;

    const modal = new bootstrap.Modal(document.getElementById('editPropertyModal'));
    modal.show();
}

async function handleTogglePropertyStatus(propId, currentStatus) {
    const action = currentStatus ? 'pause' : 'activate';
    if (!confirm(`Are you sure you want to ${action} this listing? Guests will ${currentStatus ? 'no longer' : 'now'} see it in search results.`)) return;

    try {
        await updateDoc(doc(db, "properties", propId), {
            isActive: !currentStatus
        });
        fetchMyProperties(); // Refresh UI
    } catch (error) {
        console.error("Error toggling property status:", error);
        alert("Failed to update property status.");
    }
}

// Global scope exposure for onclick handlers in tables
window.handleDeleteProperty = handleDeleteProperty;
window.openEditModal = openEditModal;
window.handleTogglePropertyStatus = handleTogglePropertyStatus;

// ---------------------------------------------------------
// Table Rendering & UI
// ---------------------------------------------------------

function renderProperties(properties) {
    const container = document.getElementById('properties-table-container');
    if (!container) return;

    updateStats(partnerProperties);

    if (partnerProperties.length === 0) {
        container.innerHTML = `
            <div class="empty-state p-4">
                <span class="stat-icon mb-3"><i class="bi bi-building-add"></i></span>
                <h3 class="h5 fw-bold">No properties listed yet</h3>
                <p class="text-muted mb-4">Add your first property to make it available to RedDoorz guests.</p>
                <button class="btn btn-red px-4" data-bs-toggle="modal" data-bs-target="#addPropertyModal">
                    <i class="bi bi-plus-lg me-2"></i>List Property
                </button>
            </div>
        `;
        return;
    }

    if (properties.length === 0) {
        container.innerHTML = `
            <div class="empty-state p-4">
                <span class="stat-icon mb-3"><i class="bi bi-search"></i></span>
                <h3 class="h5 fw-bold">No matching properties</h3>
                <p class="text-muted mb-0">Try a different property name, city, or street.</p>
            </div>
        `;
        return;
    }

    let tableHtml = `
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Property</th>
                        <th>Location</th>
                        <th>Nightly Rate</th>
                        <th>Status</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    properties.forEach((prop) => {
        const coverImg = (prop.images && prop.images.length > 0) ? prop.images[0] : (prop.image || 'assets/placeholder.jpg');
        const isActive = prop.isActive !== false; // Default to true if field is missing
        const statusBadge = isActive 
            ? '<span class="badge rounded-pill bg-success-subtle text-success border border-success-subtle">Active</span>'
            : '<span class="badge rounded-pill bg-secondary-subtle text-secondary border border-secondary-subtle">Paused</span>';

        const toggleBtn = isActive
            ? `<button class="btn btn-sm btn-outline-warning rounded-pill px-3 me-1" onclick="handleTogglePropertyStatus('${prop.id}', true)">
                   <i class="bi bi-pause-fill me-1"></i>Pause
               </button>`
            : `<button class="btn btn-sm btn-outline-success rounded-pill px-3 me-1" onclick="handleTogglePropertyStatus('${prop.id}', false)">
                   <i class="bi bi-play-fill me-1"></i>Activate
               </button>`;
        
        tableHtml += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${escapeHtml(coverImg)}" class="property-thumb me-3" alt="${escapeHtml(prop.name)}">
                        <div class="property-name">
                            <div class="fw-bold text-truncate">${escapeHtml(prop.name)}</div>
                            <div class="text-muted small text-truncate">${escapeHtml(prop.desc || 'No description added')}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="fw-semibold">${escapeHtml(prop.city)}</div>
                    <div class="text-muted small">${escapeHtml(prop.street || '')}</div>
                </td>
                <td class="fw-bold text-danger">${peso(prop.price)}</td>
                <td>${statusBadge}</td>
                <td class="text-end">
                    <div class="btn-group">
                        ${toggleBtn}
                        <button class="btn btn-sm btn-outline-primary rounded-pill px-3 me-1" onclick="openEditModal('${prop.id}')">
                            <i class="bi bi-pencil me-1"></i>Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="handleDeleteProperty('${prop.id}')">
                            <i class="bi bi-trash me-1"></i>Delete
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table></div>`;
    container.innerHTML = tableHtml;
}

function applyPropertySearch() {
    const searchInput = document.getElementById('property-search');
    const search = searchInput?.value.trim().toLowerCase() || '';

    if (!search) {
        renderProperties(partnerProperties);
        return;
    }

    const filtered = partnerProperties.filter((prop) => {
        const haystack = `${prop.name || ''} ${prop.city || ''} ${prop.street || ''}`.toLowerCase();
        return haystack.includes(search);
    });

    renderProperties(filtered);
}

// ---------------------------------------------------------
// Booking Management Functions
// ---------------------------------------------------------

async function handleBookingStatusUpdate(bookingId, newStatus) {
    if (!confirm(`Are you sure you want to mark this booking as ${newStatus}?`)) return;

    try {
        const bookingRef = doc(db, "bookings", bookingId);
        const updateData = { status: newStatus };
        
        if (newStatus === 'checked-in') updateData.checkedInAt = new Date();
        if (newStatus === 'completed') updateData.completedAt = new Date();
        if (newStatus === 'no-show') updateData.noShowAt = new Date();

        await updateDoc(bookingRef, updateData);
        fetchPartnerBookings(); // Refresh list
    } catch (error) {
        console.error("Error updating booking status:", error);
        alert("Failed to update booking status. Please try again.");
    }
}
window.handleBookingStatusUpdate = handleBookingStatusUpdate;

function renderBookings(bookings) {
    const container = document.getElementById('bookings-table-container');
    if (!container) return;

    if (partnerProperties.length === 0) {
        container.innerHTML = `
            <div class="empty-state p-4">
                <span class="stat-icon mb-3"><i class="bi bi-calendar2-week"></i></span>
                <h3 class="h5 fw-bold">No booking data yet</h3>
                <p class="text-muted mb-0">Your reservations will appear here after guests book your properties.</p>
            </div>
        `;
        return;
    }

    if (partnerBookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state p-4">
                <span class="stat-icon mb-3"><i class="bi bi-calendar-x"></i></span>
                <h3 class="h5 fw-bold">No bookings yet</h3>
                <p class="text-muted mb-0">Published properties are ready. Guest bookings will appear here.</p>
            </div>
        `;
        return;
    }

    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state p-4">
                <span class="stat-icon mb-3"><i class="bi bi-search"></i></span>
                <h3 class="h5 fw-bold">No matching bookings</h3>
                <p class="text-muted mb-0">Try a different guest, property, or status.</p>
            </div>
        `;
        return;
    }

    let tableHtml = `
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Guest</th>
                        <th>Property</th>
                        <th>Stay Dates</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    bookings.forEach((booking) => {
        const status = booking.status || 'confirmed';
        const firstName = (booking.userName || 'Guest').split(' ')[0];
        const fullName = booking.userName || 'Guest';
        const phone = booking.userPhone || 'No phone added';

        let statusClass = 'bg-success-subtle text-success border-success-subtle';
        
        if (status === 'cancelled') statusClass = 'bg-danger-subtle text-danger border-danger-subtle';
        if (status === 'checked-in') statusClass = 'bg-primary-subtle text-primary border-primary-subtle';
        if (status === 'completed') statusClass = 'bg-secondary-subtle text-secondary border-secondary-subtle';
        if (status === 'no-show') statusClass = 'bg-dark-subtle text-dark border-dark-subtle';

        let actionButtons = '';
        if (status === 'confirmed') {
            actionButtons = `
                <button class="btn btn-sm btn-primary rounded-pill px-3 me-1" onclick="handleBookingStatusUpdate('${booking.id}', 'checked-in')">Check In</button>
                <button class="btn btn-sm btn-outline-dark rounded-pill px-3" onclick="handleBookingStatusUpdate('${booking.id}', 'no-show')">No Show</button>
            `;
        } else if (status === 'checked-in') {
            actionButtons = `
                <button class="btn btn-sm btn-success rounded-pill px-3" onclick="handleBookingStatusUpdate('${booking.id}', 'completed')">Complete Stay</button>
            `;
        }

        tableHtml += `
            <tr>
                <td>
                    <div class="fw-bold fs-5">${escapeHtml(firstName)}</div>
                    <div class="text-muted small">${escapeHtml(fullName)} | ${escapeHtml(phone)}</div>
                </td>
                <td>
                    <div class="fw-semibold">${escapeHtml(booking.propName)}</div>
                    <div class="text-muted small">${escapeHtml(booking.propId)}</div>
                </td>
                <td>
                    <div>${escapeHtml(formatDate(booking.checkIn))} - ${escapeHtml(formatDate(booking.checkOut))}</div>
                    <div class="text-muted small">${escapeHtml(booking.guests || 1)} guest(s)</div>
                </td>
                <td class="fw-bold text-danger">${peso(booking.totalPrice)}</td>
                <td><span class="badge rounded-pill border ${statusClass}">${escapeHtml(status)}</span></td>
                <td class="text-end">${actionButtons}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table></div>`;
    container.innerHTML = tableHtml;
}

function applyBookingSearch() {
    const searchInput = document.getElementById('booking-search');
    const search = searchInput?.value.trim().toLowerCase() || '';

    if (!search) {
        renderBookings(partnerBookings);
        return;
    }

    const filtered = partnerBookings.filter((booking) => {
        const haystack = `${booking.userName || ''} ${booking.userId || ''} ${booking.propName || ''} ${booking.status || ''}`.toLowerCase();
        return haystack.includes(search);
    });

    renderBookings(filtered);
}

// ---------------------------------------------------------
// Data Fetching & Core Logic
// ---------------------------------------------------------

function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function fetchPartnerBookings() {
    const propertyIds = partnerProperties.map((prop) => prop.id);
    partnerBookings = [];

    if (propertyIds.length === 0) {
        renderBookings(partnerBookings);
        return;
    }

    try {
        const bookingChunks = chunk(propertyIds, 10);
        const snapshots = await Promise.all(
            bookingChunks.map((ids) => getDocs(query(collection(db, "bookings"), where("propId", "in", ids))))
        );

        snapshots.forEach((snapshot) => {
            snapshot.forEach((bookingDoc) => {
                partnerBookings.push({ id: bookingDoc.id, ...bookingDoc.data() });
            });
        });

        partnerBookings.sort((a, b) => {
            const aTime = a.createdAt?.toMillis?.() || 0;
            const bTime = b.createdAt?.toMillis?.() || 0;
            return bTime - aTime;
        });

        renderBookings(partnerBookings);
    } catch (error) {
        console.error("Error fetching partner bookings:", error);
        document.getElementById('bookings-table-container').innerHTML = '<p class="text-danger p-4 mb-0">Failed to load bookings.</p>';
    }
}

async function fetchMyProperties() {
    const container = document.getElementById('properties-table-container');
    if (!container) return;
    
    try {
        const q = query(collection(db, "properties"), where("partnerId", "==", currentUser.uid));
        const querySnapshot = await getDocs(q);

        partnerProperties = [];
        querySnapshot.forEach((doc) => {
            const prop = doc.data();
            partnerProperties.push({ id: doc.id, ...prop });
        });

        partnerProperties.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
        renderProperties(partnerProperties);
        fetchPartnerBookings();

    } catch (error) {
        console.error("Error fetching properties:", error);
        container.innerHTML = '<p class="text-danger">Failed to load properties.</p>';
        renderBookings([]);
    }
}

// ---------------------------------------------------------
// Auth Guard & Initialization
// ---------------------------------------------------------

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const userData = userDoc.data();

    if (userData?.role !== 'partner') {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;
    document.getElementById('main-body').style.display = 'block';
    const subtitle = document.getElementById('partner-subtitle');
    if (subtitle) {
        subtitle.textContent = `${userData?.corpName || 'Partner'} listings and property performance.`;
    }
    fetchMyProperties();
});

document.addEventListener('DOMContentLoaded', () => {
    const addPropForm = document.getElementById('add-property-form');
    if (addPropForm) addPropForm.addEventListener('submit', handleAddProperty);

    const editPropForm = document.getElementById('edit-property-form');
    if (editPropForm) editPropForm.addEventListener('submit', handleEditProperty);

    const searchInput = document.getElementById('property-search');
    if (searchInput) searchInput.addEventListener('input', applyPropertySearch);

    const bookingSearchInput = document.getElementById('booking-search');
    if (bookingSearchInput) bookingSearchInput.addEventListener('input', applyBookingSearch);
});
