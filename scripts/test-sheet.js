const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function testSheet() {
    console.log('--- Starting Google Sheets Connection Test ---');

    const keyPath = path.join(__dirname, '../service_account.json');
    console.log('Key file path:', keyPath);

    if (!fs.existsSync(keyPath)) {
        console.error('❌ Service account file NOT found!');
        return;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const client = await auth.getClient();
        console.log('✅ Authentication successful.');
        console.log('Service Account Email:', client.credentials.client_email);

        const sheets = google.sheets({ version: 'v4', auth: client });
        const spreadsheetId = '1PIP7rtucLNpwTNxkLZVXPPno8_bKpzXaU7Vik5PZbdk'; // User's ID

        console.log(`Connecting to Spreadsheet ID: ${spreadsheetId}`);

        // Try to read metadata to check access
        const meta = await sheets.spreadsheets.get({ spreadsheetId });
        console.log('✅ Access confirmed. Spreadsheet Title:', meta.data.properties.title);

        const sheetName = meta.data.sheets[0].properties.title;
        console.log('First Sheet Name:', sheetName);

        // Try to append a test row
        console.log(`Attempting to append to '${sheetName}'...`);

        const res = await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${sheetName}'!A1`,
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: [['TEST CONNECTION', 'SUCCESS', new Date().toISOString()]]
            }
        });

        console.log('✅ Append successful!');
        console.log('Updated Range:', res.data.updates.updatedRange);

    } catch (error) {
        console.error('❌ ERROR:', error.message);
        if (error.response) {
            console.error('Details:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testSheet();
