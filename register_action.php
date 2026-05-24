<?php
require_once 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $fname = trim($_POST['fname']);
    $lname = trim($_POST['lname']);
    $phone = trim($_POST['phone']);
    $email = trim($_POST['email']);
    $password = $_POST['password'];
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    $checkStmt = $pdo->prepare("SELECT Acct_id FROM USER_ACCOUNT WHERE Acct_username = ?");
    $checkStmt->execute([$email]);
    if ($checkStmt->fetch()) {
        $_SESSION['register_error'] = "Email already exists.";
        $redirect = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'index.php';
        header("Location: " . $redirect);
        exit();
    }

    $stmt = $pdo->prepare("INSERT INTO USER_ACCOUNT (Acct_username, Acct_password, Acct_fname, Acct_lname, Acct_phone, Acct_status) VALUES (?, ?, ?, ?, ?, ?)");
    try {
        $stmt->execute([$email, $hashed_password, $fname, $lname, $phone, 'Active']);
        $_SESSION['user_id'] = $pdo->lastInsertId();
        $_SESSION['user_name'] = $fname . ' ' . $lname;
        header("Location: index.php");
        exit();
    } catch(PDOException $e) {
        $_SESSION['register_error'] = "Registration failed.";
        header("Location: index.php");
        exit();
    }
}
?>