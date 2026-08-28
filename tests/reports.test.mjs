import assert from 'node:assert/strict';
import test from 'node:test';

const {
  generateReportTicketNumber,
  reportOptionLabel,
  reportPriorityForImpact,
  REPORT_CATEGORY_OPTIONS,
} = await import('../lib/reports.ts');

test('report ticket references are stable, readable, and date-scoped', () => {
  const ticket = generateReportTicketNumber(
    new Date('2026-08-28T03:04:05.000Z'),
    'abcdef12-3456-7890-abcd-ef1234567890',
  );
  assert.equal(ticket, 'CP-REP-20260828-ABCDEF12');
});

test('report impacts map to triage priorities', () => {
  assert.equal(reportPriorityForImpact('low'), 'low');
  assert.equal(reportPriorityForImpact('medium'), 'normal');
  assert.equal(reportPriorityForImpact('high'), 'high');
  assert.equal(reportPriorityForImpact('urgent'), 'urgent');
});

test('report option labels are human-readable with a safe fallback', () => {
  assert.equal(reportOptionLabel(REPORT_CATEGORY_OPTIONS, 'website_bug'), 'Website bug or error');
  assert.equal(reportOptionLabel(REPORT_CATEGORY_OPTIONS, 'future_category'), 'future_category');
});
