// ==========================================================================
// Collector's Paradise — Vendor Applications → Google Sheets Webhook
// Paste this into Extensions > Apps Script in your Google Sheet.
// Then Deploy > New deployment > Web app → Execute as "Me" → Anyone.
// Copy the URL and add it to .env.local as GOOGLE_SHEET_WEBHOOK_URL
// ==========================================================================

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Add headers if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Applied At',
        'Business Name',
        'Contact Name',
        'Email',
        'Phone',
        'State',
        'Categories',
        'Tables Requested',
        'Power Requirements',
        'Social Links',
        'Description',
        'Logo URL',
        'Status',
      ]);
    }

    sheet.appendRow([
      data.applied_at || new Date().toISOString(),
      data.business_name || '',
      data.contact_name || '',
      data.email || '',
      data.phone || '',
      data.location_state || '',
      (data.categories || []).join(', '),
      data.tables_requested || '',
      data.power_requirements || '',
      data.social_links || '',
      data.description || '',
      data.logo_url || '',
      data.application_status || 'pending',
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('Collectors Paradise webhook is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
