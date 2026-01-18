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

            // 2. Read existing data (Columns A and F mainly)
            let existingMap = new Map(); // OrderCode -> { rowIndex, status }
            let needsHeaders = false;

            try {
                const readRes = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: `${rangeName}!A:F`, // Read up to Status column
                });

                const rows = readRes.data.values;
                if (!rows || rows.length === 0) {
                    needsHeaders = true;
                } else {
                    // Skip header row (index 0)
                    for (let i = 1; i < rows.length; i++) {
                        const row = rows[i];
                        const code = row[0]?.toString().trim();
                        if (code) {
                            existingMap.set(code, {
                                rowIndex: i, // 0-based index in 'values', but 1-based in Sheet is i+1
                                status: row[5] // Column F is Status
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn('Error reading sheet for deduplication:', e.message);
                needsHeaders = true;
            }

            const ordersToAppend = [];
            const dataToUpdate = []; // List of { range, values }

            // 3. Classify orders (Append vs Update)
            for (const o of orders) {
                const newStatus = o.delivered ? 'Đã giao' : 'Chưa giao';

                // Format quantity: "5 (+1 tặng)"
                let quantityStr = `${o.quantity}`;
                if (o.freePortions > 0) {
                    quantityStr += ` (+${o.freePortions} tặng)`;
                }

                const rowData = [
                    o.orderCode,
                    o.name,
                    `'${o.phone}`,
                    o.class,
                    quantityStr,
                    newStatus,
                    new Date(o.timestamp).toLocaleString('vi-VN')
                ];

                if (existingMap.has(o.orderCode)) {
                    // Check if status changed
                    const current = existingMap.get(o.orderCode);
                    if (current.status !== newStatus) {
                        // Needs update. We update the specific range for this row.
                        // Row index i corresponds to Sheet Row i+1.
                        // We update columns A:G just to be safe (or just F). 
                        // Let's update entire row to ensure consistency.
                        dataToUpdate.push({
                            range: `${rangeName}!A${current.rowIndex + 1}:G${current.rowIndex + 1}`,
                            values: [rowData]
                        });
                    }
                } else {
                    ordersToAppend.push(rowData);
                }
            }

            const messages = [];

            // 4. Perform Updates (Batch)
            if (dataToUpdate.length > 0) {
                await sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId,
                    resource: {
                        data: dataToUpdate,
                        valueInputOption: 'USER_ENTERED'
                    }
                });
                messages.push(`Updated ${dataToUpdate.length} rows`);
            }

            // 5. Perform Appends
            if (ordersToAppend.length > 0) {
                if (needsHeaders) {
                    ordersToAppend.unshift(['Mã đơn hàng', 'Tên', 'SĐT', 'Lớp', 'Số phần', 'Trạng thái giao', 'Thời gian']);
                }

                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: `${rangeName}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    resource: {
                        values: ordersToAppend
                    },
                });
                messages.push(`Appended ${ordersToAppend.length} rows`);
            }

            if (messages.length === 0) {
                return { success: true, message: 'All synced (No changes).' };
            }

            return { success: true, message: messages.join('. '), details: { updated: dataToUpdate.length, appended: ordersToAppend.length } };

        } catch (error) {
            console.error('Google Sheets Sync Error:', error);
            return { success: false, error: error.message };
        }
    }
};
