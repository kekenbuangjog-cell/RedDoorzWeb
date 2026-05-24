<?php
require_once 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $corp_name = trim($_POST['corp_name']);
    $tin       = trim($_POST['tin']);
    $contact   = trim($_POST['contact']);
    $address   = trim($_POST['part_address']);
    $email     = trim($_POST['email']);
    $password  = password_hash($_POST['password'], PASSWORD_DEFAULT);

    $stmt = $pdo->prepare("INSERT INTO PARTNER (Part_corp_name, Part_email, Part_password, Part_contact, Part_tin_num, Part_address) VALUES (?, ?, ?, ?, ?, ?)");
    try {
        $stmt->execute([$corp_name, $email, $password, $contact, $tin, $address]);
        $_SESSION['partner_id'] = $pdo->lastInsertId();
        $_SESSION['partner_name'] = $corp_name;
        header("Location: partner_dashboard.php");
        exit();
    } catch(PDOException $e) {
        $_SESSION['register_error'] = "Partner registration failed.";
        header("Location: index.php");
        exit();
    }
}
?>