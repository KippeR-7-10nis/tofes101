// v5 - no Firebase, PDF sent directly as email attachment via Resend
const crypto = require("crypto");
const https = require("https");

function httpsPost(hostname, path, headers, body) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: "POST", headers: { ...headers, "Content-Length": buf.length } },
      (res) => {
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => resolve({
          status: res.statusCode,
          body: Buffer.concat(chunks).toString()
        }));
      }
    );
    req.on("error", reject);
    req.write(buf);
    req.end();
  });
}

exports.handler = async (event) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };
  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers: cors, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers: cors, body: "Method Not Allowed" };

  try {
    const { pdfBase64, filename, subject, formSummary, studentName, studentId } = JSON.parse(event.body);
    const date = new Date().toLocaleDateString("he-IL");

    // Send email with PDF attached directly via Resend API
    const emailPayload = JSON.stringify({
      from: "onboarding@resend.dev",
      to: ["kippstar@gmail.com"],
      subject: subject,
      html: `
        <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#1a2744;color:white;padding:20px;border-radius:10px 10px 0 0">
            <h2 style="margin:0">📋 טופס 101 חדש התקבל</h2>
          </div>
          <div style="background:#f8f6f2;padding:20px;border:1px solid #e0ddd6;border-radius:0 0 10px 10px">
            <p><strong>תלמיד/ה:</strong> ${studentName}</p>
            <p><strong>ת.ז.:</strong> ${studentId}</p>
            <p><strong>תאריך:</strong> ${date}</p>
            <hr style="border:1px solid #e0ddd6;margin:16px 0">
            <pre style="background:white;padding:16px;border-radius:8px;font-size:13px;white-space:pre-wrap;border:1px solid #e0ddd6;direction:rtl">${formSummary}</pre>
            <p style="color:#888;font-size:12px;margin-top:16px">הקובץ ${filename} מצורף למייל זה.</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: filename,
          content: pdfBase64,
        }
      ]
    });

    const res = await httpsPost(
      "api.resend.com",
      "/emails",
      {
        "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      emailPayload
    );

    const data = JSON.parse(res.body);
    if (res.status < 200 || res.status >= 300) {
      throw new Error(`Resend failed (${res.status}): ${res.body}`);
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true, id: data.id }) };

  } catch (err) {
    console.error("Error:", err.message);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
