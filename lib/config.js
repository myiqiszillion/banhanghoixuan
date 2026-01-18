export const CONFIG = {
    product: {
        code: 'TSXHL',
        price: 20000,
        name: 'Tuyết Sơn Xiên Hỏa Long'
    },
    promo: {
        minQuantityForTicket: 3,
        ticketsPerPromo: 1,
        buyXGet1Free: 10
    },
    miniGame: {
        prize: 5555555,
        prizeFormatted: '5.555.555đ'
    },
    googleSheets: {
        spreadsheetId: '1PIP7rtucLNpwTNxkLZVXPPno8_bKpzXaU7Vik5PZbdk' // From admin page
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
