// ==========================================================================
// Collector's Paradise — Vendor Applications → Google Sheets Webhook
// Paste this into Extensions > Apps Script in your Google Sheet.
// Then Deploy > New deployment > Web app → Execute as "Me" → Anyone.
// Copy the URL and add it to .env.local as GOOGLE_SHEET_WEBHOOK_URL
//
// Includes Vendor ID column (A) and upserts by ID so admin edits correct the
// existing row instead of appending a duplicate. Falls back to email match
// for rows created before the Vendor ID column was added (backfills the ID).
//
// Migration handles:
//   - Empty sheet → write headers
//   - Old 13-col (Applied At in A, Status at 13)
//   - Intermediate 14-col (Vendor ID in A, Status at 14)
//   - Already 19-col → no-op
// ==========================================================================

var HEADERS = [
  'Application ID',
  'Vendor ID',
  'Applied At',
  'Business Name',
  'Contact Name',
  'Email',
  'Phone',
  'State',
  'Categories',
  'Event ID',
  'Event Name',
  'Tables Requested',
  'Power Requirements',
  'Social Links',
  'Description',
  'Logo URL',
  'Additional Notes',
  'Booth Assignment',
  'Status',
];

/**
 * Ensure the sheet has the correct 19-column header layout.
 * Rebuilds rows by header name so existing data stays aligned across sheet
 * versions while adding Event ID and Event Name.
 */
function ensureHeaders_(sheet) {
  var lastRow = sheet.getLastRow();

  if (lastRow === 0) {
    sheet.appendRow(HEADERS);
    return;
  }

  var lastColumn = sheet.getLastColumn();
  var currentHeaders = lastColumn > 0
    ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
    : [];
  var dataRows = lastRow > 1 && lastColumn > 0
    ? sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues()
    : [];

  // Rebuild by header name, not column position. This preserves old rows while
  // safely adding Application ID, Event ID, and Event Name to every supported sheet layout.
  var columnIndexes = HEADERS.map(function(header) {
    return currentHeaders.indexOf(header);
  });
  var migratedRows = dataRows.map(function(row) {
    return columnIndexes.map(function(index) {
      return index >= 0 ? row[index] || '' : '';
    });
  });

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  if (migratedRows.length > 0) {
    sheet.getRange(2, 1, migratedRows.length, HEADERS.length).setValues(migratedRows);
  }
}

/**
 * Find the row index (1-based) matching a vendor.
 * Priority: vendor ID match > email match.
 */
function findVendorRow_(sheet, data) {
  var numDataRows = sheet.getLastRow() - 1;
  if (numDataRows <= 0) return { row: null, matchedBy: null };

  var dataRange = sheet.getRange(2, 1, numDataRows, 10); // columns A-J
  var rows = dataRange.getValues();
  var applicationId = data.application_id || '';
  var vendorId = data.id || '';
  var email = data.email || '';
  var eventId = data.event_id || '';

  // Multi-event rows use stable application ID. Legacy rows fall back to
  // vendor/event, then email/event, so one vendor never overwrites another event.
  if (applicationId) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === applicationId) return { row: i + 2, matchedBy: 'application_id' };
    }
  }
  if (vendorId) {
    for (var j = 0; j < rows.length; j++) {
      if (rows[j][1] === vendorId && (!eventId || rows[j][9] === eventId)) return { row: j + 2, matchedBy: 'vendor_event' };
    }
  }
  if (email) {
    for (var k = 0; k < rows.length; k++) {
      if (rows[k][5] === email && (!eventId || rows[k][9] === eventId)) return { row: k + 2, matchedBy: 'email_event' };
    }
  }
  return { row: null, matchedBy: null };
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    ensureHeaders_(sheet);

    var match = findVendorRow_(sheet, data);
    var row = buildRow(data);

    if (match.row) {
      // Backfill stable application and vendor IDs on migrated rows.
      if (data.application_id) row[0] = data.application_id;
      if (data.id) row[1] = data.id;
      sheet.getRange(match.row, 1, 1, row.length).setValues([row]);
      return respond({ success: true, action: 'updated', row: match.row });
    }

    sheet.appendRow(row);
    return respond({ success: true, action: 'appended' });
  } catch (err) {
    return respond({ success: false, error: err.message });
  }
}

function buildRow(data) {
  return [
    data.application_id || '',
    data.id || '',
    data.applied_at || new Date().toISOString(),
    data.business_name || '',
    data.contact_name || '',
    data.email || '',
    data.phone || '',
    data.location_state || '',
    (data.categories || []).join(', '),
    data.event_id || '',
    data.event_name || '',
    data.tables_requested || '',
    data.power_requirements || '',
    data.social_links || '',
    data.description || '',
    data.logo_url || '',
    data.additional_notes || '',
    data.booth_assignment || '',
    data.application_status || 'pending',
  ];
}

function respond(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function doGet() {
  return ContentService.createTextOutput('Collectors Paradise webhook is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}
