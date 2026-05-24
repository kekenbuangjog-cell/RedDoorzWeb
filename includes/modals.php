<!-- Login Modal -->
<div class="modal fade" id="loginModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header border-0 pb-0">
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="text-center mb-4">
                    <h3 class="fw-bold">Welcome Back</h3>
                    <p class="text-muted">Log in to your account</p>
                </div>
                <?php if (isset($_SESSION['login_error'])): ?>
                    <div class="alert alert-danger py-2 small"><?php echo $_SESSION['login_error']; unset($_SESSION['login_error']); ?></div>
                <?php endif; ?>
                <form action="login_action.php" method="POST">
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Email address</label>
                        <input type="email" name="email" class="form-control rounded-3" placeholder="name@example.com" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label small fw-semibold">Password</label>
                        <input type="password" name="password" class="form-control rounded-3" placeholder="Enter password" required>
                    </div>
                    <button type="submit" class="btn btn-red w-100 py-2 rounded-3">Log In</button>
                </form>
                <div class="text-center mt-4">
                    <p class="mb-1 small">Don't have an account? <a href="#" class="text-danger fw-semibold" data-bs-toggle="modal" data-bs-target="#registerModal">Sign Up</a></p>
                    <p class="mb-0 small border-top pt-2">Are you a property owner? <a href="#" class="text-dark fw-bold" data-bs-toggle="modal" data-bs-target="#partnerLoginModal">Partner Login</a></p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Partner Login Modal -->
<div class="modal fade" id="partnerLoginModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header border-0 pb-0">
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="text-center mb-4">
                    <div class="badge bg-dark mb-2 px-3 py-2 rounded-pill">PARTNER PORTAL</div>
                    <h3 class="fw-bold">Partner Login</h3>
                    <p class="text-muted">Manage your property listings</p>
                </div>
                <form action="partner_login_action.php" method="POST">
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Business Email</label>
                        <input type="email" name="email" class="form-control rounded-3" placeholder="partner@example.com" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label small fw-semibold">Password</label>
                        <input type="password" name="password" class="form-control rounded-3" placeholder="••••••••" required>
                    </div>
                    <button type="submit" class="btn btn-dark w-100 py-2 rounded-3">Log In to Portal</button>
                </form>
                <div class="text-center mt-4">
                    <p class="mb-0 small">Want to list your property? <a href="#" class="text-primary fw-semibold" data-bs-toggle="modal" data-bs-target="#partnerRegisterModal">Apply as Partner</a></p>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Partner Register Modal -->
<div class="modal fade" id="partnerRegisterModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header border-0 pb-0">
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="text-center mb-4">
                    <h3 class="fw-bold">Partner with Us</h3>
                    <p class="text-muted">Fill out your business details</p>
                </div>
                <form action="partner_register_action.php" method="POST">
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Corporate Name</label>
                        <input type="text" name="corp_name" class="form-control rounded-3" placeholder="e.g., Grand Cebu Hotels Inc." required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">TIN Number</label>
                        <input type="text" name="tin" class="form-control rounded-3" placeholder="000-000-000-000" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Business Contact</label>
                        <input type="text" name="contact" class="form-control rounded-3" placeholder="0917XXXXXXX" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Business Address</label>
                        <input type="text" name="part_address" class="form-control rounded-3" placeholder="Street, City, Province" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Business Email</label>
                        <input type="email" name="email" class="form-control rounded-3" placeholder="admin@myhotel.com" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label small fw-semibold">Create Password</label>
                        <input type="password" name="password" class="form-control rounded-3" required>
                    </div>
                    <button type="submit" class="btn btn-red w-100 py-2 rounded-3">Submit Application</button>
                </form>
            </div>
        </div>
    </div>
</div>

<!-- Register Modal -->
<div class="modal fade" id="registerModal" tabindex="-1">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 rounded-4 shadow">
            <div class="modal-header border-0 pb-0">
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body p-4">
                <div class="text-center mb-4">
                    <h3 class="fw-bold">Create an Account</h3>
                    <p class="text-muted">Join RedDoorz today</p>
                </div>
                <?php if (isset($_SESSION['register_error'])): ?>
                    <div class="alert alert-danger py-2 small"><?php echo $_SESSION['register_error']; unset($_SESSION['register_error']); ?></div>
                <?php endif; ?>
                <form action="register_action.php" method="POST">
                    <div class="row g-2 mb-3">
                        <div class="col-6">
                            <label class="form-label small fw-semibold">First Name</label>
                            <input type="text" name="fname" class="form-control rounded-3" placeholder="John" required>
                        </div>
                        <div class="col-6">
                            <label class="form-label small fw-semibold">Last Name</label>
                            <input type="text" name="lname" class="form-control rounded-3" placeholder="Doe" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Phone Number</label>
                        <input type="text" name="phone" class="form-control rounded-3" placeholder="09123456789" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Email address</label>
                        <input type="email" name="email" class="form-control rounded-3" placeholder="name@example.com" required>
                    </div>
                    <div class="mb-4">
                        <label class="form-label small fw-semibold">Password</label>
                        <input type="password" name="password" class="form-control rounded-3" placeholder="Create password" required>
                    </div>
                    <button type="submit" class="btn btn-red w-100 py-2 rounded-3">Sign Up</button>
                </form>
                <div class="text-center mt-4">
                    <p class="mb-0">Already have an account? <a href="#" class="text-danger fw-semibold" data-bs-toggle="modal" data-bs-target="#loginModal">Log In</a></p>
                </div>
            </div>
        </div>
    </div>
</div>