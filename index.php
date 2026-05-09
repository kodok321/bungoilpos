<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bungoil POS - Point of Sale</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>&#x1f6e0;</text></svg>">
</head>
<body>
    <!-- Toast Container -->
    <div class="toast-container" id="toast-container"></div>

    <!-- Login Page -->
    <div id="login-page" class="hidden">
        <div class="login-card">
            <div style="text-align:center;margin-bottom:1rem">
                <div style="width:60px;height:60px;background:#1e3a5f;border-radius:16px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:1.5rem;font-weight:700">BP</div>
            </div>
            <h1>Bungoil POS</h1>
            <p class="subtitle">Sistem Point of Sale - Sparepart & Jasa Mekanik</p>
            <div class="login-info">
                <strong>Demo Login:</strong><br>
                Admin: admin / admin123<br>
                Kasir: kasir / kasir123<br>
                Mekanik: mekanik / mekanik123
            </div>
            <form id="login-form">
                <div class="form-group">
                    <label>Username</label>
                    <input class="form-control" id="login-username" type="text" placeholder="Masukkan username" required autofocus>
                </div>
                <div class="form-group">
                    <label>Password</label>
                    <input class="form-control" id="login-password" type="password" placeholder="Masukkan password" required>
                </div>
                <button type="submit" class="btn btn-primary btn-lg w-full" style="justify-content:center">Masuk</button>
            </form>
        </div>
    </div>

    <!-- App Page -->
    <div id="app-page" class="hidden">
        <!-- Mobile Sidebar Toggle -->
        <button class="sidebar-toggle" onclick="toggleSidebar()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>

        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-icon">BP</div>
                <h2>Bungoil POS</h2>
            </div>
            <nav class="sidebar-nav" id="sidebar-nav"></nav>
            <div class="sidebar-footer">
                <div class="user-avatar" id="user-avatar">A</div>
                <div class="user-info">
                    <div class="name" id="user-name">-</div>
                    <div class="role" id="user-role">-</div>
                </div>
                <button class="btn-logout" onclick="handleLogout()" title="Logout">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </button>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <div id="page-content">
                <div class="spinner"></div>
            </div>
        </main>
    </div>

    <script src="assets/js/api.js"></script>
    <script src="assets/js/app.js"></script>
</body>
</html>
