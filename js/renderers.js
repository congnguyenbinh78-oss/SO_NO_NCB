const Renderers = {
    formatMoney(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    },

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN');
    },

    // --- Login Screen ---
    login() {
        return `
            <div class="login-screen">
                <div style="text-align: center; margin-bottom: 2rem;">
                    <div style="width: 80px; height: 80px; background: var(--accent-gold); border-radius: 50%; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #000;">
                        <i class="ri-wallet-3-line"></i>
                    </div>
                    <h1>Nợ HKD NGUYEN CONG BINH</h1>
                    <p class="text-muted">Nhập mã PIN để tiếp tục</p>
                </div>

                <div class="pin-display" id="pin-dots">
                    <div class="pin-dot"></div>
                    <div class="pin-dot"></div>
                    <div class="pin-dot"></div>
                    <div class="pin-dot"></div>
                </div>

                <div class="numpad">
                    ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="num-btn" data-key="${n}">${n}</button>`).join('')}
                    <button class="num-btn" style="opacity:0"></button>
                    <button class="num-btn" data-key="0">0</button>
                    <button class="num-btn text-danger" data-key="del"><i class="ri-delete-back-line"></i></button>
                </div>
            </div>
        `;
    },

    // --- Dashboard ---
    dashboard(summary, debts, searchQuery = '', typeFilter = 'all') {
        return `
            <div class="top-nav glass-card" style="margin: 1rem; border-radius: 12px;">
                <h2 style="margin:0; font-size: 1.1rem;">Tổng quan</h2>
                <div style="font-size: 0.9rem;">${new Date().toLocaleDateString('vi-VN')}</div>
            </div>

            <div class="summary-cards">
                <div class="card" style="background: linear-gradient(135deg, #10b981, #059669); color: white;" onclick="App.setFilter('receivable')">
                    <div class="text-xs" style="opacity: 0.9;">Phải Thu</div>
                    <div class="font-bold" style="font-size: 1.2rem; margin-top: 0.5rem;">
                        ${this.formatMoney(summary.receivables)}
                    </div>
                </div>
                <div class="card" style="background: linear-gradient(135deg, #ef4444, #dc2626); color: white;" onclick="App.setFilter('payable')">
                    <div class="text-xs" style="opacity: 0.9;">Phải Trả</div>
                    <div class="font-bold" style="font-size: 1.2rem; margin-top: 0.5rem;">
                        ${this.formatMoney(summary.payables)}
                    </div>
                </div>
            </div>

            <div style="padding: 0 1rem; margin-top: 1rem;">
                <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
                    <input type="text" placeholder="Tìm tên, nội dung..." value="${searchQuery}" 
                        oninput="App.handleSearch(this.value)" 
                        style="flex: 1; padding: 0.5rem; font-size: 0.9rem;">
                    
                    <select onchange="App.setFilter(this.value)" style="width: 100px; padding: 0.5rem; font-size: 0.9rem;">
                        <option value="all" ${typeFilter === 'all' ? 'selected' : ''}>Tất cả</option>
                        <option value="receivable" ${typeFilter === 'receivable' ? 'selected' : ''}>Phải thu</option>
                        <option value="payable" ${typeFilter === 'payable' ? 'selected' : ''}>Phải trả</option>
                    </select>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Danh sách nợ</h3>
                    <button class="text-gold text-sm" onclick="App.navigateTo('partners')">Danh bạ <i class="ri-arrow-right-s-line"></i></button>
                </div>
                
                <div class="debt-list">
                    ${debts.length === 0 ? '<div class="text-muted text-center" style="padding: 2rem;">Không có khoản nợ nào cần chú ý.</div>' : ''}
                    ${debts.map(debt => {
            const partner = AppState.getPartner(debt.partnerId);
            const isOverdue = new Date(debt.dueDate) < new Date();
            const remaining = debt.amount - debt.paid;

            return `
                        <div class="card debt-item" onclick="App.viewDebtDetail('${debt.id}')">
                            <div>
                                <div class="font-bold">${partner ? partner.name : 'Không xác định'}</div>
                                <div class="text-xs text-muted">${debt.content}</div>
                                <div class="text-xs ${isOverdue ? 'text-danger' : 'text-gold'}" style="margin-top: 4px;">
                                    <i class="ri-time-line"></i> ${this.formatDate(debt.dueDate)}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div class="font-bold ${debt.type === 'receivable' ? 'text-success' : 'text-danger'}">
                                    ${debt.type === 'receivable' ? '+' : '-'}${this.formatMoney(remaining)}
                                </div>
                                <div class="text-xs text-muted">Tổng: ${this.formatMoney(debt.amount)}</div>
                            </div>
                        </div>
                        `;
        }).join('')}
                </div>
            </div>

            <button class="fab" onclick="App.showAddDebtModal()">
                <i class="ri-add-line"></i>
            </button>
        `;
    },

    // --- Partner List ---
    partnerList(partners) {
        return `
            <div class="top-nav">
                <button class="btn-icon" onclick="App.navigateTo('dashboard')"><i class="ri-arrow-left-line"></i></button>
                <h2>Danh Bạ Đối Tác</h2>
                <button class="btn-icon" onclick="App.showAddPartnerModal()"><i class="ri-user-add-line"></i></button>
            </div>
            <div style="padding: 0 1rem; margin-bottom: 1rem;">
                <input type="text" placeholder="Tìm đối tác..." 
                    oninput="App.handlePartnerSearch(this.value)" 
                    style="padding: 0.6rem; font-size: 0.9rem;">
            </div>
            <div style="padding: 1rem;">
                ${partners.map(p => `
                    <div class="card" style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 40px; height: 40px; background: var(--secondary-bg); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">
                            ${p.name.charAt(0).toUpperCase()}
                        </div>
                        <div style="flex: 1;">
                            <div class="font-bold">${p.name}</div>
                            <div class="text-xs text-muted">${p.phone}</div>
                        </div>
                        <button class="btn-icon" style="width: 32px; height: 32px;" onclick="App.showEditPartnerModal('${p.id}')"><i class="ri-edit-line"></i></button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // --- Debt Detail ---
    debtDetail(debt, partner) {
        const remaining = debt.amount - debt.paid;
        const isReceivable = debt.type === 'receivable';

        // Message template
        const msgContent = `Kính gửi ${partner.name}, khoản nợ "${debt.content}" trị giá ${this.formatMoney(remaining)} đã đến hạn ${this.formatDate(debt.dueDate)}. Mong anh/chị thanh toán sớm.`;
        const smsLink = `sms:${partner.phone}?body=${encodeURIComponent(msgContent)}`;
        // Zalo often uses phone number search, no direct deep link for msg, but we can copy.

        return `
             <div class="top-nav">
                <button class="btn-icon" onclick="App.navigateTo('dashboard')"><i class="ri-arrow-left-line"></i></button>
                <h2>Chi Tiết</h2>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-icon" onclick="App.showEditDebtModal('${debt.id}')"><i class="ri-edit-line"></i></button>
                    <button class="btn-icon text-danger" onclick="App.deleteDebt('${debt.id}')"><i class="ri-delete-bin-line"></i></button>
                </div>
            </div>
            
            <div style="padding: 1rem;">
                <div class="card glass-card" style="text-align: center; padding: 2rem 1rem;">
                    <div class="text-muted text-sm">${isReceivable ? 'KHÁCH HÀNG NỢ BẠN' : 'BẠN NỢ KHÁCH HÀNG'}</div>
                    <div class="font-bold" style="font-size: 2rem; margin: 1rem 0; color: ${isReceivable ? 'var(--success)' : 'var(--danger)'}">
                        ${this.formatMoney(remaining)}
                    </div>
                    <div class="text-gold font-bold">${partner.name}</div>
                    <div class="text-sm text-muted">${partner.phone}</div>
                </div>

                <div class="card">
                    <h3>Thông tin</h3>
                    <div class="text-sm" style="display: grid; grid-template-columns: 100px 1fr; gap: 0.5rem;">
                        <span class="text-muted">Nội dung:</span> <span>${debt.content}</span>
                        <span class="text-muted">Ngày tạo:</span> <span>${this.formatDate(debt.createdAt)}</span>
                        <span class="text-muted">Hạn trả:</span> <span>${this.formatDate(debt.dueDate)}</span>
                        <span class="text-muted">Tổng gốc:</span> <span>${this.formatMoney(debt.amount)}</span>
                        <span class="text-muted">Đã trả:</span> <span>${this.formatMoney(debt.paid)}</span>
                    </div>
                </div>

                <div class="card">
                    <h3>Lịch sử thanh toán</h3>
                    ${debt.history.length === 0 ? '<div class="text-muted text-sm">Chưa có thanh toán nào.</div>' : ''}
                    <ul style="border-left: 2px solid var(--glass-border); padding-left: 1rem; margin-left: 0.5rem;">
                         ${debt.history.map(h => `
                            <li style="margin-bottom: 0.5rem; position: relative;">
                                <div style="position: absolute; left: -1.4rem; top: 4px; width: 10px; height: 10px; background: var(--accent-gold); border-radius: 50%;"></div>
                                <div class="text-sm font-bold">${this.formatMoney(h.amount)}</div>
                                <div class="text-xs text-muted">${new Date(h.date).toLocaleString('vi-VN')}</div>
                            </li>
                         `).join('')}
                    </ul>
                </div>
            </div>

            <div class="glass-card" style="position: fixed; bottom: 0; left: 0; right: 0; padding: 1rem; display: flex; gap: 1rem; max-width: 480px; margin: 0 auto; border-radius: 20px 20px 0 0;">
                <button class="btn btn-outline" style="flex: 1;" onclick="window.open('${smsLink}')"><i class="ri-message-2-line" style="margin-right: 8px;"></i> Nhắc Nợ</button>
                <button class="btn btn-primary" style="flex: 1;" onclick="App.showPaymentModal('${debt.id}')">Thanh Toán</button>
            </div>
        `;
    },

    // --- Modals ---
    addDebtModal(partners) {
        return `
            <div class="card glass-card" style="width: 100%; max-width: 400px; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Thêm Khoản Nợ Mới</h3>
                    <button class="btn-icon" style="width: 32px; height: 32px;" onclick="App.closeModal()"><i class="ri-close-line"></i></button>
                </div>
                
                <form onsubmit="App.handleDebtSubmit(event)">
                    <div class="input-group">
                        <label class="text-sm text-muted">Loại nợ</label>
                        <select name="type" required>
                            <option value="receivable">Phải Thu (Họ nợ mình)</option>
                            <option value="payable">Phải Trả (Mình nợ họ)</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <label class="text-sm text-muted">Đối tác</label>
                        <div style="display: flex; gap: 0.5rem;">
                            <select name="partnerId" style="flex: 1;" required>
                                <option value="">-- Chọn đối tác --</option>
                                ${partners.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                            </select>
                            <button type="button" class="btn-icon" onclick="App.showAddPartnerModal()"><i class="ri-add-line"></i></button>
                        </div>
                    </div>

                    <div class="input-group">
                        <label class="text-sm text-muted">Số tiền</label>
                        <input type="number" name="amount" placeholder="0" required min="1000">
                    </div>

                    <div class="input-group">
                        <label class="text-sm text-muted">Nội dung</label>
                        <input type="text" name="content" placeholder="Ví dụ: Tiền vật liệu" required>
                    </div>

                    <div class="input-group">
                        <label class="text-sm text-muted">Ngày đáo hạn</label>
                        <input type="date" name="dueDate" required value="${new Date().toISOString().split('T')[0]}">
                    </div>

                    <button type="submit" class="btn btn-primary">Lưu Khoản Nợ</button>
                </form>
            </div>
        `;
    },

    addPaymentModal(debtId) {
        return `
            <div class="card glass-card" style="width: 100%; max-width: 350px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Thêm Thanh Toán</h3>
                    <button class="btn-icon" style="width: 32px; height: 32px;" onclick="App.closeModal()"><i class="ri-close-line"></i></button>
                </div>
                
                <form onsubmit="App.handlePaymentSubmit(event, '${debtId}')">
                    <div class="input-group">
                        <label class="text-sm text-muted">Số tiền thanh toán</label>
                        <input type="number" name="amount" placeholder="0" required min="1000">
                    </div>
                    <button type="submit" class="btn btn-primary">Xác Nhận</button>
                </form>
            </div>
        `;
    },

    addPartnerModal() {
        return `
             <div class="card glass-card" style="width: 100%; max-width: 350px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Thêm Đối Tác</h3>
                    <button class="btn-icon" style="width: 32px; height: 32px;" onclick="App.closeModal()"><i class="ri-close-line"></i></button>
                </div>
                
                <form onsubmit="App.handlePartnerSubmit(event)">
                    <div class="input-group">
                        <label class="text-sm text-muted">Tên đối tác</label>
                        <input type="text" name="name" placeholder="Nguyễn Văn A" required>
                    </div>
                    <div class="input-group">
                        <label class="text-sm text-muted">Số điện thoại</label>
                        <input type="tel" name="phone" placeholder="0912..." required>
                    </div>
                    <button type="submit" class="btn btn-primary">Lưu Đối Tác</button>
                </form>
            </div>
        `;
    },

    editPartnerModal(partner) {
        return `
             <div class="card glass-card" style="width: 100%; max-width: 350px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Sửa Đối Tác</h3>
                    <button class="btn-icon" style="width: 32px; height: 32px;" onclick="App.closeModal()"><i class="ri-close-line"></i></button>
                </div>
                
                <form onsubmit="App.handleEditPartnerSubmit(event, '${partner.id}')">
                    <div class="input-group">
                        <label class="text-sm text-muted">Tên đối tác</label>
                        <input type="text" name="name" value="${partner.name}" required>
                    </div>
                    <div class="input-group">
                        <label class="text-sm text-muted">Số điện thoại</label>
                        <input type="tel" name="phone" value="${partner.phone}" required>
                    </div>
                    <button type="submit" class="btn btn-primary">Lưu Thay Đổi</button>
                </form>
            </div>
        `;
    },

    editDebtModal(debt, partners) {
        return `
            <div class="card glass-card" style="width: 100%; max-width: 400px; max-height: 90vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3>Sửa Khoản Nợ</h3>
                    <button class="btn-icon" style="width: 32px; height: 32px;" onclick="App.closeModal()"><i class="ri-close-line"></i></button>
                </div>
                
                <form onsubmit="App.handleEditDebtSubmit(event, '${debt.id}')">
                    <div class="input-group">
                        <label class="text-sm text-muted">Loại nợ</label>
                        <select name="type" required>
                            <option value="receivable" ${debt.type === 'receivable' ? 'selected' : ''}>Phải Thu (Họ nợ mình)</option>
                            <option value="payable" ${debt.type === 'payable' ? 'selected' : ''}>Phải Trả (Mình nợ họ)</option>
                        </select>
                    </div>

                    <div class="input-group">
                        <label class="text-sm text-muted">Đối tác</label>
                        <select name="partnerId" required>
                            ${partners.map(p => `<option value="${p.id}" ${p.id === debt.partnerId ? 'selected' : ''}>${p.name}</option>`).join('')}
                        </select>
                    </div>

                    <div class="input-group">
                        <label class="text-sm text-muted">Số tiền</label>
                        <input type="number" name="amount" value="${debt.amount}" required min="1000">
                    </div>

                    <div class="input-group">
                        <label class="text-sm text-muted">Nội dung</label>
                        <input type="text" name="content" value="${debt.content}" required>
                    </div>

                    <div class="input-group">
                        <label class="text-sm text-muted">Ngày đáo hạn</label>
                        <input type="date" name="dueDate" required value="${debt.dueDate}">
                    </div>

                    <button type="submit" class="btn btn-primary">Lưu Thay Đổi</button>
                </form>
            </div>
        `;
    }
};
