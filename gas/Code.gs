const SPREADSHEET_ID = "1_fXSygfLuhT0UCuvtqKu1BlDCvCj0rfdC42onWZ2LEI";
const SHEET_NAME = "回答";

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      throw new Error(`Sheet not found: ${SHEET_NAME}`);
    }

    sheet.appendRow([
      new Date(),
      cleanText_(payload.fullName),
      cleanText_(payload.companyName),
      cleanText_(payload.email),
      cleanText_(payload.satisfaction),
      cleanText_(payload.healthAction),
      cleanText_(payload.healthSatisfaction),
      cleanText_(payload.seminarFeedback),
      cleanText_(payload.userAgent),
      cleanText_(payload.referrer),
    ]);

    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, error: error.message });
  }
}

function doGet() {
  return json_({ ok: true, service: "BODY PALETTE survey receiver" });
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Missing request body");
  }
  const payload = JSON.parse(e.postData.contents);
  if (!payload.fullName || !payload.companyName || !payload.satisfaction || !payload.healthAction || !payload.healthSatisfaction) {
    throw new Error("Required field missing");
  }
  return payload;
}

function cleanText_(value) {
  return String(value || "").replace(/[\r\n\t]/g, " ").trim().slice(0, 500);
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
