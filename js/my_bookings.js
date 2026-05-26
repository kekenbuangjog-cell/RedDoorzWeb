import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    updateDoc, 
    doc,
    getDoc,
    addDoc,
    runTransaction
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { escapeHtml, formatDate, peso } from './utils.js';

let currentUser = null;
let allBookings = [];
let currentFilter = 'active';

async function fetchMyBookings() {
    const container = document.getElementById('bookings-list-container');
    
    try {
        const q = query(
            collection(db, "bookings"), 
            where("userId", "==", currentUser.uid)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            allBookings = [];
            renderBookings();
            return;
        }

        allBookings = [];
        querySnapshot.forEach((doc) => {
            allBookings.push({ id: doc.id, ...doc.data() });
        });

        // Sort by date desc
        allBookings.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });

        renderBookings();

    } catch (error) {
        console.error("Error fetching bookings:", error);
        container.innerHTML = '<p class="text-danger">Failed to load your bookings.</p>';
    }
}

function renderBookings() {
    const container = document.getElementById('bookings-list-container');
    
    // Categorize
    const filtered = allBookings.filter(b => {
        const status = b.status || 'confirmed';
        if (currentFilter === 'active') {
            return status === 'confirmed' || status === 'checked-in';
        } else {
            return status === 'completed' || status === 'cancelled' || status === 'no-show';
        }
    });

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5 bg-white rounded-4 soft-shadow">
                <i class="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
                <h5>No ${currentFilter} bookings</h5>
                <p class="text-muted">Your ${currentFilter} reservations will appear here.</p>
                ${currentFilter === 'active' ? '<a href="listings.html" class="btn btn-red px-4 mt-2">Book a Hotel</a>' : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    filtered.forEach((booking) => {
        const status = booking.status || 'confirmed';
        let statusClass = 'bg-success-subtle text-success border-success-subtle';
        
        if (status === 'cancelled') statusClass = 'bg-danger-subtle text-danger border-danger-subtle';
        if (status === 'checked-in') statusClass = 'bg-primary-subtle text-primary border-primary-subtle';
        if (status === 'completed') statusClass = 'bg-secondary-subtle text-secondary border-secondary-subtle';
        if (status === 'no-show') statusClass = 'bg-dark-subtle text-dark border-dark-subtle';

        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);

        let actionHtml = '';
        if (status === 'confirmed') {
            actionHtml = `
                <button class="btn btn-outline-danger btn-sm rounded-pill px-3 cancel-btn" data-id="${escapeHtml(booking.id)}">
                    Cancel Booking
                </button>
            `;
        } else if (status === 'completed' && !booking.reviewed) {
            actionHtml = `
                <button class="btn btn-red btn-sm rounded-pill px-4 review-btn" 
                    data-id="${escapeHtml(booking.id)}" 
                    data-prop="${escapeHtml(booking.propId)}">
                    Leave a Review
                </button>
            `;
        } else if (booking.reviewed) {
            actionHtml = `<span class="badge bg-light text-muted border px-3 py-2 rounded-pill"><i class="bi bi-check2-circle me-1"></i>Reviewed</span>`;
        }

        const cardHtml = `
            <div class="card booking-card mb-4 soft-shadow">
                <div class="row g-0">
                    <div class="col-md-auto">
                        <img src="${escapeHtml(booking.propImage || 'assets/placeholder.jpg')}" class="hotel-img-list" alt="Hotel">
                    </div>
                    <div class="col-md p-4 d-flex flex-column justify-content-between">
                        <div>
                            <div class="d-flex justify-content-between align-items-start mb-3">
                                <div>
                                    <h5 class="fw-bold mb-1">${escapeHtml(booking.propName)}</h5>
                                    <p class="text-muted small mb-0"><i class="bi bi-geo-alt me-1"></i>Cebu City, Philippines</p>
                                </div>
                                <span class="badge rounded-pill border px-3 py-2 ${statusClass}">
                                    ${statusLabel}
                                </span>
                            </div>

                            <div class="d-flex gap-3 mb-3">
                                <div class="date-block">
                                    <span class="date-label">Check-in</span>
                                    <span class="date-value">${formatDate(booking.checkIn)}</span>
                                </div>
                                <div class="date-block">
                                    <span class="date-label">Check-out</span>
                                    <span class="date-value">${formatDate(booking.checkOut)}</span>
                                </div>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
                            <div>
                                <small class="text-muted d-block">Booking Reference</small>
                                <span class="fw-bold text-dark" style="font-family: monospace;">#${booking.id.slice(0,8).toUpperCase()}</span>
                            </div>
                            <div class="text-end">
                                <div class="mb-2">
                                    <span class="text-muted small me-2">Total Price:</span>
                                    <span class="fw-bold text-danger fs-5">${peso(booking.totalPrice)}</span>
                                </div>
                                ${actionHtml}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHtml);
    });

    // Re-attach listeners
    document.querySelectorAll('.cancel-btn').forEach(btn => {
        btn.addEventListener('click', () => handleCancelBooking(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', () => openReviewModal(btn.getAttribute('data-id'), btn.getAttribute('data-prop')));
    });
}

window.filterBookings = (filter) => {
    currentFilter = filter;
    renderBookings();
};

function openReviewModal(bookingId, propId) {
    document.getElementById('review-booking-id').value = bookingId;
    document.getElementById('review-prop-id').value = propId;
    const modal = new bootstrap.Modal(document.getElementById('reviewModal'));
    modal.show();
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    const submitBtn = document.getElementById('review-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Submitting...';

    const formData = new FormData(e.target);
    const rating = Number(formData.get('rating'));
    const comment = formData.get('comment');
    const bookingId = formData.get('bookingId');
    const propId = formData.get('propId');

    try {
        // Use a transaction to ensure all updates succeed or fail together
        await runTransaction(db, async (transaction) => {
            // 1. Get current property data
            const propRef = doc(db, "properties", propId);
            const propDoc = await transaction.get(propRef);
            if (!propDoc.exists()) throw new Error("Property not found");

            const propData = propDoc.data();
            const currentRating = Number(propData.rating || 0);
            const currentCount = Number(propData.reviewCount || 0);

            // 2. Calculate new aggregate rating
            const newCount = currentCount + 1;
            const newRating = Number(((currentRating * currentCount) + rating) / newCount).toFixed(1);

            // 3. Create review document
            const reviewRef = doc(collection(db, "reviews"));
            transaction.set(reviewRef, {
                userId: currentUser.uid,
                bookingId,
                propId,
                rating,
                comment,
                createdAt: new Date()
            });

            // 4. Update booking to prevent duplicate reviews
            const bookingRef = doc(db, "bookings", bookingId);
            transaction.update(bookingRef, { reviewed: true });

            // 5. Update property with new rating/count
            transaction.update(propRef, {
                rating: Number(newRating),
                reviewCount: newCount
            });
        });

        const modalEl = document.getElementById('reviewModal');
        bootstrap.Modal.getInstance(modalEl).hide();
        showAlert('success', 'Thank you! Your review has been published.');
        fetchMyBookings();
    } catch (error) {
        console.error("Review error:", error);
        alert("Failed to submit review: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Review';
    }
}

async function handleCancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) return;

    try {
        const bookingRef = doc(db, "bookings", bookingId);
        await updateDoc(bookingRef, {
            status: 'cancelled',
            cancelledAt: new Date()
        });

        showAlert('success', 'Booking successfully cancelled.');
        fetchMyBookings();
    } catch (error) {
        console.error("Error cancelling booking:", error);
        showAlert('danger', 'Failed to cancel booking. Please try again.');
    }
}

function showAlert(type, message) {
    const container = document.getElementById('alerts-container');
    container.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show rounded-4 mb-4" role="alert">
            <i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-triangle-fill'} me-2"></i> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
}

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.data()?.role || 'user';
    if (role !== 'user') {
        window.location.href = 'partner_dashboard.html';
        return;
    }

    currentUser = user;
    document.getElementById('main-body').style.display = 'block';

    const reviewForm = document.getElementById('review-form');
    if (reviewForm) {
        // Remove old listener if it exists
        const newForm = reviewForm.cloneNode(true);
        reviewForm.parentNode.replaceChild(newForm, reviewForm);
        newForm.addEventListener('submit', handleReviewSubmit);
    }

    fetchMyBookings();
});
