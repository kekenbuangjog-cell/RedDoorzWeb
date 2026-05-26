import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, addDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { dateDiffNights, escapeHtml, formatDate, peso } from './utils.js';

let currentUser = null;
let currentRole = null;
let bookingData = null;

async function renderSummary() {
    const container = document.getElementById('summary-view');
    bookingData = JSON.parse(localStorage.getItem('pending_booking'));

    if (!bookingData) {
        window.location.href = 'index.html';
        return;
    }

    let userData = null;
    if (currentUser) {
        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        userData = userSnap.data();
    }

    try {
        const propertySnap = await getDoc(doc(db, "properties", bookingData.propId));
        if (!propertySnap.exists()) {
            localStorage.removeItem('pending_booking');
            window.location.href = 'listings.html';
            return;
        }

        const property = propertySnap.data();
        bookingData.propName = property.name;
        bookingData.propImage = property.image || '';
        bookingData.price = Number(property.price);
        bookingData.rating = Number(property.rating || 0);
        bookingData.reviewCount = Number(property.reviewCount || 0);
    } catch (error) {
        console.error("Error loading booking property:", error);
        container.innerHTML = '<div class="col-12 text-center py-5 text-danger">Failed to load booking details.</div>';
        return;
    }

    const nights = dateDiffNights(bookingData.checkIn, bookingData.checkOut);
    const displayPrice = Number(bookingData.price || 0);
    const totalPrice = displayPrice * nights;
    bookingData.nights = nights;
    bookingData.totalPrice = totalPrice;

    const ratingHtml = bookingData.reviewCount > 0 
        ? `<small class="text-muted"><i class="bi bi-star-fill text-warning"></i> ${bookingData.rating.toFixed(1)} (${bookingData.reviewCount} reviews)</small>`
        : `<small class="text-muted"><i class="bi bi-star text-muted"></i> New Property</small>`;

    container.innerHTML = `
        <div class="col-lg-8">
            <h2 class="fw-bold mb-4">Complete your booking</h2>
            
            <!-- Trip Details -->
            <div class="checkout-section soft-shadow">
                <h5 class="fw-bold mb-4">Your Trip</h5>
                <div class="row g-4">
                    <div class="col-md-6">
                        <small class="text-muted d-block text-uppercase fw-bold mb-1" style="font-size: 0.75rem;">Dates</small>
                        <p class="mb-0 fw-semibold">${formatDate(bookingData.checkIn)} – ${formatDate(bookingData.checkOut)}</p>
                        <small class="text-muted">${nights} night(s)</small>
                    </div>
                    <div class="col-md-6">
                        <small class="text-muted d-block text-uppercase fw-bold mb-1" style="font-size: 0.75rem;">Guests</small>
                        <p class="mb-0 fw-semibold">${escapeHtml(bookingData.guests)} Guest(s)</p>
                    </div>
                </div>
            </div>

            <!-- Guest Details (Editable) -->
            <div class="checkout-section soft-shadow">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h5 class="fw-bold mb-0">Guest Details</h5>
                    ${!currentUser ? '<small class="text-danger">Log in to auto-fill</small>' : ''}
                </div>
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label small fw-bold text-muted text-uppercase" style="font-size: 0.7rem;">First Name</label>
                        <input type="text" id="guest-fname" class="form-control rounded-3" value="${escapeHtml(userData?.fname || '')}" placeholder="Required" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small fw-bold text-muted text-uppercase" style="font-size: 0.7rem;">Last Name</label>
                        <input type="text" id="guest-lname" class="form-control rounded-3" value="${escapeHtml(userData?.lname || '')}" placeholder="Required" required>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label small fw-bold text-muted text-uppercase" style="font-size: 0.7rem;">Contact Number</label>
                        <input type="text" id="guest-phone" class="form-control rounded-3" value="${escapeHtml(userData?.phone || '')}" placeholder="0917XXXXXXX" required>
                        <div class="form-text small">This number will be used for check-in coordination.</div>
                    </div>
                </div>
            </div>

            <!-- Payment Selection -->
            <div class="checkout-section soft-shadow">
                <h5 class="fw-bold mb-4">Payment Method</h5>
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="payment-method-card active" onclick="window.selectPayment(this)">
                            <i class="bi bi-cash-stack payment-icon"></i>
                            <span class="fw-semibold">Pay at Hotel</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="payment-method-card" onclick="window.selectPayment(this)">
                            <i class="bi bi-credit-card payment-icon"></i>
                            <span class="fw-semibold">Credit Card</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="payment-method-card" onclick="window.selectPayment(this)">
                            <i class="bi bi-wallet2 payment-icon"></i>
                            <span class="fw-semibold">E-Wallet</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="sticky-summary">
                <div class="card border-0 rounded-4 soft-shadow p-4 mb-4">
                    <div class="d-flex align-items-center mb-4">
                        <img src="${escapeHtml(bookingData.propImage || 'assets/placeholder.jpg')}" class="hotel-img-sm me-3" alt="Hotel">
                        <div>
                            <h6 class="fw-bold mb-1 text-truncate" style="max-width: 150px;">${escapeHtml(bookingData.propName)}</h6>
                            ${ratingHtml}
                        </div>
                    </div>

                    <h5 class="fw-bold mb-3">Order Summary</h5>
                    <div class="price-row">
                        <span>${peso(displayPrice)} x ${nights} night(s)</span>
                        <span>${peso(totalPrice)}</span>
                    </div>
                    <div class="price-row">
                        <span>Service Fee</span>
                        <span class="text-success">FREE</span>
                    </div>
                    <div class="price-row">
                        <span>Taxes & Fees</span>
                        <span class="text-muted">Included</span>
                    </div>
                    
                    <div class="price-total d-flex justify-content-between mb-4">
                        <span>Total Paid</span>
                        <span class="text-danger">${peso(totalPrice)}</span>
                    </div>

                    <div id="action-container">
                        <!-- Confirm Button injected here -->
                    </div>

                    <div class="mt-4 pt-3 border-top">
                        <div class="d-flex align-items-center text-muted small">
                            <i class="bi bi-shield-check fs-4 me-3 text-success"></i>
                            <div>
                                <span class="d-block fw-bold text-dark">Secure Checkout</span>
                                Your information is encrypted and safe.
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="text-center">
                    <p class="text-muted small"><i class="bi bi-info-circle me-1"></i> Free cancellation until check-in date.</p>
                </div>
            </div>
        </div>
    `;

    updateActionButton();
}

