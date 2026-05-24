<?php
require_once 'config/db.php';

// Get filter parameters
$search = isset($_GET['search']) ? trim($_GET['search']) : '';
$selected_prices = isset($_GET['price']) ? $_GET['price'] : [];
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'popularity';

// Base SQL query
$sql = "
    SELECT p.*, MIN(rt.Type_base_price) as min_price 
    FROM PROPERTY p 
    LEFT JOIN ROOM r ON p.Prop_id = r.Prop_id 
    LEFT JOIN ROOM_TYPE rt ON r.Type_id = rt.Type_id 
";

$where_clauses = [];
$params = [];

// Apply Universal Search
if (!empty($search)) {
    $where_clauses[] = "(p.Prop_city LIKE ? OR p.Prop_name LIKE ? OR p.Prop_street LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if (!empty($where_clauses)) {
    $sql .= " WHERE " . implode(" AND ", $where_clauses);
}

$sql .= " GROUP BY p.Prop_id ";

// Apply Price Filtering (using HAVING because min_price is an aggregate)
if (!empty($selected_prices)) {
    $having_clauses = [];
    foreach ($selected_prices as $range) {
        if ($range === '0-1000') {
            $having_clauses[] = "min_price BETWEEN 0 AND 1000";
        } elseif ($range === '1000-2000') {
            $having_clauses[] = "min_price BETWEEN 1000 AND 2000";
        } elseif ($range === '2000+') {
            $having_clauses[] = "min_price > 2000";
        }
    }
    if (!empty($having_clauses)) {
        $sql .= " HAVING " . implode(" OR ", $having_clauses);
    }
}

// Apply Sorting
switch ($sort) {
    case 'price_low':
        $sql .= " ORDER BY min_price ASC ";
        break;
    case 'price_high':
        $sql .= " ORDER BY min_price DESC ";
        break;
    default:
        $sql .= " ORDER BY p.Prop_id DESC "; // Default "Popularity"
        break;
}

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$listings = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Search Results | RedDoorz</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Bootstrap Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <!-- Google Fonts: Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Custom CSS -->
    <link rel="stylesheet" href="css/common.css?v=<?php echo time(); ?>">
    <link rel="stylesheet" href="css/listings.css">
</head>
<body>

    <?php include 'includes/navbar.php'; ?>

    <form action="listings.php" method="GET" id="filterForm">
        <!-- Search Bar Sub-nav -->
        <div class="bg-white border-bottom py-3 mb-4">
            <div class="container">
                <div class="row g-2 justify-content-center">
                    <div class="col-md-8">
                        <div class="input-group">
                            <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-muted"></i></span>
                            <input type="text" name="search" class="form-control border-start-0 ps-0" placeholder="Search by city, hotel name, or location..." value="<?php echo htmlspecialchars($search); ?>">
                            <button type="submit" class="btn btn-red px-4">Update Search</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="container mb-5">
            <div class="row">
                <!-- Filter Sidebar -->
                <div class="col-md-3 d-none d-md-block">
                    <div class="filter-sidebar">
                        <div class="d-flex justify-content-between align-items-center mb-4">
                            <h5 class="fw-bold mb-0">Filter by</h5>
                            <a href="listings.php" class="text-danger small text-decoration-none">Clear All</a>
                        </div>
                        
                        <div class="mb-4">
                            <h6 class="fw-semibold">Price Range</h6>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" name="price[]" value="0-1000" id="price1" onchange="this.form.submit()" <?php echo in_array('0-1000', $selected_prices) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="price1">₱ 0 - ₱ 1,000</label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" name="price[]" value="1000-2000" id="price2" onchange="this.form.submit()" <?php echo in_array('1000-2000', $selected_prices) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="price2">₱ 1,000 - ₱ 2,000</label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" name="price[]" value="2000+" id="price3" onchange="this.form.submit()" <?php echo in_array('2000+', $selected_prices) ? 'checked' : ''; ?>>
                                <label class="form-check-label" for="price3">₱ 2,000+</label>
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6 class="fw-semibold">User Rating</h6>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="rate4" disabled>
                                <label class="form-check-label text-muted" for="rate4">4+ Stars</label>
                            </div>
                            <div class="form-check mb-2">
                                <input class="form-check-input" type="checkbox" id="rate3" disabled>
                                <label class="form-check-label text-muted" for="rate3">3+ Stars</label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Listings -->
                <div class="col-md-9">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h4 class="fw-bold mb-0">
                            <span id="hotelCount"><?php echo count($listings); ?></span> Hotels in <?php echo !empty($search) ? htmlspecialchars($search) : 'Cebu'; ?>
                        </h4>
                        <select name="sort" class="form-select w-auto" onchange="this.form.submit()">
                            <option value="popularity" <?php echo $sort === 'popularity' ? 'selected' : ''; ?>>Sort by: Popularity</option>
                            <option value="price_low" <?php echo $sort === 'price_low' ? 'selected' : ''; ?>>Price: Low to High</option>
                            <option value="price_high" <?php echo $sort === 'price_high' ? 'selected' : ''; ?>>Price: High to Low</option>
                        </select>
                    </div>

                    <?php if (count($listings) > 0): ?>
                        <?php foreach ($listings as $item): ?>
                        <!-- Result Item -->
                        <div class="property-card-list" onclick="location.href='details.php?id=<?php echo $item['Prop_id']; ?>'">
                            <img src="<?php echo htmlspecialchars($item['Prop_image']); ?>" alt="<?php echo htmlspecialchars($item['Prop_name']); ?>">
                            <div class="p-4 flex-grow-1 d-flex flex-column justify-content-between">
                                <div>
                                    <div class="d-flex justify-content-between">
                                        <h5 class="fw-bold"><?php echo htmlspecialchars($item['Prop_name']); ?></h5>
                                        <span class="badge bg-primary h-100 px-2 py-1">4.5 / 5</span>
                                    </div>
                                    <p class="text-muted small mb-2"><i class="bi bi-geo-alt"></i> <?php echo htmlspecialchars($item['Prop_street'] . ', ' . $item['Prop_city']); ?></p>
                                    <p class="text-secondary small">
                                        <?php 
                                        $amenities = explode(',', $item['Prop_amenities']);
                                        foreach ($amenities as $amenity) {
                                            echo '<span class="me-2">• ' . ucwords(str_replace('-', ' ', trim($amenity))) . '</span>';
                                        }
                                        ?>
                                    </p>
                                </div>
                                <div class="d-flex justify-content-between align-items-end">
                                    <div>
                                        <span class="price-text">₱ <?php echo number_format($item['min_price']); ?></span>
                                        <small class="text-muted">/ night</small>
                                    </div>
                                    <button type="button" class="btn btn-red px-4">Book Now</button>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <div class="text-center py-5">
                            <i class="bi bi-search fs-1 text-muted mb-3 d-block"></i>
                            <h5>No properties found matching your criteria</h5>
                            <p class="text-muted">Try adjusting your filters or search term.</p>
                            <a href="listings.php" class="btn btn-red">Clear All Filters</a>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </form>

    <?php include 'includes/modals.php'; ?>

    <!-- Bootstrap 5 JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>