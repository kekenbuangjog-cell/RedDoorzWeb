import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc,
    query,
    orderBy,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { escapeHtml, peso, formatDate } from './utils.js';

let allUsers = [];
let allBookings = [];
let allProperties = [];

async function fetchAdminData() {
    try {
        // Fetch everything in parallel
        const [usersSnap, propertiesSnap, bookingsSnap] = await Promise.all([
            getDocs(collection(db, "users")),
            getDocs(collection(db, "properties")),
            getDocs(collection(db, "bookings"))
        ]);

        allUsers = [];
        usersSnap.forEach(doc => allUsers.push({ id: doc.id, ...doc.data() }));

        allProperties = [];
        propertiesSnap.forEach(doc => allProperties.push({ id: doc.id, ...doc.data() }));

        allBookings = [];
        bookingsSnap.forEach(doc => allBookings.push({ id: doc.id, ...doc.data() }));
        
        // Sort bookings by date
        allBookings.sort((a, b) => {
            const tA = a.createdAt?.toMillis?.() || 0;
            const tB = b.createdAt?.toMillis?.() || 0;
            return tB - tA;
        });

        calculateStats();
        renderUsers(allUsers);
        renderBookings(allBookings);
        renderProperties(allProperties);

    } catch (error) {
        console.error("Admin data fetch error:", error);
        alert("Failed to load platform data. Check your security rules.");
    }
}

function calculateStats() {
    const revenueEl = document.getElementById('stat-revenue');
    const guestsEl = document.getElementById('stat-guests');
    const partnersEl = document.getElementById('stat-partners');
    const propsEl = document.getElementById('stat-properties');

    // Revenue: Only count non-cancelled bookings
    const totalRevenue = allBookings
        .filter(b => b.status !== 'cancelled')
        .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

    const guestCount = allUsers.filter(u => u.role === 'user').length;
    const partnerCount = allUsers.filter(u => u.role === 'partner').length;

    if (revenueEl) revenueEl.textContent = peso(totalRevenue);
    if (guestsEl) guestsEl.textContent = guestCount;
    if (partnersEl) partnersEl.textContent = partnerCount;
    if (propsEl) propsEl.textContent = allProperties.length;
}

