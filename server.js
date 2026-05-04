require("dotenv").config();

const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "https://reifenweber.com",
  "https://www.reifenweber.com",
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Nicht erlaubter Ursprung"));
  },
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    service: "reifen-weber-api",
    message: "Backend läuft",
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

function required(value) {
  return value && String(value).trim().length > 0;
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

app.post("/api/appointments", async (req, res) => {
  try {
    const data = req.body || {};

    const errors = [];

    if (!required(data.service)) errors.push("Leistung fehlt.");
    if (!required(data.preferred_date)) errors.push("Wunschdatum fehlt.");
    if (!required(data.preferred_time)) errors.push("Wunschuhrzeit fehlt.");
    if (!required(data.first_name)) errors.push("Vorname fehlt.");
    if (!required(data.last_name)) errors.push("Nachname fehlt.");
    if (!required(data.email)) errors.push("E-Mail fehlt.");
    if (!required(data.privacy)) errors.push("Datenschutz muss bestätigt werden.");

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        errors,
      });
    }

    const fullName = `${data.first_name} ${data.last_name}`.trim();

    const adminHtml = `
      <h2>Neue Terminanfrage</h2>
      <p>Es ist eine neue Terminanfrage über reifenweber.com eingegangen.</p>

      <h3>Termin</h3>
      <p>
        <strong>Leistung:</strong> ${data.service || "-"}<br>
        <strong>Räder eingelagert:</strong> ${data.storage || "-"}<br>
        <strong>Wunschdatum:</strong> ${data.preferred_date || "-"}<br>
        <strong>Wunschuhrzeit:</strong> ${data.preferred_time || "-"}
      </p>

      <h3>Kunde</h3>
      <p>
        <strong>Name:</strong> ${fullName || "-"}<br>
        <strong>E-Mail:</strong> ${data.email || "-"}<br>
        <strong>Telefon:</strong> ${data.phone || "-"}
      </p>

      <h3>Fahrzeug</h3>
      <p>
        <strong>Kennzeichen:</strong> ${data.license_plate || "-"}<br>
        <strong>Fahrzeug:</strong> ${data.vehicle || "-"}<br>
        <strong>Reifengröße:</strong> ${data.tire_size || "-"}<br>
        <strong>Saison:</strong> ${data.season || "-"}
      </p>

      <h3>Nachricht</h3>
      <p>${data.note || "-"}</p>
    `;

    const customerHtml = `
      <h2>Ihre Terminanfrage ist eingegangen</h2>
      <p>Hallo ${data.first_name},</p>
      <p>vielen Dank für Ihre Terminanfrage bei Reifen Weber.</p>
      <p>
        <strong>Wunschdatum:</strong> ${data.preferred_date}<br>
        <strong>Wunschuhrzeit:</strong> ${data.preferred_time}<br>
        <strong>Leistung:</strong> ${data.service}
      </p>
      <p>Der Termin ist noch nicht verbindlich bestätigt. Wir prüfen Ihre Anfrage und melden uns kurzfristig per E-Mail.</p>
      <p>Viele Grüße<br>Reifen Weber</p>
    `;

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Reifen Weber" <${process.env.MAIL_FROM}>`,
      to: process.env.MAIL_TO,
      replyTo: data.email,
      subject: `Neue Terminanfrage: ${fullName} – ${data.preferred_date} ${data.preferred_time}`,
      html: adminHtml,
    });

    await transporter.sendMail({
      from: `"Reifen Weber" <${process.env.MAIL_FROM}>`,
      to: data.email,
      subject: "Ihre Terminanfrage bei Reifen Weber ist eingegangen",
      html: customerHtml,
    });

    res.json({
      ok: true,
      message: "Terminanfrage wurde gesendet.",
    });
  } catch (error) {
    console.error("Appointment error:", error);

    res.status(500).json({
      ok: false,
      message: "Terminanfrage konnte nicht gesendet werden.",
    });
  }
});

app.post("/api/tire-quotes", async (req, res) => {
  try {
    const data = req.body || {};

    const errors = [];

    if (!required(data.tire_size)) errors.push("Reifengröße fehlt.");
    if (!required(data.season)) errors.push("Saison fehlt.");
    if (!required(data.first_name)) errors.push("Vorname fehlt.");
    if (!required(data.last_name)) errors.push("Nachname fehlt.");
    if (!required(data.email)) errors.push("E-Mail fehlt.");
    if (!required(data.privacy)) errors.push("Datenschutz muss bestätigt werden.");

    if (errors.length > 0) {
      return res.status(400).json({
        ok: false,
        errors,
      });
    }

    const fullName = `${data.first_name} ${data.last_name}`.trim();

    const adminHtml = `
      <h2>Neue Reifenanfrage</h2>
      <p>Es ist eine neue Reifenanfrage über reifenweber.com eingegangen.</p>

      <h3>Reifendaten</h3>
      <p>
        <strong>Reifengröße:</strong> ${data.tire_size || "-"}<br>
        <strong>Saison:</strong> ${data.season || "-"}<br>
        <strong>Marke:</strong> ${data.brand || "-"}<br>
        <strong>Anzahl:</strong> ${data.quantity || "-"}
      </p>

      <h3>Kunde</h3>
      <p>
        <strong>Name:</strong> ${fullName || "-"}<br>
        <strong>E-Mail:</strong> ${data.email || "-"}<br>
        <strong>Telefon:</strong> ${data.phone || "-"}
      </p>

      <h3>Fahrzeug</h3>
      <p>
        <strong>Fahrzeug:</strong> ${data.vehicle || "-"}<br>
        <strong>Kennzeichen:</strong> ${data.license_plate || "-"}
      </p>

      <h3>Nachricht</h3>
      <p>${data.note || "-"}</p>
    `;

    const customerHtml = `
      <h2>Ihre Reifenanfrage ist eingegangen</h2>
      <p>Hallo ${data.first_name},</p>
      <p>vielen Dank für Ihre Reifenanfrage bei Reifen Weber.</p>
      <p>
        <strong>Reifengröße:</strong> ${data.tire_size}<br>
        <strong>Saison:</strong> ${data.season}<br>
        <strong>Marke:</strong> ${data.brand || "Keine bevorzugte Marke angegeben"}
      </p>
      <p>Wir prüfen Ihre Anfrage und melden uns kurzfristig per E-Mail.</p>
      <p>Viele Grüße<br>Reifen Weber</p>
    `;

    const transporter = createTransporter();

    await transporter.sendMail({
      from: `"Reifen Weber" <${process.env.MAIL_FROM}>`,
      to: process.env.MAIL_TO,
      replyTo: data.email,
      subject: `Neue Reifenanfrage: ${fullName} – ${data.tire_size}`,
      html: adminHtml,
    });

    await transporter.sendMail({
      from: `"Reifen Weber" <${process.env.MAIL_FROM}>`,
      to: data.email,
      subject: "Ihre Reifenanfrage bei Reifen Weber ist eingegangen",
      html: customerHtml,
    });

    res.json({
      ok: true,
      message: "Reifenanfrage wurde gesendet.",
    });
  } catch (error) {
    console.error("Tire quote error:", error);

    res.status(500).json({
      ok: false,
      message: "Reifenanfrage konnte nicht gesendet werden.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Reifen Weber API läuft auf Port ${PORT}`);
});
