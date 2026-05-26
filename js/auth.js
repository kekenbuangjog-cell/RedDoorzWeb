import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
    doc, 
    setDoc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { escapeHtml } from './utils.js';

// DOM Elements
const getElements = () => ({
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    partnerLoginForm: document.getElementById('partner-login-form'),
    partnerRegisterForm: document.getElementById('partner-register-form'),
    authNavItems: document.getElementById('auth-nav-items'),
    loginError: document.getElementById('login-error'),
    regError: document.getElementById('register-error'),
    pLoginError: document.getElementById('partner-login-error'),
    pRegError: document.getElementById('partner-register-error')
});

// Helper: Show Error
const showError = (element, message) => {
    if (element) {
        element.textContent = message;
        element.classList.remove('alert-success');
        element.classList.add('alert-danger');
        element.classList.remove('d-none');
    }
};

const showSuccess = (element, message) => {
    if (element) {
        element.textContent = message;
        element.classList.remove('alert-danger');
        element.classList.add('alert-success');
        element.classList.remove('d-none');
    }
};

const switchModal = (fromId, toId) => {
    const fromEl = document.getElementById(fromId);
    const toEl = document.getElementById(toId);
    if (!fromEl || !toEl || !window.bootstrap) return;

    bootstrap.Modal.getInstance(fromEl)?.hide();
    bootstrap.Modal.getOrCreateInstance(toEl).show();
};

// --- Auth Functions ---

