const App = {
    currentScreen: 'login',
    containers: [
        'login-container',
        'dashboard-container',
        'partner-container',
        'debt-form-container',
        'debt-detail-container'
    ],
    // State for UI only
    pinBuffer: '',
    searchQuery: '',
    filterType: 'all', // 'all', 'receivable', 'payable'
    partnerSearchQuery: '',

    init() {
        AppState.init();

        // Initial route check
        if (AppState.data.isAuthenticated) {
            this.navigateTo('dashboard');
        } else {
            this.navigateTo('login');
        }

        // Setup Login Numpad Delegated Event
        const container = document.getElementById('login-container');

        container.addEventListener('click', (e) => {
            const btn = e.target.closest('.num-btn');
            if (btn) {
                const key = btn.dataset.key;
                // Add visual active state manually for better feel
                btn.classList.add('active');
                setTimeout(() => btn.classList.remove('active'), 150);

                this.handlePinInput(key);
            }
        });
    },

    navigateTo(screen, data = null) {
        this.currentScreen = screen;

        // Reset search on navigation (optional, helps keep clean state)
        if (screen === 'dashboard') {
            // keep state
        } else if (screen === 'partners') {
            this.partnerSearchQuery = '';
        }

        // Hide all
        this.containers.forEach(id => {
            document.getElementById(id).classList.add('hidden');
            document.getElementById(id).classList.remove('visible');
        });

        // Show Current
        const container = document.getElementById(`${screen}-container`);
        if (container) {
            container.classList.remove('hidden');
            container.classList.add('visible');
            this.renderScreen(screen, data);
        }
    },

    renderScreen(screen, data) {
        const container = document.getElementById(`${screen}-container`);

        switch (screen) {
            case 'login':
                container.innerHTML = Renderers.login();
                this.updatePinDisplay();
                break;
            case 'dashboard':
                container.innerHTML = Renderers.dashboard(
                    AppState.getSummary(),
                    AppState.searchDebts(this.searchQuery, this.filterType),
                    this.searchQuery,
                    this.filterType
                );
                break;
            case 'partners':
                container.innerHTML = Renderers.partnerList(
                    AppState.searchPartners(this.partnerSearchQuery)
                );
                // Restore focus if searching (simple hack: querySelector input and focus/set selection)
                if (this.partnerSearchQuery) {
                    const input = container.querySelector('input');
                    if (input) {
                        input.value = this.partnerSearchQuery;
                        input.focus();
                    }
                }
                break;
            case 'debt-detail':
                if (data) { // data is debtId
                    const debt = AppState.data.debts.find(d => d.id === data);
                    const partner = AppState.getPartner(debt.partnerId);
                    container.innerHTML = Renderers.debtDetail(debt, partner);
                }
                break;
        }
    },

    // --- Actions ---

    // --- Actions ---

    handleSearch(query) {
        this.searchQuery = query;
        this.renderScreen('dashboard');
        // Restore focus
        const input = document.querySelector('#dashboard-container input');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    },

    setFilter(type) {
        this.filterType = type;
        this.renderScreen('dashboard');
    },

    handlePartnerSearch(query) {
        this.partnerSearchQuery = query;
        this.renderScreen('partners');
        // Focus handling is done in renderScreen for partners
        const input = document.querySelector('#partner-container input');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    },

    handlePinInput(key) {
        if (!key) return;

        if (key === 'del') {
            this.pinBuffer = this.pinBuffer.slice(0, -1);
        } else if (this.pinBuffer.length < 4) {
            this.pinBuffer += key;
        }

        this.updatePinDisplay();

        if (this.pinBuffer.length === 4) {
            // Check PIN
            setTimeout(() => {
                if (AppState.login(this.pinBuffer)) {
                    this.pinBuffer = '';
                    this.navigateTo('dashboard');
                } else {
                    alert('Mã PIN sai! Vui lòng thử lại.');
                    this.pinBuffer = '';
                    this.updatePinDisplay();
                }
            }, 300);
        }
    },

    updatePinDisplay() {
        const dots = document.querySelectorAll('.pin-dot');
        dots.forEach((dot, index) => {
            if (index < this.pinBuffer.length) {
                dot.classList.add('filled');
            } else {
                dot.classList.remove('filled');
            }
        });
    },

    // --- Modals ---
    showAddDebtModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = Renderers.addDebtModal(AppState.data.partners);
        modalContainer.classList.remove('hidden');
    },

    showAddPartnerModal() {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = Renderers.addPartnerModal();
        modalContainer.classList.remove('hidden');
    },

    showPaymentModal(debtId) {
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = Renderers.addPaymentModal(debtId);
        modalContainer.classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
    },

    // --- Form Handlers ---

    handlePartnerSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        AppState.addPartner(formData.get('name'), formData.get('phone'));
        this.closeModal();

        // Refresh view if on partner list
        if (this.currentScreen === 'partners') {
            this.renderScreen('partners');
        } else {
            // Maybe we were in add debt modal, need to refresh that?
            // For simplicity, just alert or navigate
            alert('Đã thêm đối tác!');
            // If called from Add Debt modal nested? Too complex for now.
            // Assumption: Add Partner is top level or simple modal stack. 
            // Since we replaced innerHTML of modal container, we lost previous modal.
            // So just stay on current screen or go to partners.
        }
    },

    handleDebtSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        AppState.addDebt(
            formData.get('partnerId'),
            formData.get('type'),
            formData.get('amount'),
            formData.get('content'),
            formData.get('dueDate')
        );
        this.closeModal();
        this.navigateTo('dashboard');
    },

    handlePaymentSubmit(event, debtId) {
        event.preventDefault();
        const formData = new FormData(event.target);
        AppState.addPayment(debtId, formData.get('amount'));
        this.closeModal();
        // Refresh detail view
        this.renderScreen('debt-detail', debtId);
    },

    viewDebtDetail(id) {
        this.navigateTo('debt-detail', id);
    },

    deleteDebt(id) {
        if (confirm('Bạn có chắc muốn xóa khoản nợ này?')) {
            AppState.deleteDebt(id);
            this.navigateTo('dashboard');
        }
    },

    // --- Edit Handlers ---
    showEditPartnerModal(id) {
        const partner = AppState.getPartner(id);
        if (!partner) return;
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = Renderers.editPartnerModal(partner);
        modalContainer.classList.remove('hidden');
    },

    handleEditPartnerSubmit(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        AppState.updatePartner(id, formData.get('name'), formData.get('phone'));
        this.closeModal();

        // Refresh
        if (this.currentScreen === 'partners') {
            this.renderScreen('partners');
        } else {
            // If we edited partner from debt detail? 
            // Currently not possible from debt detail UI, but good to be safe
            this.renderScreen(this.currentScreen);
        }
    },

    showEditDebtModal(id) {
        const debt = AppState.data.debts.find(d => d.id === id);
        if (!debt) return;
        const modalContainer = document.getElementById('modal-container');
        modalContainer.innerHTML = Renderers.editDebtModal(debt, AppState.data.partners);
        modalContainer.classList.remove('hidden');
    },

    handleEditDebtSubmit(event, id) {
        event.preventDefault();
        const formData = new FormData(event.target);
        AppState.updateDebt(
            id,
            formData.get('partnerId'),
            formData.get('type'),
            formData.get('amount'),
            formData.get('content'),
            formData.get('dueDate')
        );
        this.closeModal();
        this.navigateTo('debt-detail', id);
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => App.init());
