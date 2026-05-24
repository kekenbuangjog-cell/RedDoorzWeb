<nav class="navbar navbar-expand-lg navbar-light bg-white sticky-top shadow-sm">
    <div class="container">
        <a class="navbar-brand d-flex align-items-center" href="index.php">
            <i class="bi bi-door-closed-fill me-2 fs-3"></i>
            <span>RedDoorz</span>
        </a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <div class="ms-auto d-flex align-items-center">
                <?php if (isset($_SESSION['partner_id'])): ?>
                    <div class="dropdown ms-3">
                        <button class="btn btn-dark dropdown-toggle rounded-pill px-4" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-building me-1"></i> Partner: <?php echo htmlspecialchars($_SESSION['partner_name']); ?>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2 py-3" style="min-width: 200px;">
                            <li><a class="dropdown-item px-4 py-2" href="partner_dashboard.php" style="color: #212529 !important;"><i class="bi bi-speedometer2 me-2"></i>Dashboard</a></li>
                            <li><hr class="dropdown-divider mx-4"></li>
                            <li><a class="dropdown-item px-4 py-2" href="logout.php" style="color: #dc3545 !important; font-weight: 600;"><i class="bi bi-box-arrow-right me-2"></i>Log out</a></li>
                        </ul>
                    </div>
                <?php elseif (isset($_SESSION['user_id'])): ?>
                    <div class="dropdown ms-3">
                        <button class="btn btn-outline-secondary dropdown-toggle rounded-pill px-4" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-person-circle me-1"></i> <?php echo htmlspecialchars($_SESSION['user_name']); ?>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow border-0 rounded-4 mt-2 py-3" style="min-width: 200px;">
                            <li><a class="dropdown-item px-4 py-2" href="my_bookings.php" style="color: #212529 !important;"><i class="bi bi-box-seam me-2"></i>My Bookings</a></li>
                            <li><hr class="dropdown-divider mx-4"></li>
                            <li><a class="dropdown-item px-4 py-2" href="logout.php" style="color: #dc3545 !important; font-weight: 600;"><i class="bi bi-box-arrow-right me-2"></i>Log out</a></li>
                        </ul>
                    </div>
                <?php else: ?>
                    <a class="btn btn-outline-secondary rounded-pill px-4 ms-3" href="#" data-bs-toggle="modal" data-bs-target="#loginModal">Log in | Sign up</a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</nav>