window.selectPayment = (el) => {
    document.querySelectorAll('.payment-method-card').forEach(card => card.classList.remove('active'));
    el.classList.add('active');
};

function updateActionButton() {
    const actionContainer = document.getElementById('action-container');
    if (!actionContainer) return;

    if (currentUser && currentRole === 'user') {
        actionContainer.innerHTML = `
            <button id="confirm-booking-btn" class="btn btn-red px-5 py-3 fw-bold fs-5 rounded-pill w-100">Confirm and Book</button>
        `;
        document.getElementById('confirm-booking-btn').addEventListener('click', handleConfirmBooking);
    } else if (currentUser && currentRole === 'partner') {
        actionContainer.innerHTML = `
            <div class="alert alert-info text-start d-flex align-items-center mb-3">
                <i class="bi bi-info-circle-fill fs-4 me-3"></i>
                <div>
                    <h6 class="fw-bold mb-0">Partner account detected</h6>
                    <p class="mb-0 small">Partners can manage listings, but cannot create guest bookings.</p>
                </div>
            </div>
            <a class="btn btn-dark px-5 py-3 fw-bold fs-5 rounded-pill w-100" href="partner_dashboard.html">Go to Partner Dashboard</a>
        `;
    } else {
        actionContainer.innerHTML = `
            <div class="alert alert-warning text-start d-flex align-items-center mb-3">
                <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                <div>
                    <h6 class="fw-bold mb-0">Almost there!</h6>
                    <p class="mb-0 small">Please log in to your account to complete this booking.</p>
                </div>
            </div>
            <button class="btn btn-red px-5 py-3 fw-bold fs-5 rounded-pill w-100" data-bs-toggle="modal" data-bs-target="#loginModal">Log in to Confirm</button>
        `;
    }
}

async function handleConfirmBooking() {
    const btn = document.getElementById('confirm-booking-btn');
    const guestFname = document.getElementById('guest-fname').value.trim();
    const guestLname = document.getElementById('guest-lname').value.trim();
    const guestPhone = document.getElementById('guest-phone').value.trim();

    if (!guestFname || !guestLname || !guestPhone) {
        alert("Please complete the Guest Details before confirming.");
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    try {
        const propertySnap = await getDoc(doc(db, "properties", bookingData.propId));
        if (!propertySnap.exists()) {
            throw new Error('Property no longer exists.');
        }

        const property = propertySnap.data();
        const fullName = `${guestFname} ${guestLname}`;

        const nights = dateDiffNights(bookingData.checkIn, bookingData.checkOut);
        const currentPrice = Number(property.price);
        const totalPrice = currentPrice * nights;

        await addDoc(collection(db, "bookings"), {
            userId: currentUser.uid,
            userName: fullName,
            userPhone: guestPhone,
            propId: bookingData.propId,
            propName: property.name,
            propImage: property.image || '',
            pricePerNight: currentPrice,
            nights,
            checkIn: bookingData.checkIn,
            checkOut: bookingData.checkOut,
            guests: bookingData.guests,
            totalPrice,
            status: 'confirmed',
            createdAt: new Date()
        });

        localStorage.removeItem('pending_booking');
        localStorage.setItem('booking_success', property.name);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Booking error:", error);
        alert("Failed to process booking. Please try again.");
        btn.disabled = false;
        btn.innerHTML = 'Confirm and Book';
    }
}

onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    currentRole = null;

    if (!user) {
        if (document.getElementById('action-container')) updateActionButton();
        renderSummary(); // Trigger render to show "Log in to auto-fill"
        return;
    }

    try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        currentRole = userDoc.data()?.role || 'user';
        renderSummary(); // Trigger re-render once userData is fetched for auto-fill
    } catch (e) {
        console.error("Error fetching user role:", e);
    }
    
    if (document.getElementById('action-container')) updateActionButton();
});

document.addEventListener('DOMContentLoaded', renderSummary);
