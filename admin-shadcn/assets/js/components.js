/**
 * Reusable UI Components for Shadcn Admin
 * Modern JavaScript components with Shadcn design system
 */

// Toast notifications system
class Toast {
    constructor() {
        this.container = this.createContainer();
        this.toasts = new Map();
    }

    createContainer() {
        const existing = document.getElementById('toast-container');
        if (existing) return existing;

        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-4 right-4 z-50 space-y-2';
        container.style.cssText = `
            position: fixed;
            top: 1rem;
            right: 1rem;
            z-index: 50;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            max-width: 24rem;
        `;
        document.body.appendChild(container);
        return container;
    }

    show(message, type = 'default', duration = 5000) {
        const id = Date.now().toString();
        const toast = this.createToast(id, message, type);
        
        this.container.appendChild(toast);
        this.toasts.set(id, toast);

        // Animate in
        requestAnimationFrame(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.remove(id), duration);
        }

        return id;
    }

    createToast(id, message, type) {
        const toast = document.createElement('div');
        toast.className = `toast-shadcn ${type}`;
        toast.style.cssText = `
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: var(--radius);
            padding: 1rem;
            box-shadow: var(--shadow-lg);
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease-out;
            position: relative;
            min-height: 3rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        `;

        const iconMap = {
            success: 'check-circle',
            error: 'x-circle',
            warning: 'alert-triangle',
            info: 'info',
            default: 'bell'
        };

        const colorMap = {
            success: 'hsl(142 76% 36%)',
            error: 'hsl(var(--destructive))',
            warning: 'hsl(48 96% 53%)',
            info: 'hsl(200 95% 50%)',
            default: 'hsl(var(--primary))'
        };

        toast.innerHTML = `
            <div style="color: ${colorMap[type]}; flex-shrink: 0;">
                <i data-lucide="${iconMap[type]}" style="width: 1.25rem; height: 1.25rem;"></i>
            </div>
            <div style="flex: 1; font-size: 0.875rem; color: hsl(var(--foreground));">
                ${message}
            </div>
            <button class="toast-close" style="
                background: none;
                border: none;
                color: hsl(var(--muted-foreground));
                cursor: pointer;
                padding: 0.25rem;
                border-radius: calc(var(--radius) / 2);
                flex-shrink: 0;
            ">
                <i data-lucide="x" style="width: 1rem; height: 1rem;"></i>
            </button>
        `;

        // Close button functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.remove(id));

        // Initialize icons
        lucide.createIcons(toast);

        return toast;
    }

    remove(id) {
        const toast = this.toasts.get(id);
        if (!toast) return;

        toast.style.transform = 'translateX(100%)';
        toast.style.opacity = '0';

        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            this.toasts.delete(id);
        }, 300);
    }

    success(message, duration = 5000) {
        return this.show(message, 'success', duration);
    }

    error(message, duration = 7000) {
        return this.show(message, 'error', duration);
    }

    warning(message, duration = 6000) {
        return this.show(message, 'warning', duration);
    }

    info(message, duration = 5000) {
        return this.show(message, 'info', duration);
    }
}

// Modal component
class Modal {
    constructor(options = {}) {
        this.options = {
            backdrop: true,
            keyboard: true,
            ...options
        };
        this.isOpen = false;
        this.element = null;
        this.backdrop = null;
    }

    create(title, content, footer = null) {
        // Remove existing modal
        this.destroy();

        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop-shadcn';
        this.backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            opacity: 0;
            transition: opacity 0.3s ease-out;
        `;

        // Create modal
        this.element = document.createElement('div');
        this.element.className = 'modal-shadcn';
        this.element.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.9);
            z-index: 1000;
            background: hsl(var(--card));
            border: 1px solid hsl(var(--border));
            border-radius: var(--radius);
            box-shadow: var(--shadow-xl);
            width: 90%;
            max-width: 32rem;
            max-height: 90vh;
            overflow-y: auto;
            opacity: 0;
            transition: all 0.3s ease-out;
        `;

        this.element.innerHTML = `
            <div style="padding: 1.5rem; border-bottom: 1px solid hsl(var(--border));">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <h3 style="font-size: 1.25rem; font-weight: 600; margin: 0; color: hsl(var(--foreground));">
                        ${title}
                    </h3>
                    <button class="modal-close" style="
                        background: none;
                        border: none;
                        color: hsl(var(--muted-foreground));
                        cursor: pointer;
                        padding: 0.25rem;
                        border-radius: calc(var(--radius) / 2);
                    ">
                        <i data-lucide="x" style="width: 1.25rem; height: 1.25rem;"></i>
                    </button>
                </div>
            </div>
            <div style="padding: 1.5rem;">
                ${content}
            </div>
            ${footer ? `<div style="padding: 1rem 1.5rem; border-top: 1px solid hsl(var(--border)); background: hsl(var(--muted) / 0.3);">${footer}</div>` : ''}
        `;

        // Event listeners
        const closeBtn = this.element.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => this.close());

        if (this.options.backdrop) {
            this.backdrop.addEventListener('click', () => this.close());
        }

