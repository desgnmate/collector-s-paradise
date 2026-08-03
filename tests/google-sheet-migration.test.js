// Loads the actual Google Apps Script webhook via vm sandbox and tests
// the ensureHeaders_ migration paths. Run: node tests/google-sheet-migration.test.js

const vm = require('vm');
const fs = require('fs');

// --------------------------------------------------------------------------
// Mock Sheet: 2D array wrapper that mirrors GAS SpreadsheetApp API surface
// --------------------------------------------------------------------------
function mockSheet(initialData) {
  var rows = initialData.map(r => r.slice());
  return {
    _rows: rows,
    getLastRow() { return rows.length; },
    getLastColumn() {
      var m = 0;
      for (var i = 0; i < rows.length; i++) if (rows[i].length > m) m = rows[i].length;
      return m;
    },
    getRange(row, col, numRows, numCols) {
      var r0 = row - 1, c0 = col - 1;
      return {
        getValues() {
          var result = [];
          for (var r = r0; r < r0 + numRows; r++) {
            var rowVals = [];
            for (var c = c0; c < c0 + numCols; c++)
              rowVals.push((rows[r] && rows[r][c] !== undefined) ? rows[r][c] : '');
            result.push(rowVals);
          }
          return result;
        },
        setValues(vals) {
          for (var r = 0; r < vals.length; r++) {
            var rowIdx = r0 + r;
            while (rows.length <= rowIdx) rows.push([]);
            for (var c = 0; c < vals[r].length; c++) {
              var colIdx = c0 + c;
              while (rows[rowIdx].length <= colIdx) rows[rowIdx].push('');
              rows[rowIdx][colIdx] = vals[r][c];
            }
          }
        }
      };
    },
    appendRow(vals) { rows.push(vals.slice()); },
    insertColumnBefore(col) {
      var c = col - 1;
      for (var r = 0; r < rows.length; r++) {
        while (rows[r].length < c) rows[r].push('');
        rows[r].splice(c, 0, '');
      }
    }
  };
}

// --------------------------------------------------------------------------
// Load actual webhook in vm sandbox
// --------------------------------------------------------------------------
var GAS_MOCKS = {
  SpreadsheetApp: { getActiveSpreadsheet() { return { getActiveSheet() { return null } } } },
  ContentService: {
    createTextOutput(s) { return { setMimeType() { return this } } },
    MimeType: { JSON: 'application/json', TEXT: 'text/plain' }
  },
  console,
};

var sandbox = Object.assign({}, GAS_MOCKS);
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('lib/google-sheet-webhook.js', 'utf8'), sandbox);

var ensureHeaders_ = sandbox.ensureHeaders_;
var buildRow = sandbox.buildRow;
var findVendorRow_ = sandbox.findVendorRow_;
var HEADERS = sandbox.HEADERS;