function renderUsers(users) {
    const container = document.getElementById('users-table-container');
    if (!container) return;
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    users.forEach(user => {
        const isSelf = user.id === auth.currentUser.uid;
        const name = user.role === 'partner' ? (user.corpName || `${user.fname} ${user.lname}`) : `${user.fname} ${user.lname}`;
        const roleBadge = user.role === 'partner' ? 'bg-warning text-dark' : 'bg-info text-dark';
        
        html += `
            <tr>
                <td><div class="fw-bold">${escapeHtml(name)}</div></td>
                <td>${escapeHtml(user.email)}</td>
                <td><span class="badge ${roleBadge}">${escapeHtml(user.role?.toUpperCase() || 'USER')}</span></td>
                <td class="text-end">
                    ${!isSelf ? `
                        <button class="btn btn-sm btn-outline-dark rounded-pill px-3 me-1" onclick="handleToggleUserRole('${user.id}', '${user.role}')">
                            <i class="bi bi-person-gear me-1"></i>Switch Role
                        </button>
                        <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="handleDeleteUser('${user.id}')">
                            <i class="bi bi-trash me-1"></i>Delete
                        </button>
                    ` : '<span class="text-muted small">Current Admin</span>'}
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function renderBookings(bookings) {
    const container = document.getElementById('bookings-table-container');
    if (!container) return;
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Date</th>
                        <th>Guest</th>
                        <th>Property</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    bookings.forEach(b => {
        let statusClass = 'text-success';
        if (b.status === 'cancelled') statusClass = 'text-danger';
        if (b.status === 'checked-in') statusClass = 'text-primary';

        const canCancel = b.status !== 'cancelled' && b.status !== 'completed';

        html += `
            <tr>
                <td class="small text-muted">${formatDate(b.checkIn)}</td>
                <td><div class="fw-semibold">${escapeHtml(b.userName || 'Guest')}</div></td>
                <td><div class="small">${escapeHtml(b.propName)}</div></td>
                <td class="fw-bold">${peso(b.totalPrice)}</td>
                <td><span class="fw-bold ${statusClass}">${escapeHtml(b.status || 'confirmed')}</span></td>
                <td class="text-end">
                    ${canCancel ? `
                        <button class="btn btn-sm btn-danger rounded-pill px-3" onclick="handleCancelBooking('${b.id}')">
                            <i class="bi bi-x-circle me-1"></i>Force Cancel
                        </button>
                    ` : '-'}
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

function renderProperties(properties) {
    const container = document.getElementById('properties-table-container');
    if (!container) return;
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="table-light">
                    <tr>
                        <th>Property</th>
                        <th>Location</th>
                        <th>Partner</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th class="text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    properties.forEach(p => {
        const partner = allUsers.find(u => u.id === p.partnerId);
        const partnerName = partner ? (partner.corpName || partner.fname) : 'Unknown';
        const isActive = p.isActive !== false;
        
        html += `
            <tr>
                <td><div class="fw-bold">${escapeHtml(p.name)}</div></td>
                <td class="small">${escapeHtml(p.city)}</td>
                <td class="small">${escapeHtml(partnerName)}</td>
                <td class="fw-bold text-danger">${peso(p.price)}</td>
                <td>
                    <span class="badge rounded-pill ${isActive ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-secondary-subtle text-secondary border border-secondary-subtle'}">
                        ${isActive ? 'Active' : 'Paused'}
                    </span>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-warning rounded-pill px-3 me-1" onclick="handleTogglePropertyStatus('${p.id}', ${isActive})">
                        <i class="bi bi-power me-1"></i>${isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button class="btn btn-sm btn-outline-danger rounded-pill px-3" onclick="handleDeleteProperty('${p.id}')">
                        <i class="bi bi-trash me-1"></i>Delete
                    </button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
}

// --- Action Handlers ---

async function handleDeleteUser(uid) {
    if (!confirm("Are you sure? This will delete the user's Firestore profile. (Note: Auth account deletion requires Cloud Functions or Firebase Console)")) return;
    try {
        await deleteDoc(doc(db, "users", uid));
        fetchAdminData();
    } catch (error) {
        console.error("Delete user error:", error);
    }
}

async function handleToggleUserRole(uid, currentRole) {
    const newRole = currentRole === 'partner' ? 'user' : 'partner';
    if (!confirm(`Switch this user's role to ${newRole.toUpperCase()}?`)) return;
    try {
        await updateDoc(doc(db, "users", uid), { role: newRole });
        fetchAdminData();
    } catch (error) {
        console.error("Toggle role error:", error);
    }
}

async function handleCancelBooking(bookingId) {
    if (!confirm("Force cancel this booking? This cannot be undone.")) return;
    try {
        await updateDoc(doc(db, "bookings", bookingId), { status: 'cancelled', cancelledAt: new Date() });
        fetchAdminData();
    } catch (error) {
        console.error("Cancel booking error:", error);
    }
}

async function handleTogglePropertyStatus(propId, currentStatus) {
    try {
        await updateDoc(doc(db, "properties", propId), { isActive: !currentStatus });
        fetchAdminData();
    } catch (error) {
        console.error("Toggle property error:", error);
    }
}

async function handleDeleteProperty(propId) {
    if (!confirm("Permanently delete this property? This will remove it from the platform entirely.")) return;
    try {
        await deleteDoc(doc(db, "properties", propId));
        fetchAdminData();
    } catch (error) {
        console.error("Delete property error:", error);
    }
}

// Global exposure for onclick
window.handleDeleteUser = handleDeleteUser;
window.handleToggleUserRole = handleToggleUserRole;
window.handleCancelBooking = handleCancelBooking;
window.handleTogglePropertyStatus = handleTogglePropertyStatus;
window.handleDeleteProperty = handleDeleteProperty;

function handleUserSearch() {
    const term = document.getElementById('user-search').value.toLowerCase();
    const filtered = allUsers.filter(u => 
        u.email?.toLowerCase().includes(term) || 
        u.fname?.toLowerCase().includes(term) || 
        u.lname?.toLowerCase().includes(term) ||
        u.corpName?.toLowerCase().includes(term)
    );
    renderUsers(filtered);
}

// Auth Guard
onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.data()?.role;

    if (role !== 'admin') {
        // Not an admin? Get out!
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('main-body').style.display = 'block';
    fetchAdminData();
});

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('user-search');
    if (searchInput) searchInput.addEventListener('input', handleUserSearch);
});
