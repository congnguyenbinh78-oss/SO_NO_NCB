const App = {
    currentScreen: 'login',
    containers: [
        'login-container',
        'dashboard-container',
        'partner-container',
        'debt-form-container',
        'debt-detail-container',
        'settings-container'
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
            case 'settings':
                container.innerHTML = Renderers.settings();
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

    // --- Settings & Excel ---

    async exportToExcel(forceDownload = false) {
        try {
            // Debug: Check Security
            if (!window.isSecureContext) {
                alert('Cảnh báo: Trang web không bảo mật (không phải HTTPS). Tính năng chọn tệp/chia sẻ sẽ không hoạt động.');
            }

            const wb = XLSX.utils.book_new();

            // Format Partners
            const partnerData = AppState.data.partners.map(p => ({
                "Mã ĐT": p.id,
                "Họ Tên": p.name,
                "Điện Thoại": p.phone
            }));
            const wsPartners = XLSX.utils.json_to_sheet(partnerData);
            XLSX.utils.book_append_sheet(wb, wsPartners, "DoiTac");

            // Format Debts
            const debtData = AppState.data.debts.map(d => ({
                "Mã Nợ": d.id,
                "Mã ĐT": d.partnerId,
                "Loại": d.type === 'receivable' ? 'Phải thu' : 'Phải trả',
                "Số Tiền": d.amount,
                "Nội Dung": d.content,
                "Hạn Trả": d.dueDate,
                "Ngày Tạo": d.createdAt
            }));
            const wsDebts = XLSX.utils.json_to_sheet(debtData);
            XLSX.utils.book_append_sheet(wb, wsDebts, "SoNo");

            // Generate Filename
            const fileName = `SoNo_NCB_${new Date().toISOString().slice(0, 10)}.xlsx`;

            // Prepare Blob
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Strategy 1: Desktop "Save As"
            if (!forceDownload && window.showSaveFilePicker) {
                try {
                    // alert('Đang thử mở hộp thoại lưu...'); 
                    const handle = await window.showSaveFilePicker({
                        suggestedName: fileName,
                        types: [{
                            description: 'Excel File',
                            accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
                        }],
                    });
                    const writable = await handle.createWritable();
                    await writable.write(blob);
                    await writable.close();
                    alert('Đã lưu file thành công!');
                    return;
                } catch (err) {
                    if (err.name === 'AbortError') return;
                    alert('Lỗi khi mở hộp thoại lưu: ' + err.message);
                }
            } else {
                // alert('Trình duyệt này không hỗ trợ chọn nơi lưu (Save As). Sẽ tải xuống tự động.');
            }

            // Strategy 2: Mobile Share
            const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            // Remove canShare check for debugging, just try share if navigator.share exists
            if (!forceDownload && navigator.share) {
                try {
                    if (navigator.canShare && !navigator.canShare({ files: [file] })) {
                        // alert('Thiết bị không hỗ trợ chia sẻ file này. Đang chuyển sang tải xuống...');
                        throw new Error('File sharing not supported');
                    }

                    await navigator.share({
                        files: [file],
                        title: 'Sao lưu Sổ Nợ',
                        text: 'File sao lưu dữ liệu Sổ Nợ NCB',
                    });
                    return;
                } catch (error) {
                    if (error.name === 'AbortError') return;
                    // alert('Lỗi chia sẻ: ' + error.message + '. Đang tải xuống...');
                    alert('Lỗi chia sẻ: ' + error.message + '. Đang chuyển sang tải xuống...');
                    console.log('Share failed', error);
                }
            }

            // Strategy 3: Client Side Download
            XLSX.writeFile(wb, fileName);
            alert('Đã tải xuống: ' + fileName + '\n(Kiểm tra thư mục Download)');

        } catch (error) {
            alert('Lỗi NGHIÊM TRỌNG: ' + error.message);
            console.error(error);
        }
    },

    handleImportExcel(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!confirm('CẢNH BÁO: Việc nhập file sẽ GHI ĐÈ toàn bộ dữ liệu hiện tại. Bạn có chắc chắn không?')) {
            event.target.value = ''; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Read Partners
                const wsPartners = workbook.Sheets["DoiTac"];
                if (wsPartners) {
                    const partners = XLSX.utils.sheet_to_json(wsPartners);
                    AppState.data.partners = partners.map(p => ({
                        id: p["Mã ĐT"] || ('p' + Date.now()),
                        name: p["Họ Tên"],
                        phone: p["Điện Thoại"]
                    }));
                }

                // Read Debts
                const wsDebts = workbook.Sheets["SoNo"];
                if (wsDebts) {
                    const debts = XLSX.utils.sheet_to_json(wsDebts);
                    AppState.data.debts = debts.map(d => ({
                        id: d["Mã Nợ"] || ('d' + Date.now()),
                        partnerId: d["Mã ĐT"],
                        type: d["Loại"] === 'Phải thu' ? 'receivable' : 'payable',
                        amount: d["Số Tiền"],
                        paid: 0, // Reset paid for simplicity or could export history too
                        content: d["Nội Dung"],
                        dueDate: d["Hạn Trả"],
                        createdAt: d["Ngày Tạo"] || new Date().toISOString(),
                        history: []
                    }));
                }

                AppState.save();
                alert('Đã khôi phục dữ liệu thành công!');
                this.navigateTo('dashboard');

            } catch (error) {
                alert('Lỗi đọc file: ' + error.message);
            }
        };
        reader.readAsArrayBuffer(file);
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