// 1. User Register
const handleRegister = async (e) => {
    e.preventDefault();
    const form = e.target;
    const { regError } = getElements();

    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const fname = formData.get('fname');
    const lname = formData.get('lname');
    const phone = formData.get('phone');

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating account...';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save profile to Firestore
        await setDoc(doc(db, "users", user.uid), {
            fname,
            lname,
            email,
            phone,
            role: 'user',
            createdAt: new Date()
        });
        
        await signOut(auth);
        switchModal('registerModal', 'loginModal');
        showSuccess(getElements().loginError, 'Account created. Please log in to continue.');
    } catch (error) {
        showError(regError, error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

// 2. Partner Register
const handlePartnerRegister = async (e) => {
    e.preventDefault();
    const form = e.target;
    const { pRegError } = getElements();

    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const corpName = formData.get('corp_name');
    const tin = formData.get('tin');
    const contact = formData.get('contact');
    const address = formData.get('part_address');

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creating partner account...';

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Save partner profile to Firestore
        await setDoc(doc(db, "users", user.uid), {
            corpName,
            tin,
            email,
            contact,
            address,
            role: 'partner',
            createdAt: new Date()
        });
        
        await signOut(auth);
        switchModal('partnerRegisterModal', 'partnerLoginModal');
        showSuccess(getElements().pLoginError, 'Partner account created. Please log in to continue.');
    } catch (error) {
        showError(pRegError, error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

// 3. Login
const handleLogin = async (e, errorEl, expectedRole = null) => {
    e.preventDefault();
    const form = e.target;

    if (!form.checkValidity()) {
        e.stopPropagation();
        form.classList.add('was-validated');
        return;
    }

    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Logging in...';

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
        const userData = userDoc.data();
        const role = userData?.role || 'user';

        // Admin 'Master Key': Always redirect to admin dashboard regardless of form used
        if (role === 'admin') {
            window.location.href = 'admin_dashboard.html';
            return;
        }

        if (expectedRole === 'partner' && role !== 'partner') {
            await signOut(auth);
            showError(errorEl, "This account is not registered as a partner.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        if (expectedRole === 'user' && role !== 'user') {
            if (role === 'partner') {
                window.location.href = 'partner_dashboard.html';
                return;
            }

            await signOut(auth);
            showError(errorEl, "This account cannot use the customer login.");
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            return;
        }

        if (role === 'partner') {
            window.location.href = 'partner_dashboard.html';
            return;
        }

        window.location.href = 'index.html';
    } catch (error) {
        showError(errorEl, "Invalid email or password.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
};

// 4. Logout
window.handleLogout = async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error("Logout error", error);
    }
};

// --- Navbar UI Management ---

const updateNavbar = async (user) => {
    const { authNavItems } = getElements();
    const logoLink = document.getElementById('navbar-logo-link');
    if (!authNavItems) return;

    if (user) {
        // Fetch user role from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        const role = userData?.role || 'user';
        
        if (role === 'admin') {
            if (logoLink) logoLink.href = 'admin_dashboard.html';
            authNavItems.innerHTML = `
                <div class="dropdown ms-3">
                    <button class="btn btn-danger dropdown-toggle rounded-pill px-4" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-shield-lock me-1"></i> Admin: ${escapeHtml(userData?.fname || 'Super Admin')}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2 py-3" style="min-width: 200px;">
                        <li><a class="dropdown-item px-4 py-2" href="admin_dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Admin Dashboard</a></li>
                        <li><hr class="dropdown-divider mx-4"></li>
                        <li><a class="dropdown-item px-4 py-2" href="#" onclick="handleLogout()" style="color: #dc3545 !important; font-weight: 600;"><i class="bi bi-box-arrow-right me-2"></i>Log out</a></li>
                    </ul>
                </div>
            `;
        } else if (role === 'partner') {
            if (logoLink) logoLink.href = 'partner_dashboard.html';
            authNavItems.innerHTML = `
                <div class="dropdown ms-3">
                    <button class="btn btn-dark dropdown-toggle rounded-pill px-4" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-building me-1"></i> Partner: ${escapeHtml(userData.corpName)}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2 py-3" style="min-width: 200px;">
                        <li><a class="dropdown-item px-4 py-2" href="partner_dashboard.html"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
                        <li><hr class="dropdown-divider mx-4"></li>
                        <li><a class="dropdown-item px-4 py-2" href="#" onclick="handleLogout()" style="color: #dc3545 !important; font-weight: 600;"><i class="bi bi-box-arrow-right me-2"></i>Log out</a></li>
                    </ul>
                </div>
            `;
        } else {
            if (logoLink) logoLink.href = 'index.html';
            const firstName = userData?.fname || user.displayName?.split(' ')[0] || 'Guest';
            authNavItems.innerHTML = `
                <div class="dropdown ms-3">
                    <button class="btn btn-outline-secondary dropdown-toggle rounded-pill px-4" type="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle me-1"></i> ${escapeHtml(firstName)}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2 py-3" style="min-width: 200px;">
                        <li><a class="dropdown-item px-4 py-2" href="my_bookings.html"><i class="bi bi-box-seam me-2"></i>My Bookings</a></li>
                        <li><hr class="dropdown-divider mx-4"></li>
                        <li><a class="dropdown-item px-4 py-2" href="#" onclick="handleLogout()" style="color: #dc3545 !important; font-weight: 600;"><i class="bi bi-box-arrow-right me-2"></i>Log out</a></li>
                    </ul>
                </div>
            `;
        }
    } else {
        if (logoLink) logoLink.href = 'index.html';
        authNavItems.innerHTML = `
            <a class="btn btn-outline-secondary rounded-pill px-4 ms-3" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">Log in | Sign up</a>
        `;
    }
};

// --- Initialization ---

const initAuthListeners = () => {
    const { loginForm, registerForm, partnerLoginForm, partnerRegisterForm, loginError, pLoginError } = getElements();

    if (loginForm) loginForm.addEventListener('submit', (e) => handleLogin(e, loginError, 'user'));
    if (partnerLoginForm) partnerLoginForm.addEventListener('submit', (e) => handleLogin(e, pLoginError, 'partner'));
    if (registerForm) registerForm.addEventListener('submit', handleRegister);
    if (partnerRegisterForm) partnerRegisterForm.addEventListener('submit', handlePartnerRegister);
};

// Check if components are already loaded to avoid race conditions
if (document.getElementById('login-form')) {
    initAuthListeners();
} else {
    window.addEventListener('componentsLoaded', initAuthListeners);
}

// Listen for Auth Changes
onAuthStateChanged(auth, async (user) => {
    // We might need to wait for componentsLoaded if this fires before injection
    if (document.getElementById('auth-nav-items')) {
        updateNavbar(user);
    } else {
        window.addEventListener('componentsLoaded', () => updateNavbar(user), { once: true });
    }
});
