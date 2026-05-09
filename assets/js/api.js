const API = {
    async request(url, options = {}) {
        const defaults = {
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        };
        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            options.body = JSON.stringify(options.body);
        }
        if (options.body instanceof FormData) {
            delete defaults.headers['Content-Type'];
        }
        const response = await fetch(url, { ...defaults, ...options });
        if (response.status === 401) {
            window.location.reload();
            throw new Error('Unauthorized');
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Request failed');
        return data;
    },

    // Auth
    login: (data) => API.request('api/auth.php?action=login', { method: 'POST', body: data }),
    logout: () => API.request('api/auth.php?action=logout'),
    getProfile: () => API.request('api/auth.php?action=profile'),
    changePassword: (data) => API.request('api/auth.php?action=change-password', { method: 'PUT', body: data }),
    register: (data) => API.request('api/auth.php?action=register', { method: 'POST', body: data }),

    // Products
    getProducts: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return API.request(`api/products.php?action=list&${qs}`);
    },
    getProduct: (id) => API.request(`api/products.php?action=get&id=${id}`),
    getProductByBarcode: (barcode) => API.request(`api/products.php?action=barcode&barcode=${barcode}`),
    createProduct: (data) => API.request('api/products.php?action=create', { method: 'POST', body: data }),
    updateProduct: (id, data) => API.request(`api/products.php?action=update&id=${id}`, { method: 'PUT', body: data }),
    adjustStock: (id, data) => API.request(`api/products.php?action=stock&id=${id}`, { method: 'PUT', body: data }),
    deleteProduct: (id) => API.request(`api/products.php?action=delete&id=${id}`, { method: 'DELETE' }),

    // Categories
    getCategories: () => API.request('api/categories.php?action=list'),
    createCategory: (data) => API.request('api/categories.php?action=create', { method: 'POST', body: data }),
    updateCategory: (id, data) => API.request(`api/categories.php?action=update&id=${id}`, { method: 'PUT', body: data }),
    deleteCategory: (id) => API.request(`api/categories.php?action=delete&id=${id}`, { method: 'DELETE' }),

    // Transactions
    getTransactions: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return API.request(`api/transactions.php?action=list&${qs}`);
    },
    getTransaction: (id) => API.request(`api/transactions.php?action=get&id=${id}`),
    createTransaction: (data) => API.request('api/transactions.php?action=create', { method: 'POST', body: data }),
    cancelTransaction: (id) => API.request(`api/transactions.php?action=cancel&id=${id}`, { method: 'PUT' }),

    // Customers
    getCustomers: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return API.request(`api/customers.php?action=list&${qs}`);
    },
    createCustomer: (data) => API.request('api/customers.php?action=create', { method: 'POST', body: data }),
    updateCustomer: (id, data) => API.request(`api/customers.php?action=update&id=${id}`, { method: 'PUT', body: data }),
    deleteCustomer: (id) => API.request(`api/customers.php?action=delete&id=${id}`, { method: 'DELETE' }),

    // Work Orders
    getWorkOrders: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return API.request(`api/work_orders.php?action=list&${qs}`);
    },
    getWorkOrder: (id) => API.request(`api/work_orders.php?action=get&id=${id}`),
    createWorkOrder: (data) => API.request('api/work_orders.php?action=create', { method: 'POST', body: data }),
    updateWorkOrderStatus: (id, data) => API.request(`api/work_orders.php?action=update-status&id=${id}`, { method: 'PUT', body: data }),
    completeWorkOrder: (id, data) => API.request(`api/work_orders.php?action=complete-pay&id=${id}`, { method: 'PUT', body: data }),

    // Reports
    getDashboard: () => API.request('api/reports.php?action=dashboard'),
    getSalesReport: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return API.request(`api/reports.php?action=sales&${qs}`);
    },
    getProfitReport: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return API.request(`api/reports.php?action=profit&${qs}`);
    },
    getStockReport: () => API.request('api/reports.php?action=stock'),

    // Users
    getUsers: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return API.request(`api/users.php?action=list&${qs}`);
    },
    updateUser: (id, data) => API.request(`api/users.php?action=update&id=${id}`, { method: 'PUT', body: data }),
    resetPassword: (id, data) => API.request(`api/users.php?action=reset-password&id=${id}`, { method: 'PUT', body: data }),
    deleteUser: (id) => API.request(`api/users.php?action=delete&id=${id}`, { method: 'DELETE' }),

    // Branches
    getBranches: () => API.request('api/branches.php?action=list'),
    createBranch: (data) => API.request('api/branches.php?action=create', { method: 'POST', body: data }),
    updateBranch: (id, data) => API.request(`api/branches.php?action=update&id=${id}`, { method: 'PUT', body: data }),
    deleteBranch: (id) => API.request(`api/branches.php?action=delete&id=${id}`, { method: 'DELETE' }),

    // Expenses
    getExpenses: (params = {}) => {
        const qs = new URLSearchParams(params).toString();
        return API.request(`api/expenses.php?action=list&${qs}`);
    },
    createExpense: (data) => API.request('api/expenses.php?action=create', { method: 'POST', body: data }),
    deleteExpense: (id) => API.request(`api/expenses.php?action=delete&id=${id}`, { method: 'DELETE' }),

    // Settings
    getSettings: () => API.request('api/settings.php?action=list'),
    updateSettings: (data) => API.request('api/settings.php?action=update', { method: 'PUT', body: data }),
    uploadLogo: (formData) => API.request('api/settings.php?action=upload-logo', { method: 'POST', body: formData }),
    deleteLogo: () => API.request('api/settings.php?action=delete-logo', { method: 'DELETE' }),

    // Backup
    getBackups: () => API.request('api/backup.php?action=list'),
    createBackup: () => API.request('api/backup.php?action=create', { method: 'POST' }),
    deleteBackup: (filename) => API.request(`api/backup.php?action=delete&filename=${filename}`, { method: 'DELETE' }),
};

// Utilities
function formatCurrency(amount) {
    return 'Rp ' + Number(amount || 0).toLocaleString('id-ID');
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDateShort(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusBadge(status) {
    const map = {
        'pending': ['Menunggu', 'badge-yellow'],
        'in_progress': ['Dikerjakan', 'badge-blue'],
        'waiting_parts': ['Tunggu Part', 'badge-orange'],
        'completed': ['Selesai', 'badge-green'],
        'cancelled': ['Dibatalkan', 'badge-red'],
        'delivered': ['Diserahkan', 'badge-purple'],
        'paid': ['Lunas', 'badge-green'],
        'partial': ['Sebagian', 'badge-orange'],
    };
    const [label, cls] = map[status] || [status, 'badge-gray'];
    return `<span class="badge ${cls}">${label}</span>`;
}

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = message;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
