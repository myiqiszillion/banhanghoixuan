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

            // 1. Get the name of the first sheet dynamically to avoid locale issues
            const meta = await sheets.spreadsheets.get({ spreadsheetId });
            const firstSheetTitle = meta.data.sheets[0].properties.title;
            const rangeName = `'${firstSheetTitle}'`; // Safe quote

            // 2. Check if sheet is empty to add headers
            let needsHeaders = false;
            try {
                const checkHeader = await sheets.spreadsheets.values.get({
                    spreadsheetId,
                    range: `${rangeName}!A1`,
                });
                if (!checkHeader.data.values || checkHeader.data.values.length === 0) {
                    needsHeaders = true;
                }
            } catch (e) {
                needsHeaders = true; // Assume empty on read error
            }

            // 3. Prepare data rows
            const rows = orders.map(o => {
                // Format quantity: "5 (+1 tặng)"
                let quantityStr = `${o.quantity}`;
                if (o.freePortions > 0) {
                    quantityStr += ` (+${o.freePortions} tặng)`;
                }

                return [
                    o.name,
                    `'${o.phone}`, // Force string for phone
                    o.class,
                    quantityStr,
                    o.delivered ? 'Đã giao' : 'Chưa giao',
                    new Date(o.timestamp).toLocaleString('vi-VN') // Add timestamp for tracking
                ];
            });

            if (rows.length === 0 && !needsHeaders) return { success: true, message: 'No orders to sync' };

            // Add headers if needed
            if (needsHeaders) {
                rows.unshift(['Tên', 'SĐT', 'Lớp', 'Số phần', 'Trạng thái giao', 'Thời gian']);
            }

            // 4. Append to the dynamic sheet name
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${rangeName}!A1`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: rows
                },
            });

            return { success: true, data: response.data };

        } catch (error) {
            console.error('Google Sheets Sync Error:', error);
            return { success: false, error: error.message };
        }
    }
};
