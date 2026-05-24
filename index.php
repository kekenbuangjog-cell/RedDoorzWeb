<?php
require_once 'config/db.php';

// Fetch Recommended Properties with their lowest room price
$stmt = $pdo->query("
    SELECT p.*, MIN(rt.Type_base_price) as min_price 
    FROM PROPERTY p 
    LEFT JOIN ROOM r ON p.Prop_id = r.Prop_id 
    LEFT JOIN ROOM_TYPE rt ON r.Type_id = rt.Type_id 
    GROUP BY p.Prop_id 
    LIMIT 4
");
$properties = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RedDoorz | Book Affordable Hotels</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <!-- Google Fonts: Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/common.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="css/index.css">
</head>
<body>

    <?php include 'includes/navbar.php'; ?>

    <?php if (isset($_SESSION['booking_success'])): ?>
        <div class="container mt-4">
            <div class="alert alert-success alert-dismissible fade show border-0 shadow-sm rounded-4 p-4" role="alert">
                <div class="d-flex align-items-center">
                    <i class="bi bi-check-circle-fill fs-1 me-4"></i>
                    <div>
                        <h4 class="alert-heading fw-bold mb-1">Booking Confirmed!</h4>
                        <p class="mb-0"><?php echo $_SESSION['booking_success']; unset($_SESSION['booking_success']); ?></p>
                    </div>
                </div>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        </div>
    <?php endif; ?>

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="container">
            <h1 class="display-4 fw-bold mb-3">Book Affordable Hotels in Cebu</h1>
            <p class="lead mb-0">Safe, Clean, and Budget-friendly stays.</p>
        </div>
    </section>

    <!-- Search Bar -->
    <div class="container mb-5">
        <div class="search-container">
            <form action="listings.php" method="GET" class="row g-3 justify-content-center">
                <div class="col-md-10">
                    <label class="form-label fw-semibold">Search for your next stay</label>
                    <div class="input-group input-group-lg">
                        <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                        <input type="text" name="search" class="form-control border-start-0 ps-0" placeholder="Enter city, hotel name, or location..." required>
                        <button type="submit" class="btn btn-red px-5">Search</button>
                    </div>
                </div>
            </form>
        </div>
    </div>

    <!-- Recommended Properties -->
    <div class="container mb-5">
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h2 class="fw-bold h3 mb-0">Recommended for You</h2>
            <a href="listings.php" class="text-decoration-none text-danger fw-semibold">View all <i class="bi bi-arrow-right"></i></a>
        </div>
        
        <div class="row g-4">
            <?php foreach ($properties as $property): ?>
            <!-- Property Card -->
            <div class="col-md-3">
                <div class="card property-card h-100" onclick="location.href='details.php?id=<?php echo $property['Prop_id']; ?>'" style="cursor: pointer;">
                    <img src="<?php echo htmlspecialchars($property['Prop_image']); ?>" class="card-img-top" alt="<?php echo htmlspecialchars($property['Prop_name']); ?>">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-2">
                            <span class="badge bg-primary me-2">4.5 / 5</span>
                            <small class="text-muted"><?php echo htmlspecialchars($property['Prop_city']); ?></small>
                        </div>
                        <h5 class="card-title fw-bold text-truncate"><?php echo htmlspecialchars($property['Prop_name']); ?></h5>
                        <div class="mt-3">
                            <span class="price-tag">₱ <?php echo number_format($property['min_price']); ?></span>
                            <small class="text-muted">/ night</small>
                        </div>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <?php include 'includes/modals.php'; ?>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>