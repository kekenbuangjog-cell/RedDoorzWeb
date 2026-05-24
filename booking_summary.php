<?php
require_once 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header("Location: index.php");
    exit();
}

$prop_id   = (int)$_POST['prop_id'];
$check_in  = $_POST['check_in'];
$check_out = $_POST['check_out'];
$guests    = (int)$_POST['guests'];

// Fetch property details
$stmt = $pdo->prepare("
    SELECT p.*, MIN(rt.Type_base_price) as min_price 
    FROM PROPERTY p 
    LEFT JOIN ROOM r ON p.Prop_id = r.Prop_id 
    LEFT JOIN ROOM_TYPE rt ON r.Type_id = rt.Type_id 
    WHERE p.Prop_id = ?
    GROUP BY p.Prop_id
");
$stmt->execute([$prop_id]);
$property = $stmt->fetch();

if (!$property) {
    header("Location: listings.php");
    exit();
}

// Calculate nights
$date1 = new DateTime($check_in);
$date2 = new DateTime($check_out);
$nights = $date1->diff($date2)->days;
if ($nights <= 0) $nights = 1;

$total_price = $property['min_price'] * $nights;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Booking Summary | RedDoorz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/common.css?v=<?php echo time(); ?>">
    <style>
        .summary-card { border-radius: 20px; border: none; box-shadow: 0 10px 40px rgba(0,0,0,0.05); }
        .hotel-img-sm { width: 120px; height: 120px; object-fit: cover; border-radius: 15px; }
    </style>
</head>
<body class="bg-light">

    <?php include 'includes/navbar.php'; ?>

    <div class="container my-5">
        <div class="row justify-content-center">
            <div class="col-lg-8">
                <h2 class="fw-bold mb-4">Confirm your booking</h2>
                
                <div class="card summary-card p-4 mb-4">
                    <div class="d-flex align-items-center mb-4">
                        <img src="<?php echo htmlspecialchars($property['Prop_image']); ?>" class="hotel-img-sm me-3" alt="Hotel">
                        <div>
                            <h5 class="fw-bold mb-1"><?php echo htmlspecialchars($property['Prop_name']); ?></h5>
                            <p class="text-muted small mb-0"><i class="bi bi-geo-alt"></i> <?php echo htmlspecialchars($property['Prop_city']); ?></p>
                            <span class="badge bg-primary mt-2">4.5 / 5 Excellent</span>
                        </div>
                    </div>

                    <hr>

                    <div class="row py-3">
                        <div class="col-md-6 mb-3 mb-md-0">
                            <h6 class="fw-bold small text-uppercase text-muted">Dates</h6>
                            <p class="mb-0 fw-semibold"><?php echo date('M d', strtotime($check_in)); ?> - <?php echo date('M d, Y', strtotime($check_out)); ?></p>
                            <small class="text-muted"><?php echo $nights; ?> Night(s)</small>
                        </div>
                        <div class="col-md-6 text-md-end">
                            <h6 class="fw-bold small text-uppercase text-muted">Guests</h6>
                            <p class="mb-0 fw-semibold"><?php echo $guests; ?> Guest(s)</p>
                        </div>
                    </div>

                    <hr>

                    <div class="py-3">
                        <h5 class="fw-bold mb-3">Price Details</h5>
                        <div class="d-flex justify-content-between mb-2">
                            <span>₱ <?php echo number_format($property['min_price']); ?> x <?php echo $nights; ?> nights</span>
                            <span>₱ <?php echo number_format($total_price); ?></span>
                        </div>
                        <div class="d-flex justify-content-between mb-2">
                            <span>Service Fee</span>
                            <span class="text-success">FREE</span>
                        </div>
                        <div class="d-flex justify-content-between mt-3 pt-3 border-top">
                            <span class="fw-bold fs-5">Total (PHP)</span>
                            <span class="fw-bold fs-5 text-danger">₱ <?php echo number_format($total_price); ?></span>
                        </div>
                    </div>
                </div>

                <div class="text-end">
                    <?php if (isset($_SESSION['user_id'])): ?>
                        <form action="process_booking.php" method="POST">
                            <input type="hidden" name="prop_id" value="<?php echo $prop_id; ?>">
                            <input type="hidden" name="check_in" value="<?php echo $check_in; ?>">
                            <input type="hidden" name="check_out" value="<?php echo $check_out; ?>">
                            <input type="hidden" name="total" value="<?php echo $total_price; ?>">
                            <button type="submit" class="btn btn-red px-5 py-3 fw-bold fs-5 rounded-pill">Confirm and Book</button>
                        </form>
                    <?php else: ?>
                        <div class="alert alert-warning text-start d-flex align-items-center mb-3">
                            <i class="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
                            <div>
                                <h6 class="fw-bold mb-0">Almost there!</h6>
                                <p class="mb-0 small">Please log in to your account to complete this booking.</p>
                            </div>
                        </div>
                        <button class="btn btn-red px-5 py-3 fw-bold fs-5 rounded-pill" data-bs-toggle="modal" data-bs-target="#loginModal">Log in to Confirm</button>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <?php include 'includes/modals.php'; ?>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>