        if (this.options.keyboard) {
            document.addEventListener('keydown', this.handleKeydown.bind(this));
        }

        return this;
    }

    show() {
        if (this.isOpen) return this;

        document.body.appendChild(this.backdrop);
        document.body.appendChild(this.element);
        document.body.style.overflow = 'hidden';

        // Initialize icons
        lucide.createIcons(this.element);

        requestAnimationFrame(() => {
            this.backdrop.style.opacity = '1';
            this.element.style.opacity = '1';
            this.element.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        this.isOpen = true;
        return this;
    }

    close() {
        if (!this.isOpen) return this;

        this.backdrop.style.opacity = '0';
        this.element.style.opacity = '0';
        this.element.style.transform = 'translate(-50%, -50%) scale(0.9)';

        setTimeout(() => {
            this.destroy();
        }, 300);

        this.isOpen = false;
        return this;
    }

    destroy() {
        if (this.backdrop?.parentNode) {
            this.backdrop.parentNode.removeChild(this.backdrop);
        }
        if (this.element?.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        document.body.style.overflow = '';
        document.removeEventListener('keydown', this.handleKeydown.bind(this));
        this.backdrop = null;
        this.element = null;
        this.isOpen = false;
    }

    handleKeydown(e) {
        if (e.key === 'Escape') {
            this.close();
        }
    }
}

// Loading spinner component
class LoadingSpinner {
    constructor(target, options = {}) {
        this.target = typeof target === 'string' ? document.querySelector(target) : target;
        this.options = {
            size: '2rem',
            message: 'กำลังโหลด...',
            overlay: true,
            ...options
        };
        this.element = null;
    }

    show() {
        if (this.element) return this;

        this.element = document.createElement('div');
        this.element.className = 'loading-spinner-shadcn';
        
        const overlayStyle = this.options.overlay ? `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(2px);
        ` : '';

        this.element.style.cssText = `
            ${overlayStyle}
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 1rem;
            z-index: 10;
        `;

        this.element.innerHTML = `
            <div style="
                width: ${this.options.size};
                height: ${this.options.size};
                border: 2px solid hsl(var(--muted));
                border-radius: 50%;
                border-top-color: hsl(var(--primary));
                animation: spin 1s linear infinite;
            "></div>
            ${this.options.message ? `<p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin: 0;">${this.options.message}</p>` : ''}
        `;

        // Add spin animation if not exists
        if (!document.querySelector('#spin-animation')) {
            const style = document.createElement('style');
            style.id = 'spin-animation';
            style.textContent = `
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        if (this.options.overlay && this.target) {
            this.target.style.position = 'relative';
        }

        (this.target || document.body).appendChild(this.element);
        return this;
    }

    hide() {
        if (this.element?.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
        }
        return this;
    }
}

// Confirm dialog
class ConfirmDialog {
    static async show(options = {}) {
        const config = {
            title: 'ยืนยันการดำเนินการ',
            message: 'คุณแน่ใจหรือไม่?',
            confirmText: 'ยืนยัน',
            cancelText: 'ยกเลิก',
            type: 'default', // default, danger
            ...options
        };

        return new Promise((resolve) => {
            const modal = new Modal();
            
            const footer = `
                <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
                    <button class="btn-shadcn ghost cancel-btn">${config.cancelText}</button>
                    <button class="btn-shadcn ${config.type === 'danger' ? 'destructive' : 'default'} confirm-btn">${config.confirmText}</button>
                </div>
            `;

            modal.create(config.title, `<p style="margin: 0; color: hsl(var(--foreground));">${config.message}</p>`, footer);
            
            const cancelBtn = modal.element.querySelector('.cancel-btn');
            const confirmBtn = modal.element.querySelector('.confirm-btn');

            cancelBtn.addEventListener('click', () => {
                modal.close();
                resolve(false);
            });

            confirmBtn.addEventListener('click', () => {
                modal.close();
                resolve(true);
            });

            modal.show();
        });
    }
}

// Data table component
class DataTable {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.options = {
            columns: [],
            data: [],
            pagination: true,
            pageSize: 10,
            sortable: true,
            searchable: true,
            ...options
        };
        this.currentPage = 1;
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.render();
    }

    render() {
        if (!this.container) return;

        const filteredData = this.getFilteredData();
        const paginatedData = this.getPaginatedData(filteredData);

        this.container.innerHTML = `
            ${this.options.searchable ? this.renderSearchBar() : ''}
            ${this.renderTable(paginatedData)}
            ${this.options.pagination ? this.renderPagination(filteredData.length) : ''}
        `;

        this.attachEventListeners();
    }

    renderSearchBar() {
        return `
            <div style="margin-bottom: 1rem;">
                <div class="input-wrapper" style="max-width: 20rem;">
                    <i data-lucide="search" style="
                        position: absolute;
                        left: 0.75rem;
                        top: 50%;
                        transform: translateY(-50%);
                        width: 1rem;
                        height: 1rem;
                        color: hsl(var(--muted-foreground));
                        pointer-events: none;
                    "></i>
                    <input
                        type="text"
                        class="input-shadcn search-input"
                        placeholder="ค้นหา..."
                        style="padding-left: 2.5rem;"
                        value="${this.searchTerm}"
                    >
                </div>
            </div>
        `;
    }

    renderTable(data) {
        return `
            <div style="overflow-x: auto; border-radius: var(--radius); border: 1px solid hsl(var(--border));">
                <table class="table-shadcn">
                    <thead>
                        <tr>
                            ${this.options.columns.map(col => `
                                <th ${this.options.sortable && col.sortable !== false ? `class="sortable-header" data-column="${col.key}"` : ''}>
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        ${col.title}
                                        ${this.options.sortable && col.sortable !== false ? `
                                            <i data-lucide="chevrons-up-down" style="width: 0.75rem; height: 0.75rem; opacity: 0.5;"></i>
                                        ` : ''}
                                    </div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.length === 0 ? `
                            <tr>
                                <td colspan="${this.options.columns.length}" style="text-align: center; padding: 3rem; color: hsl(var(--muted-foreground));">
                                    ไม่พบข้อมูล
                                </td>
                            </tr>
                        ` : data.map(row => `
                            <tr>
                                ${this.options.columns.map(col => `
                                    <td>${this.renderCell(row, col)}</td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    renderCell(row, column) {
        if (column.render) {
            return column.render(row[column.key], row);
        }
        return row[column.key] || '-';
    }

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.options.pageSize);
        if (totalPages <= 1) return '';

        const startItem = (this.currentPage - 1) * this.options.pageSize + 1;
        const endItem = Math.min(this.currentPage * this.options.pageSize, totalItems);

        return `
            <div style="display: flex; align-items: center; justify-content: between; margin-top: 1rem; padding: 1rem; border-top: 1px solid hsl(var(--border));">
                <p style="font-size: 0.875rem; color: hsl(var(--muted-foreground)); margin: 0;">
                    แสดง ${startItem}-${endItem} จาก ${totalItems} รายการ
                </p>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-shadcn outline sm prev-btn" ${this.currentPage === 1 ? 'disabled' : ''}>
                        <i data-lucide="chevron-left" style="width: 1rem; height: 1rem;"></i>
                        ก่อนหน้า
                    </button>
                    <button class="btn-shadcn outline sm next-btn" ${this.currentPage === totalPages ? 'disabled' : ''}>
                        ถัดไป
                        <i data-lucide="chevron-right" style="width: 1rem; height: 1rem;"></i>
                    </button>
                </div>
            </div>
        `;
    }

    attachEventListeners() {
        // Search
        const searchInput = this.container.querySelector('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchTerm = e.target.value;
                this.currentPage = 1;
                this.render();
            });
        }

        // Sorting
        const sortableHeaders = this.container.querySelectorAll('.sortable-header');
        sortableHeaders.forEach(header => {
            header.style.cursor = 'pointer';
            header.addEventListener('click', () => {
                const column = header.dataset.column;
                if (this.sortColumn === column) {
                    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortColumn = column;
                    this.sortDirection = 'asc';
                }
                this.render();
            });
        });

        // Pagination
        const prevBtn = this.container.querySelector('.prev-btn');
        const nextBtn = this.container.querySelector('.next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.render();
                }
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.getFilteredData().length / this.options.pageSize);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.render();
                }
            });
        }

        // Re-initialize icons
        lucide.createIcons(this.container);
    }

    getFilteredData() {
        let data = [...this.options.data];

        // Apply search filter
        if (this.searchTerm) {
            data = data.filter(row => {
                return this.options.columns.some(col => {
                    const value = row[col.key];
                    return value && value.toString().toLowerCase().includes(this.searchTerm.toLowerCase());
                });
            });
        }

        // Apply sorting
        if (this.sortColumn) {
            data.sort((a, b) => {
                let aVal = a[this.sortColumn];
                let bVal = b[this.sortColumn];

                if (typeof aVal === 'string') aVal = aVal.toLowerCase();
                if (typeof bVal === 'string') bVal = bVal.toLowerCase();

                if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return data;
    }

    getPaginatedData(data) {
        if (!this.options.pagination) return data;

        const startIndex = (this.currentPage - 1) * this.options.pageSize;
        const endIndex = startIndex + this.options.pageSize;
        return data.slice(startIndex, endIndex);
    }

    updateData(newData) {
        this.options.data = newData;
        this.currentPage = 1;
        this.render();
    }

    refresh() {
        this.render();
    }
}

// Initialize global components
const toast = new Toast();

// Export components for global use
window.components = {
    Toast,
    Modal,
    LoadingSpinner,
    ConfirmDialog,
    DataTable
};

// Global utility functions
window.showToast = (message, type, duration) => toast.show(message, type, duration);
window.showModal = (title, content, footer) => new Modal().create(title, content, footer).show();
window.showConfirm = (options) => ConfirmDialog.show(options);
window.showLoading = (target, options) => new LoadingSpinner(target, options).show();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Toast,
        Modal,
        LoadingSpinner,
        ConfirmDialog,
        DataTable
    };
}