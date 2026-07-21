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
//   - Already 16-col → no-op
// ==========================================================================

var HEADERS = [
  'Vendor ID',
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
  'Additional Notes',
  'Booth Assignment',
  'Status',
];

/**
 * Ensure the sheet has the correct 16-column header layout.
 * Inserts missing columns before the "Status" column so existing data stays
 * aligned regardless of which header version the sheet currently has.
 */
function ensureHeaders_(sheet) {
  var lastRow = sheet.getLastRow();

  // Empty sheet
  if (lastRow === 0) {
    sheet.appendRow(HEADERS);
    return;
  }

  var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Already correct 16-column layout
  if (currentHeaders.length >= 16 && currentHeaders[0] === 'Vendor ID') return;

  // Insert Vendor ID column if missing (column A currently has "Applied At")
  if (currentHeaders[0] !== 'Vendor ID') {
    sheet.insertColumnBefore(1);
    // Re-read headers since everything shifted right
    currentHeaders = ['Vendor ID'].concat(currentHeaders);
  }

  // Find where Social Links and Status are now (1-based column, after Vendor ID fix)
  var socialCol = -1;
  var statusCol = -1;
  for (var i = 0; i < currentHeaders.length; i++) {
    if (currentHeaders[i] === 'Social Links') socialCol = i + 1;
    if (currentHeaders[i] === 'Status') statusCol = i + 1;
  }
  if (statusCol === -1) statusCol = currentHeaders.length + 1; // append at end

  // Insert Tables Requested before Social Links if missing
  var hasTables = false;
  for (var t = 0; t < currentHeaders.length; t++) {
    if (currentHeaders[t] === 'Tables Requested') { hasTables = true; break; }
  }
  if (!hasTables && socialCol > 0) {
    sheet.insertColumnBefore(socialCol);
    socialCol++; // Social Links shifted right
    if (socialCol <= statusCol) statusCol++;
  }

  // Insert Power Requirements before Social Links if missing
  var hasPower = false;
  for (var p = 0; p < currentHeaders.length; p++) {
    if (currentHeaders[p] === 'Power Requirements') { hasPower = true; break; }
  }
  if (!hasPower && socialCol > 0) {
    sheet.insertColumnBefore(socialCol);
    socialCol++;
    if (socialCol <= statusCol) statusCol++;
  }

  // Insert Additional Notes before Status if missing
  var hasNotes = false;
  for (var j = 0; j < currentHeaders.length; j++) {
    if (currentHeaders[j] === 'Additional Notes') { hasNotes = true; break; }
  }
  if (!hasNotes) {
    sheet.insertColumnBefore(statusCol);
    statusCol++;
  }

  // Insert Booth Assignment before Status if missing
  var hasBooth = false;
  for (var k = 0; k < currentHeaders.length; k++) {
    if (currentHeaders[k] === 'Booth Assignment') { hasBooth = true; break; }
  }
  if (!hasBooth) {
    sheet.insertColumnBefore(statusCol);
  }

  // Write the full header row
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
}

/**
 * Find the row index (1-based) matching a vendor.
 * Priority: vendor ID match > email match.
 */
function findVendorRow_(sheet, data) {
  var numDataRows = sheet.getLastRow() - 1;
  if (numDataRows <= 0) return { row: null, matchedBy: null };

  var dataRange = sheet.getRange(2, 1, numDataRows, 5); // columns A-E
  var rows = dataRange.getValues();
  var vendorId = data.id || '';
  var email = data.email || '';

  // Pass 1: match by vendor ID
  if (vendorId) {
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0] === vendorId) return { row: i + 2, matchedBy: 'id' };
    }
  }

  // Pass 2: fallback to email (pre-migration rows with no Vendor ID)
  if (email) {
    for (var j = 0; j < rows.length; j++) {
      if (rows[j][4] === email) return { row: j + 2, matchedBy: 'email' };
    }
  }

  return { row: null, matchedBy: null };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    ensureHeaders_(sheet);

    var match = findVendorRow_(sheet, data);
    var row = buildRow(data);

    if (match.row) {
      // Email-matched row has no ID yet — backfill
      if (match.matchedBy === 'email' && data.id) {
        row[0] = data.id;
        sheet.getRange(match.row, 1).setValue(data.id);
      }
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
    data.id || '',
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
