/**
 * Main JavaScript file for Real Estate Accounting System
 * Handles HTMX interactions and UI enhancements
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeHTMX();
    initializeAlpine();
    initializeSearch();
    initializeModals();
    initializeNotifications();
});

/**
 * Initialize HTMX configuration
 */
function initializeHTMX() {
    // Configure HTMX defaults
    htmx.config.defaultSwapStyle = 'innerHTML';
    htmx.config.defaultSwapDelay = 100;
    htmx.config.defaultSettleDelay = 100;
    
    // Add loading indicators
    htmx.on('htmx:beforeRequest', function(evt) {
        const target = evt.target;
        if (target.hasAttribute('hx-indicator')) {
            const indicator = document.querySelector(target.getAttribute('hx-indicator'));
            if (indicator) {
                indicator.classList.remove('hidden');
                indicator.classList.add('block');
            }
        }
    });
    
    htmx.on('htmx:afterRequest', function(evt) {
        const target = evt.target;
        if (target.hasAttribute('hx-indicator')) {
            const indicator = document.querySelector(target.getAttribute('hx-indicator'));
            if (indicator) {
                indicator.classList.add('hidden');
                indicator.classList.remove('block');
            }
        }
    });
    
    // Handle HTMX errors
    htmx.on('htmx:responseError', function(evt) {
        console.error('HTMX Error:', evt.detail);
        showNotification('حدث خطأ في الطلب', 'error');
    });
}

/**
 * Initialize Alpine.js components
 */
function initializeAlpine() {
    // Auto-refresh dashboard stats
    if (document.getElementById('dashboard-stats')) {
        setInterval(function() {
            htmx.trigger('#dashboard-stats', 'load');
        }, 30000);
    }
}

/**
 * Initialize search functionality
 */
function initializeSearch() {
    // Customer search
    const customerSearchInput = document.getElementById('customer-search');
    if (customerSearchInput) {
        customerSearchInput.addEventListener('input', function() {
            const searchTerm = this.value;
            if (searchTerm.length >= 2) {
                htmx.ajax('GET', '/htmx/customers/', {
                    values: { search: searchTerm },
                    target: '#customer-results'
                });
            }
        });
    }
    
    // Unit search
    const unitSearchInput = document.getElementById('unit-search');
    if (unitSearchInput) {
        unitSearchInput.addEventListener('input', function() {
            const searchTerm = this.value;
            if (searchTerm.length >= 2) {
                htmx.ajax('GET', '/htmx/units/', {
                    values: { search: searchTerm },
                    target: '#unit-results'
                });
            }
        });
    }
}

/**
 * Initialize modal functionality
 */
function initializeModals() {
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    modal.classList.add('hidden');
                }
            });
        }
    });
    
    // Close modal on backdrop click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal-backdrop')) {
            e.target.closest('.modal').classList.add('hidden');
        }
    });
}

/**
 * Initialize notification system
 */
function initializeNotifications() {
    // Auto-hide success messages after 5 seconds
    const successMessages = document.querySelectorAll('.alert-success');
    successMessages.forEach(message => {
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => {
                message.remove();
            }, 300);
        }, 5000);
    });
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-sm`;
    notification.innerHTML = `
        <div class="flex items-center">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="mr-2 text-lg">&times;</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

/**
 * Select customer from search results
 */
function selectCustomer(element) {
    const customerId = element.dataset.customerId;
    const customerName = element.dataset.customerName;
    const customerPhone = element.dataset.customerPhone;
    
    // Update form fields
    const customerIdInput = document.getElementById('customer_id');
    const customerNameInput = document.getElementById('customer_name');
    const customerPhoneInput = document.getElementById('customer_phone');
    
    if (customerIdInput) customerIdInput.value = customerId;
    if (customerNameInput) customerNameInput.value = customerName;
    if (customerPhoneInput) customerPhoneInput.value = customerPhone;
    
    // Hide search results
    const searchResults = document.getElementById('customer-results');
    if (searchResults) searchResults.classList.add('hidden');
    
    // Clear search input
    const searchInput = document.getElementById('customer-search');
    if (searchInput) searchInput.value = '';
}

/**
 * Select unit from search results
 */
function selectUnit(element) {
    const unitId = element.dataset.unitId;
    const unitCode = element.dataset.unitCode;
    const unitName = element.dataset.unitName;
    const unitPrice = element.dataset.unitPrice;
    
    // Update form fields
    const unitIdInput = document.getElementById('unit_id');
    const unitCodeInput = document.getElementById('unit_code');
    const unitNameInput = document.getElementById('unit_name');
    const unitPriceInput = document.getElementById('unit_price');
    
    if (unitIdInput) unitIdInput.value = unitId;
    if (unitCodeInput) unitCodeInput.value = unitCode;
    if (unitNameInput) unitNameInput.value = unitName;
    if (unitPriceInput) unitPriceInput.value = unitPrice;
    
    // Hide search results
    const searchResults = document.getElementById('unit-results');
    if (searchResults) searchResults.classList.add('hidden');
    
    // Clear search input
    const searchInput = document.getElementById('unit-search');
    if (searchInput) searchInput.value = '';
}

/**
 * Update safe balance display
 */
function updateSafeBalance(safeId) {
    htmx.ajax('GET', `/htmx/safes/${safeId}/balance/`, {
        target: `#safe-${safeId}-balance`
    });
}

/**
 * Format currency
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-SA', {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 2
    }).format(amount);
}

/**
 * Format date
 */
function formatDate(date) {
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date(date));
}

/**
 * Confirm delete action
 */
function confirmDelete(message, callback) {
    if (confirm(message)) {
        callback();
    }
}

/**
 * Show loading spinner
 */
function showLoading(element) {
    element.innerHTML = `
        <div class="flex items-center justify-center p-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
            <span class="mr-2">جاري التحميل...</span>
        </div>
    `;
}

/**
 * Hide loading spinner
 */
function hideLoading(element, content) {
    element.innerHTML = content;
}

// Export functions for global use
window.selectCustomer = selectCustomer;
window.selectUnit = selectUnit;
window.updateSafeBalance = updateSafeBalance;
window.showNotification = showNotification;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.confirmDelete = confirmDelete;
window.showLoading = showLoading;
window.hideLoading = hideLoading;