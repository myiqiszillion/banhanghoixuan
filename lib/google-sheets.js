import { google } from 'googleapis';
import path from 'path';

// Path to service account key file
const KEY_FILE_PATH = path.join(process.cwd(), 'service_account.json');

// Scopes needed
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Strategy: use Env Var (Production) -> Service Account File (Local)
let authOptions = {};

// 1. Try Environment Variable (best for Vercel)
if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    try {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        authOptions = {
            credentials,
            scopes: SCOPES,
        };
    } catch (e) {
        console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON", e);
    }
}
// 2. Fallback to local file (dev mode)
else {
    // Only set keyFile if we are sure it exists or we want to try it. 
    // BUT google-auth throws if file not found.
    // If we are in production (NODE_ENV=production) and no env var, this typically fails.
    // We will set it, but we might want to wrap the instantiation.
    authOptions = {
        keyFile: KEY_FILE_PATH,
        scopes: SCOPES,
    };
}

// Lazy initialization or safe initialization
let auth;
try {
    auth = new google.auth.GoogleAuth(authOptions);
} catch (error) {
    console.error("Google Auth Init Failed:", error.message);
    // Do not crash app, but subsequent calls will fail
}

export const googleSheets = {
    async appendOrdersToSheet(spreadsheetId, orders) {
        try {
            const client = await auth.getClient();
            const sheets = google.sheets({ version: 'v4', auth: client });

            // 1. Get the name of the first sheet dynamically
            const meta = await sheets.spreadsheets.get({ spreadsheetId });
            const firstSheetTitle = meta.data.sheets[0].properties.title;
            const rangeName = `'${firstSheetTitle}'`;

            // 2. Read existing data to check for duplicates (Deduplication)
            let existingOrderCodes = new Set();
            let needsHeaders = false;

            try {
                const readRes = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: `${rangeName}!A:G`, // Read columns A to G
                });

                const rows = readRes.data.values;
                if (!rows || rows.length === 0) {
                    needsHeaders = true;
                } else {
                    // Assume Column A is 'Mã đơn hàng' (Order Code)
                    // Skip header row (index 0)
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        if (row[0]) existingOrderCodes.add(row[0].toString().trim());
                    }
                }
            } catch (e) {
                console.warn('Error reading sheet for deduplication:', e.message);
                needsHeaders = true;
            }

            // 3. Filter orders that are already in the sheet
            const newOrders = orders.filter(o => !existingOrderCodes.has(o.orderCode));

            if (newOrders.length === 0) {
                return { success: true, message: 'All orders already synced.' };
            }

            // 4. Prepare data rows for NEW orders only
            const newRows = newOrders.map(o => {
                // Format quantity: "5 (+1 tặng)"
                let quantityStr = `${o.quantity}`;
                if (o.freePortions > 0) {
                    quantityStr += ` (+${o.freePortions} tặng)`;
                }

                return [
                    o.orderCode, // Column A: unique ID
                    o.name,
                    `'${o.phone}`,
                    o.class,
                    quantityStr,
                    o.delivered ? 'Đã giao' : 'Chưa giao',
                    new Date(o.timestamp).toLocaleString('vi-VN')
                ];
            });

            // 5. Add headers if needed (for fresh sheet)
            if (needsHeaders) {
                newRows.unshift(['Mã đơn hàng', 'Tên', 'SĐT', 'Lớp', 'Số phần', 'Trạng thái giao', 'Thời gian']);
            }

            // 6. Append new rows
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${rangeName}!A1`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: newRows
                },
            });

            return { success: true, data: response.data, syncedCount: newOrders.length };

        } catch (error) {
            console.error('Google Sheets Sync Error:', error);
            return { success: false, error: error.message };
        }
    }
};
