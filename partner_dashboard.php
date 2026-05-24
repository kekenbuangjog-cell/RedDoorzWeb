<?php
require_once 'config/db.php';

if (!isset($_SESSION['partner_id'])) {
    header("Location: index.php");
    exit();
}

$partner_id = $_SESSION['partner_id'];

// Fetch properties owned by this partner
$stmt = $pdo->prepare("SELECT * FROM PROPERTY WHERE Part_id = ?");
$stmt->execute([$partner_id]);
$my_properties = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Partner Dashboard | RedDoorz</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="css/common.css?v=<?php echo time(); ?>">
    <style>
        .dashboard-card { border-radius: 15px; border: none; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .property-thumb { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; }
    </style>
</head>
<body class="bg-light">

    <?php include 'includes/navbar.php'; ?>

    <div class="container my-5">
        <div class="row">
            <div class="col-md-12 d-flex justify-content-between align-items-center mb-4">
                <h2 class="fw-bold">Partner Dashboard</h2>
                <button class="btn btn-red px-4 py-2" data-bs-toggle="modal" data-bs-target="#addPropertyModal">
                    <i class="bi bi-plus-lg me-2"></i> List New Property
                </button>
            </div>

            <div class="col-md-12">
                <div class="card dashboard-card p-4">
                    <h5 class="fw-bold mb-4">Your Properties</h5>
                    
                    <?php if (count($my_properties) > 0): ?>
                        <div class="table-responsive">
                            <table class="table table-hover align-middle">
                                <thead class="table-light">
                                    <tr>
                                        <th>Property</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($my_properties as $prop): ?>
                                        <tr>
                                            <td>
                                                <div class="d-flex align-items-center">
                                                    <img src="<?php echo htmlspecialchars($prop['Prop_image']); ?>" class="property-thumb me-3">
                                                    <span class="fw-semibold"><?php echo htmlspecialchars($prop['Prop_name']); ?></span>
                                                </div>
                                            </td>
                                            <td><?php echo htmlspecialchars($prop['Prop_city']); ?></td>
                                            <td><span class="badge bg-success">Active</span></td>
                                            <td>
                                                <button class="btn btn-sm btn-outline-secondary">Edit</button>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php else: ?>
                        <div class="text-center py-5">
                            <p class="text-muted">You haven't listed any properties yet.</p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Property Modal -->
    <div class="modal fade" id="addPropertyModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
            <div class="modal-content border-0 rounded-4">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title fw-bold">List New Property</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <form action="add_property_action.php" method="POST">
                    <div class="modal-body p-4">
                        <div class="row g-3">
                            <div class="col-md-12">
                                <label class="form-label small fw-bold">Property Name</label>
                                <input type="text" name="name" class="form-control" placeholder="e.g. RedDoorz Plus @ Cebu" required>
                            </div>
                            <div class="col-md-12">
                                <label class="form-label small fw-bold">Description</label>
                                <textarea name="desc" class="form-control" rows="3" required></textarea>
                            </div>
                            <div class="col-md-12">
                                <label class="form-label small fw-bold">Main Image URL</label>
                                <input type="url" name="image" class="form-control" placeholder="https://unsplash.com/..." required>
                            </div>
                            <div class="col-md-12">
                                <label class="form-label small fw-bold">Amenities (comma separated)</label>
                                <input type="text" name="amenities" class="form-control" placeholder="wifi,snow,tv,water">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-bold">Street Address</label>
                                <input type="text" name="street" class="form-control" required>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label small fw-bold">City</label>
                                <input type="text" name="city" class="form-control" required>
                            </div>
                            <div class="col-md-2">
                                <label class="form-label small fw-bold">Zip</label>
                                <input type="text" name="zip" class="form-control" required>
                            </div>
                            <div class="col-md-6 border-top pt-3 mt-4">
                                <label class="form-label small fw-bold text-danger">Base Price per Night (PHP)</label>
                                <input type="number" name="price" class="form-control form-control-lg" placeholder="1000" required>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer border-0">
                        <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancel</button>
                        <button type="submit" class="btn btn-red px-5">Publish Listing</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <?php include 'includes/modals.php'; ?>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>