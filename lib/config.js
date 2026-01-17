export const CONFIG = {
    product: {
        code: 'TSXHL',
        price: 20000,
        name: 'Tuyết Sơn Xiên Hỏa Long'
    },
    promo: {
        minQuantityForTicket: 3,
        ticketsPerPromo: 1
    },
    bankInfo: {
        bankCode: 'MB', // MB Bank
        accountNumber: '00140500000',
        accountHolder: 'LE VAN NGHIA',
        bankName: 'MB Bank'
    },
    sepay: {
        apiUrl: 'https://my.sepay.vn/userapi/transactions/list',
        qrUrl: 'https://qr.sepay.vn/img',
        apiKey: process.env.SEPAY_API_KEY
    },
    admin: {
        password: process.env.ADMIN_PASSWORD || 'admin'
    }
};
