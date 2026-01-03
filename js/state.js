const STATE_KEY = 'HKD_NCB_APP_STATE';

const AppState = {
    data: {
        partners: [],
        debts: [],
        isAuthenticated: false
    },

    init() {
        const stored = localStorage.getItem(STATE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            this.data.partners = parsed.partners || [];
            this.data.debts = parsed.debts || [];
            // Keep auth false on reload for security simulation
        } else {
            // Load mock data for first run
            if (typeof MOCK_DATA !== 'undefined') {
                this.data.partners = MOCK_DATA.partners;
                this.data.debts = MOCK_DATA.debts;
                this.save();
            }
        }
    },

    save() {
        // Don't save isAuthenticated
        const toSave = {
            partners: this.data.partners,
            debts: this.data.debts
        };
        localStorage.setItem(STATE_KEY, JSON.stringify(toSave));
    },

    // --- Actions ---

    login(pin) {
        // Simple mock pin check. In real app, this should be more secure.
        // Assuming mock user pin is 1234 or from MOCK_DATA
        if (pin === '1234') {
            this.data.isAuthenticated = true;
            return true;
        }
        return false;
    },

    logout() {
        this.data.isAuthenticated = false;
        renderScreen('login');
    },

    addPartner(name, phone) {
        const newPartner = {
            id: 'p' + Date.now(),
            name,
            phone
        };
        this.data.partners.push(newPartner);
        this.save();
        return newPartner;
    },

    updatePartner(id, name, phone) {
        const partner = this.getPartner(id);
        if (partner) {
            partner.name = name;
            partner.phone = phone;
            this.save();
        }
    },

    getPartner(id) {
        return this.data.partners.find(p => p.id === id);
    },

    addDebt(partnerId, type, amount, content, dueDate) {
        const newDebt = {
            id: 'd' + Date.now(),
            partnerId,
            type, // 'receivable' | 'payable'
            amount: Number(amount),
            paid: 0,
            content,
            dueDate,
            createdAt: new Date().toISOString(),
            history: []
        };
        this.data.debts.push(newDebt);
        this.save();
        return newDebt;
    },

    updateDebt(id, partnerId, type, amount, content, dueDate) {
        const debt = this.data.debts.find(d => d.id === id);
        if (debt) {
            debt.partnerId = partnerId;
            debt.type = type;
            debt.amount = Number(amount);
            debt.content = content;
            debt.dueDate = dueDate;
            this.save();
        }
    },

    addPayment(debtId, amount) {
        const debt = this.data.debts.find(d => d.id === debtId);
        if (debt) {
            debt.paid += Number(amount);
            debt.history.push({
                date: new Date().toISOString(),
                amount: Number(amount)
            });
            this.save();
        }
    },

    deleteDebt(debtId) {
        this.data.debts = this.data.debts.filter(d => d.id !== debtId);
        this.save();
    },

    // --- Getters ---
    getSummary() {
        const receivables = this.data.debts
            .filter(d => d.type === 'receivable')
            .reduce((sum, d) => sum + (d.amount - d.paid), 0);

        const payables = this.data.debts
            .filter(d => d.type === 'payable')
            .reduce((sum, d) => sum + (d.amount - d.paid), 0);

        return { receivables, payables };
    },

    getRecentDebts() {
        // Sort by due date
        return [...this.data.debts].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    },

    searchDebts(query, typeFilter = 'all') {
        const lowerQuery = query.toLowerCase();
        return this.data.debts.filter(d => {
            const partner = this.getPartner(d.partnerId);
            const partnerName = partner ? partner.name.toLowerCase() : '';
            const content = d.content.toLowerCase();
            const matchesQuery = partnerName.includes(lowerQuery) || content.includes(lowerQuery);
            const matchesType = typeFilter === 'all' || d.type === typeFilter;
            return matchesQuery && matchesType;
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    },

    searchPartners(query) {
        const lowerQuery = query.toLowerCase();
        return this.data.partners.filter(p =>
            p.name.toLowerCase().includes(lowerQuery) ||
            p.phone.includes(query)
        );
    }
};
