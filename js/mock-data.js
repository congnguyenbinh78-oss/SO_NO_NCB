const MOCK_DATA = {
    partners: [
        { id: 'p1', name: 'Anh Bình (Xây dựng)', phone: '0912345678' },
        { id: 'p2', name: 'Chị Lan (Tạp hoá)', phone: '0987654321' },
        { id: 'p3', name: 'Công ty ABC', phone: '0909090909' }
    ],
    debts: [
        {
            id: 'd1',
            partnerId: 'p1',
            type: 'receivable', // Phải thu
            amount: 5000000,
            paid: 0,
            content: 'Tiền vật liệu tháng 11',
            dueDate: '2025-12-15', // Sắp đến hạn
            createdAt: '2025-11-20T10:00:00.000Z',
            history: []
        },
        {
            id: 'd2',
            partnerId: 'p2',
            type: 'payable', // Phải trả
            amount: 2000000,
            paid: 1000000,
            content: 'Nhập hàng bánh kẹo',
            dueDate: '2025-12-05', // Quá hạn
            createdAt: '2025-11-25T14:30:00.000Z',
            history: [
                { date: '2025-11-30', amount: 1000000 }
            ]
        }
    ],
    user: {
        pin: '1234',
        name: 'HKD NGUYEN CONG BINH'
    }
};
