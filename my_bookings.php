<?php
require_once 'config/db.php';

// Redirect if not logged in
if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$user_id = $_SESSION['user_id'];

// Fetch user bookings with property details
$stmt = $pdo->prepare("
    SELECT b.*, p.Prop_name, p.Prop_image, p.Prop_city, r.Room_number
    FROM BOOKING b
    JOIN ROOM r ON b.Room_id = r.Room_id
    JOIN PROPERTY p ON r.Prop_id = p.Prop_id
    WHERE b.Acct_id = ?
    ORDER BY b.Book_in_date DESC
");
$stmt->execute([$user_id]);
$bookings = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Bookings | RedDoorz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/common.css?v=<?php echo time(); ?>">
    <style>
        .booking-card { border-radius: 15px; border: 1px solid #eee; overflow: hidden; transition: box-shadow 0.2s; }
        .booking-card:hover { box-shadow: 0 5px 15px rgba(0,0,0,0.05); }
        .hotel-img-list { width: 150px; height: 150px; object-fit: cover; }
        @media (max-width: 576px) { .hotel-img-list { width: 100%; height: 200px; } }
        .status-confirmed { background-color: #d1e7dd; color: #0f5132; }
        .status-cancelled { background-color: #f8d7da; color: #842029; }
    </style>
</head>
<body class="bg-light">

    <?php include 'includes/navbar.php'; ?>

    <div class="container my-5">
        <div class="row justify-content-center">
            <div class="col-lg-10">
                <h2 class="fw-bold mb-4">My Bookings</h2>

                <?php if (isset($_SESSION['cancel_success'])): ?>
                    <div class="alert alert-success alert-dismissible fade show rounded-4 mb-4" role="alert">
                        <i class="bi bi-check-circle-fill me-2"></i> <?php echo $_SESSION['cancel_success']; unset($_SESSION['cancel_success']); ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                <?php endif; ?>

                <?php if (isset($_SESSION['cancel_error'])): ?>
                    <div class="alert alert-danger alert-dismissible fade show rounded-4 mb-4" role="alert">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i> <?php echo $_SESSION['cancel_error']; unset($_SESSION['cancel_error']); ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                <?php endif; ?>

                <?php if (count($bookings) > 0): ?>
                    <?php foreach ($bookings as $booking): ?>
                        <div class="card booking-card mb-3 bg-white">
                            <div class="row g-0">
                                <div class="col-sm-auto">
                                    <img src="<?php echo htmlspecialchars($booking['Prop_image']); ?>" class="hotel-img-list" alt="Hotel">
                                </div>
                                <div class="col-sm p-4 d-flex flex-column justify-content-between">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5 class="fw-bold mb-1"><?php echo htmlspecialchars($booking['Prop_name']); ?></h5>
                                            <p class="text-muted small mb-2"><i class="bi bi-geo-alt"></i> <?php echo htmlspecialchars($booking['Prop_city']); ?> • Room <?php echo htmlspecialchars($booking['Room_number']); ?></p>
                                        </div>
                                        <span class="badge rounded-pill px-3 py-2 <?php echo $booking['Book_status'] === 'Confirmed' ? 'status-confirmed' : 'status-cancelled'; ?>">
                                            <?php echo $booking['Book_status']; ?>
                                        </span>
                                    </div>
                                    
                                    <div class="row align-items-end">
                                        <div class="col-md-8">
                                            <div class="d-flex small text-muted">
                                                <div class="me-4">
                                                    <span class="d-block fw-bold text-uppercase" style="font-size: 0.7rem;">Check-in</span>
                                                    <span class="text-dark fw-semibold"><?php echo date('M d, Y', strtotime($booking['Book_in_date'])); ?></span>
                                                </div>
                                                <div>
                                                    <span class="d-block fw-bold text-uppercase" style="font-size: 0.7rem;">Check-out</span>
                                                    <span class="text-dark fw-semibold"><?php echo date('M d, Y', strtotime($booking['Book_out_date'])); ?></span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="col-md-4 text-md-end mt-3 mt-md-0">
                                            <p class="mb-0 text-muted small">Total Paid</p>
                                            <h5 class="fw-bold text-danger mb-0">₱ <?php echo number_format($booking['Book_total']); ?></h5>
                                            
                                            <?php if ($booking['Book_status'] === 'Confirmed'): ?>
                                                <form action="cancel_action.php" method="POST" class="mt-2" onsubmit="return confirm('Are you sure you want to cancel this booking? This action cannot be undone.');">
                                                    <input type="hidden" name="book_id" value="<?php echo $booking['Book_id']; ?>">
                                                    <button type="submit" class="btn btn-outline-danger btn-sm rounded-pill px-3">Cancel Booking</button>
                                                </form>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <div class="text-center py-5 bg-white rounded-4 shadow-sm">
                        <i class="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
                        <h5>No bookings yet</h5>
                        <p class="text-muted">Explore our hotels and start your adventure in Cebu!</p>
                        <a href="listings.php" class="btn btn-red px-4 py-2 mt-2">Find Hotels</a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <?php include 'includes/modals.php'; ?>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>