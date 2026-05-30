// generate-pdf.js — Server-side PDF generation using pdfkit with exact coordinates
// Called by the frontend, returns base64 PDF

const https = require("https");
const { execSync } = require("child_process");

// Install pdfkit if needed
try { require("pdfkit"); } catch(e) {
  execSync("npm install pdfkit", { cwd: "/tmp" });
}

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };

  try {
    const data = JSON.parse(event.body);
    // Return a signal that PDF should be generated client-side
    // The actual PDF generation happens in the browser using the coordinate system
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch(e) {
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: e.message }) };
  }
};
