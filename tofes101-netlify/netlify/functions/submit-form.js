const crypto = require("crypto");
const https = require("https");

const CLIENT_EMAIL = "firebase-adminsdk-fbsvc@tofes101-cdd0a.iam.gserviceaccount.com";
const PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDfLG85BSi/HmeJ\nrC1TTcHpkYXyDiibmtmjG+LxkLgNUT2jew/gdMviPKpixtHsvNQd70JCmlH5e5sh\nz111/RKk6pe8PvuqnPlA/L4f5kLLO9ebe1I12nmXZZ+OzDQ34ZXjpqn8qmnL6tnN\nlZC9Q1EnqgUwA0OGed+fBTUbem3k0Hk925z/0kpcYT7u2Obsj4DC1exJR0vjF4jV\nq0fmiwK6st/JO6HtpD4KTPJcLd7XjtAQZpEFJmYQPsHsQRauDKHW8fYY9K7RcKIz\nPC9ckrFozWEef6sWPUTvRkPtFcbrHhP0Kg3NYull29/XcuHXRrfypICCbiRWM518\nVwuzyyBvAgMBAAECggEABuRwaupl38EooW/X1oLIQlZkNJ2LU4LsxcTOtXcqt/6S\nUMI0M1JoGYyWFobdZNpQEryY50Ws0m+m0tx8nnA6ay1zkjS/wP0oFYG4vXN3DJ/E\ngODGITOmHa7dxqM32aH15xn2lf8NVWbjYx4DYlT55KezkVAIfda1uUuH4Flfm3lm\nAWPjXmV8tT9Yy15kPZ+Bw1KmiOTqbbAZJgoiMhnHHhcYDBQGrikJF2qpSPmrhixX\nzgXQ/vA/DiiFeLsKb+jw7oie2kvFdyHZA6N7ZtPCIBUbscVVn8iJhiF5E857RDYl\nrhvxwcZ3/194nxeJK8HIm+UV3VjveEyfofz5F+kmwQKBgQDxkhUSQpF/qEu4ltZ7\nA0G3FrYbasFlGJDmf2G4RuugyQTxsX9NcQeoAKGcfIt5OqDcW6fADfE4G7ENLOQX\nnQD7XLAlo6OhVSIryvW9E78d+y6jibKitK3+Ah3E8TySPqt01oqg2N7vo9UpmPeG\nDlbHI1kOFHBdtcwpZbQwKzweiwKBgQDsgQm8CAW2HtQAb2KY7+mxB6UlarwfIDbY\nM3gTpC3mg5z2zFfOpR812qYv+ZGjWyzxYhLssj6KPHLwSexHjBCaZtXgR3N8bDQi\nvbbiTwD9L/5jqu6AJRStSuHEIlrXPfn4ofh8a+LdsuphbgTwHIw59QZrCfgbd2l8\nW98t41eGLQKBgGI05DIXM/V04su5Lpq12TpolkIRJWxHD2lVcdGrq1EjR8pGQZ2n\nDNjE4O6wRzdSmWDcNhdC08TepRzZGiVrY6HMraOvoe8NoCWzjjF+3JyAqBY9/Yxd\n7bos/BM7i0ddCPEn4xW+9OrxbNBLap1qKOcuPJ8XuhKuvMA7o4RNn1Q/AoGBAOu2\nuCMFw9t94kIEwbo38ywTuI8QUCqdisv0kErTKUREDJ8VjrZQcEjWgSfzjynG54Y0\n/zOVeyt/j/bZVnsAqFObBrMfw4RQu62cc7gekZfGy74+ULK7Ql5s8ZLvwqYgCRG7\nLNOlG1lmxp8Qbi955HCnOxxXtUZ6v1HIpykvGr6JAoGAD/XDCsuIuXNDsF/VFUPD\nSF5RlNqqtF9FbDD0ETPm5O9uEagpJ/AQMFEXDgUIsinX7EKtKyCNq2WNoT1qwFFp\nXKmvGhau3SbDxACBuO/vB3D1lkOkz0w5HzYtcr82n5KBWfi7TCUKItygPFR5XnHl\nDlLnyOf1SRcKYtGPNaAZyVE=\n-----END PRIVATE KEY-----\n";
const FIREBASE_BUCKET = "tofes101-cdd0a.appspot.com";

function b64url(str) {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function post(hostname, path, headers, body) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname, path, method: "POST", headers: { ...headers, "Content-Length": buf.length } },
      (res) => {
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
      }
    );
    req.on("error", reject);
    req.write(buf);
    req.end();
  });
}

async function getFirebaseToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim  = b64url(JSON.stringify({
    iss: CLIENT_EMAIL, sub: CLIENT_EMAIL,
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
    scope: "https://www.googleapis.com/auth/devstorage.read_write",
  }));
  const input = `${header}.${claim}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(input);
  const sig = signer.sign(PRIVATE_KEY, "base64").replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
  const jwt = `${input}.${sig}`;

  const body = "grant_type=" + encodeURIComponent("urn:ietf:wg:oauth:2.0:jwt-bearer") + "&assertion=" + encodeURIComponent(jwt);
  const res = await post("oauth2.googleapis.com", "/token",
    { "Content-Type": "application/x-www-form-urlencoded" }, body);

  const data = JSON.parse(res.body);
  if (!data.access_token) throw new Error("Firebase auth failed: " + res.body);
  return data.access_token;
}

async function uploadToFirebase(token, filename, pdfBuffer) {
  const path = encodeURIComponent(`tofes101/${filename}`);
  const res = await post(
    "firebasestorage.googleapis.com",
    `/v0/b/${FIREBASE_BUCKET}/o?uploadType=media&name=${path}`,
    { "Content-Type": "application/pdf", "Authorization": `Bearer ${token}` },
    pdfBuffer
  );
  if (res.status < 200 || res.status >= 300) throw new Error(`Upload failed (${res.status}): ${res.body}`);
  const encodedPath = encodeURIComponent(`tofes101/${filename}`);
  return `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_BUCKET}/o/${encodedPath}?alt=media`;
}

async function sendEmail(subject, html) {
  const body = JSON.stringify({
    from: "onboarding@resend.dev",
    to: ["kippstar@gmail.com"],
    subject, html,
  });
  const res = await post(
    "api.resend.com", "/emails",
    { "Authorization": `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body
  );
  if (res.status < 200 || res.status >= 300) throw new Error("Resend failed: " + res.body);
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

    const token = await getFirebaseToken();
    const downloadURL = await uploadToFirebase(token, filename, Buffer.from(pdfBase64, "base64"));
    const date = new Date().toLocaleDateString("he-IL");

    await sendEmail(subject, `
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
          <hr style="border:1px solid #e0ddd6;margin:16px 0">
          <a href="${downloadURL}" style="display:inline-block;background:#1a2744;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;font-weight:bold">📄 הורד PDF</a>
        </div>
      </div>
    `);

    return { statusCode: 200, headers: cors, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Error:", err.message);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
