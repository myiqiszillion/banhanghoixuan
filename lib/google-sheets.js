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

            // Append to Sheet1
            const response = await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Sheet1!A1', // Start appending from A1 (smart append)
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
