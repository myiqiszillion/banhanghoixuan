import { google } from 'googleapis';
import path from 'path';

// Path to service account key file
const KEY_FILE_PATH = path.join(process.cwd(), 'service_account.json');

// Scopes needed
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE_PATH,
    scopes: SCOPES,
});

export const googleSheets = {
    async appendOrdersToSheet(spreadsheetId, orders) {
        try {
            const client = await auth.getClient();
            const sheets = google.sheets({ version: 'v4', auth: client });

            // Prepare data rows
            const values = orders.map(o => {
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

            if (values.length === 0) return { success: true, message: 'No orders to sync' };

            // Append to "Trang tính1" (default Vietnamese name)
            // If strictly needed, we could fetch sheet metadata to get the first sheet name,
            // but for this user 'Trang tính1' is confirmed via screenshot.
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: "'Trang tính1'!A1", // Use quotes for sheet names with spaces
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values
                },
            });

            return { success: true, data: response.data };

        } catch (error) {
            console.error('Google Sheets Sync Error:', error);
            return { success: false, error: error.message };
        }
    }
};
