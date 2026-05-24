<?php
require_once 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    $stmt = $pdo->prepare("SELECT * FROM PARTNER WHERE Part_email = ?");
    $stmt->execute([$email]);
    $partner = $stmt->fetch();

    if ($partner && password_verify($password, $partner['Part_password'])) {
        $_SESSION['partner_id'] = $partner['Part_id'];
        $_SESSION['partner_name'] = $partner['Part_corp_name'];
        header("Location: partner_dashboard.php");
        exit();
    } else {
        $_SESSION['login_error'] = "Invalid partner credentials.";
        header("Location: index.php");
        exit();
    }
}
?>