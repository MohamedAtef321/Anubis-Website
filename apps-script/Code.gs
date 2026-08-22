/**
 * ANUBIS WAITLIST — Google Sheets backend (Apps Script Web App)
 * Receives POST (JSON as text/plain) from js/waitlist.js and appends
 * EVERY captured field + Cairo time into spreadsheet "Anubis Waitlist".
 *
 * Deploy: Deploy > New deployment > Web app
 *   Execute as: Me    Who has access: Anyone
 */

var SHEET_NAME = "Waitlist";
var SPREADSHEET_NAME = "Anubis Waitlist";

// Column order = header row. Every field the site sends lands in its column.
var COLUMNS = [
  "timestamp_cairo",
  "timestamp_utc",
  "email",
  "submission_id",
  "page_path",
  "page_url",
  "referrer",
  "referrer_full",
  "userAgent",
  "language",
  "languages",
  "platform",
  "vendor",
  "timezone",
  "tzOffset",
  "screen",
  "viewport",
  "devicePixelRatio",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "rawQuery"
];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) ss = SpreadsheetApp.create(SPREADSHEET_NAME);
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  // delete default Sheet1 if empty & unused
  var def = ss.getSheetByName("Sheet1");
  if (def && ss.getSheets().length > 1 && def.getLastRow() === 0) ss.deleteSheet(def);
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLUMNS);
    var head = sh.getRange(1, 1, 1, COLUMNS.length);
    head.setFontWeight("bold").setBackground("#1a1408").setFontColor("#d9b45b");
    sh.setFrozenRows(1);
    sh.autoResizeColumns(1, COLUMNS.length);
  }
  return sh;
}

function cairoTime_(isoOrDate) {
  var d = isoOrDate ? new Date(isoOrDate) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  return Utilities.formatDate(d, "Africa/Cairo", "yyyy-MM-dd HH:mm:ss");
}

function appendRow_(p) {
  var sh = getSheet_();
  p = p || {};
  var row = COLUMNS.map(function (c) {
    if (c === "timestamp_cairo") return cairoTime_(p.timestamp || p.timestamp_utc);
    if (c === "timestamp_utc") return p.timestamp || p.timestamp_utc || new Date().toISOString();
    var v = p[c];
    return v === undefined || v === null ? "" : String(v).slice(0, 500);
  });
  sh.appendRow(row);
  return true;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // wait up to 20s; avoids concurrent-append races
  } catch (err) {
    return json_({ ok: false, error: "lock timeout" });
  }
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); }
      catch (_) { body = parseForm_(e.postData.contents); }
    } else if (e && e.parameter) {
      body = e.parameter;
    }
    if (!body.email || String(body.email).indexOf("@") === -1) {
      return json_({ ok: false, error: "invalid email" });
    }
    appendRow_(body);
    return json_({ ok: true, at: cairoTime_() });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

function doGet(e) {
  // health check + optional ?email= quick-add (useful for QR/paper links)
  if (e && e.parameter && e.parameter.email && e.parameter.email.indexOf("@") !== -1) {
    var lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      var p = e.parameter;
      appendRow_(p);
      return ContentService.createTextOutput("✓ " + p.email + " added to Anubis Waitlist");
    } finally {
      try { lock.releaseLock(); } catch (_) {}
    }
  }
  return ContentService.createTextOutput("ANUBIS Waitlist API is alive ✓");
}

/* ---- helpers ---- */
function parseForm_(txt) {
  var out = {};
  txt.split("&").forEach(function (kv) {
    var i = kv.indexOf("=");
    if (i > 0) out[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " "));
  });
  return out;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Run once from the editor to create the spreadsheet immediately. */
function setupSheet() {
  getSheet_();
}