// --------------------------------------------------------------------------
// Assertion helpers
// --------------------------------------------------------------------------
var passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; } else { failed++; console.error('FAIL: ' + msg); }
}
function assertEq(actual, expected, label) {
  if (actual === expected) { passed++; }
  else { failed++; console.error('FAIL: ' + label + ' — expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual)); }
}

// --------------------------------------------------------------------------
// Test 1: Old 13-col → 18-col migration
// --------------------------------------------------------------------------
(function() {
  var oldHeaders = ['Applied At','Business Name','Contact Name','Email','Phone','State','Categories','Social Links','Description','Logo URL','Additional Notes','Booth Assignment','Status'];
  var oldRow = [
    '2025-06-15T10:30:00Z','Melb Poké Co','Jane Doe','jane@test.com','0400000000',
    'VIC','TCG Cards','https://insta.com/melb','We sell cards','https://storage/logo.png',
    'Corner stall','Booth #4','approved'
  ];
  var sheet = mockSheet([oldHeaders, oldRow]);
  ensureHeaders_(sheet);
  var h = sheet._rows[0], d = sheet._rows[1];

  assertEq(h.length, 18, 'T1: header count after migration');
  for (var i = 0; i < HEADERS.length; i++) assertEq(h[i], HEADERS[i], 'T1: header[' + i + ']');
  assertEq(d[0], '', 'T1: col A (Vendor ID) blank for old row');
  assertEq(d[8], '', 'T1: col I (Event ID) blank');
  assertEq(d[9], '', 'T1: col J (Event Name) blank');
  assertEq(d[10], '', 'T1: col K (Tables Requested) blank');
  assertEq(d[12], 'https://insta.com/melb', 'T1: col M (Social Links) = Instagram URL, NOT logo URL');
  assertEq(d[14], 'https://storage/logo.png', 'T1: col O (Logo URL) = storage URL');
})();

// --------------------------------------------------------------------------
// Test 2: Already correct 18-col — no-op
// --------------------------------------------------------------------------
(function() {
  var sheet = mockSheet([HEADERS.slice()]);
  ensureHeaders_(sheet);
  assertEq(sheet._rows[0].length, 18, 'T2: no extra columns');
  assertEq(sheet._rows[0][0], HEADERS[0], 'T2: first header preserved');
})();

// --------------------------------------------------------------------------
// Test 3: Empty sheet — appends headers
// --------------------------------------------------------------------------
(function() {
  var sheet = mockSheet([]);
  ensureHeaders_(sheet);
  assertEq(sheet._rows.length, 1, 'T3: one row');
  assertEq(sheet._rows[0].length, 18, 'T3: 18 header columns');
})();

// --------------------------------------------------------------------------
// Test 4: buildRow returns 18 values in HEADERS order
// --------------------------------------------------------------------------
(function() {
  // Full data
  var data = { id:'v1', applied_at:'2025-01-01', business_name:'Biz', contact_name:'Bob', email:'b@b.com', phone:'1', location_state:'NSW', categories:['X'], event_id:'e1', event_name:'Gold Coast Show', tables_requested:'3', power_requirements:'No', social_links:'https://ig.com/biz', description:'desc', logo_url:'https://logo.com/x.png', additional_notes:'notes', booth_assignment:'B5', application_status:'active' };
  var row = buildRow(data);
  assertEq(row.length, 18, 'T4a: 18 values');
  assertEq(row[0], 'v1', 'T4a: [0] Vendor ID');
  assertEq(row[8], 'e1', 'T4a: [8] Event ID');
  assertEq(row[9], 'Gold Coast Show', 'T4a: [9] Event Name');
  assertEq(row[10], '3', 'T4a: [10] Tables Requested');
  assertEq(row[12], 'https://ig.com/biz', 'T4a: [12] Social Links');
  assertEq(row[14], 'https://logo.com/x.png', 'T4a: [14] Logo URL');

  // Empty data
  var empty = buildRow({});
  assertEq(empty.length, 18, 'T4b: empty → 18 values');
  assertEq(empty[0], '', 'T4b: empty id');
  assertEq(empty[17], 'pending', 'T4b: default status');
})();

// --------------------------------------------------------------------------
// Test 5: findVendorRow_ by ID and email fallback
// --------------------------------------------------------------------------
(function() {
  var sheet = mockSheet([HEADERS.slice()]);
  sheet.appendRow(['','2025-01-01','OldCo','Old','old@test.com','1','VIC','X','','','https://ig.com/old','desc','','notes','','approved']);
  sheet.appendRow(['v2','2025-02-01','NewCo','New','new@test.com','2','NSW','Y','1','No','https://ig.com/new','desc2','','','','pending']);

  var m = findVendorRow_(sheet, { id: 'v2', email: 'new@test.com' });
  assertEq(m.row, 3, 'T5a: by ID returns row 3');
  assertEq(m.matchedBy, 'id', 'T5b: matched by id');

  m = findVendorRow_(sheet, { email: 'old@test.com' });
  assertEq(m.row, 2, 'T5c: by email returns row 2');
  assertEq(m.matchedBy, 'email', 'T5d: matched by email');
})();

// --------------------------------------------------------------------------
// Summary
// --------------------------------------------------------------------------
console.log('google-sheet-migration: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
