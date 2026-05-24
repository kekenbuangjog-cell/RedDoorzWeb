<?php
require_once 'config/db.php';

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

// Fetch specific property details
$stmt = $pdo->prepare("
    SELECT p.*, MIN(rt.Type_base_price) as min_price 
    FROM PROPERTY p 
    LEFT JOIN ROOM r ON p.Prop_id = r.Prop_id 
    LEFT JOIN ROOM_TYPE rt ON r.Type_id = rt.Type_id 
    WHERE p.Prop_id = ?
    GROUP BY p.Prop_id
");
$stmt->execute([$id]);
$property = $stmt->fetch();

if (!$property) {
    header("Location: listings.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($property['Prop_name']); ?> | RedDoorz</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <!-- Google Fonts: Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/common.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="css/details.css">
</head>
<body>

    <?php include 'includes/navbar.php'; ?>

    <div class="container my-5">
        <div class="row g-4">
            <!-- Left Side: Property Details -->
            <div class="col-lg-8">
                <div class="details-container">
                    <img src="<?php echo htmlspecialchars($property['Prop_image']); ?>" class="main-img mb-4" alt="<?php echo htmlspecialchars($property['Prop_name']); ?>">
                    
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h2 class="fw-bold mb-1"><?php echo htmlspecialchars($property['Prop_name']); ?></h2>
                            <p class="text-muted"><i class="bi bi-geo-alt"></i> <?php echo htmlspecialchars($property['Prop_street'] . ', ' . $property['Prop_city'] . ' ' . $property['Prop_zip']); ?></p>
                        </div>
                        <div class="text-end">
                            <span class="badge bg-primary fs-5 px-3 py-2">4.5 / 5</span>
                            <p class="text-muted small mt-1">Excellent Rating</p>
                        </div>
                    </div>

                    <hr class="my-4">

                    <h4 class="fw-bold mb-3">About this Hotel</h4>
                    <p class="text-secondary">
                        <?php echo nl2br(htmlspecialchars($property['Prop_desc'])); ?>
                    </p>

                    <h4 class="fw-bold mt-4 mb-3">Amenities</h4>
                    <div class="row g-3">
                        <?php 
                        $amenities = explode(',', $property['Prop_amenities']);
                        $labels = [
                            'wifi' => 'Free High-speed WiFi',
                            'snow' => 'Air Conditioning',
                            'tv' => 'Flat-screen TV',
                            'water' => '24/7 Hot Shower',
                            'droplet' => 'Mineral Water',
                            'shield-check' => '24-Hour Security'
                        ];
                        foreach ($amenities as $amenity): 
                            $icon = trim($amenity);
                            $label = isset($labels[$icon]) ? $labels[$icon] : ucwords(str_replace('-', ' ', $icon));
                        ?>
                        <div class="col-md-4">
                            <i class="bi bi-<?php echo $icon; ?> text-danger me-2"></i> <?php echo $label; ?>
                        </div>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>

            <!-- Right Side: Booking Card -->
            <div class="col-lg-4">
                <div class="card booking-card">
                    <div class="card-body p-4">
                        <div class="mb-4">
                            <span class="price-big">₱ <?php echo number_format($property['min_price']); ?></span>
                            <span class="text-muted">/ night</span>
                        </div>

                        <form action="booking_summary.php" method="POST">
                            <input type="hidden" name="prop_id" value="<?php echo $property['Prop_id']; ?>">
                            <div class="mb-3">
                                <label class="form-label small fw-bold">Check-in</label>
                                <input type="date" name="check_in" class="form-control" value="<?php echo date('Y-m-d'); ?>" min="<?php echo date('Y-m-d'); ?>" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-bold">Check-out</label>
                                <input type="date" name="check_out" class="form-control" value="<?php echo date('Y-m-d', strtotime('+1 day')); ?>" min="<?php echo date('Y-m-d', strtotime('+1 day')); ?>" required>
                            </div>
                            <div class="mb-4">
                                <label class="form-label small fw-bold">Guests</label>
                                <select name="guests" class="form-select">
                                    <option value="1">1 Guest</option>
                                    <option value="2" selected>2 Guests</option>
                                    <option value="3">3 Guests</option>
                                </select>
                            </div>
                            <button type="submit" class="btn btn-red w-100 py-3 fw-bold fs-5">Book Now</button>
                        </form>
                        
                        <div class="mt-4 text-center">
                            <p class="text-muted small">You won't be charged yet</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <?php include 'includes/modals.php'; ?>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>