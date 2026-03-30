import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map(v => v.trim())
    : "*"
}));
app.use(express.json());

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

app.get("/health", (_, res) => {
  res.json({ ok: true });
});

app.post("/submit-profile", async (req, res) => {
  try {
    const { platform, accessToken, userID } = req.body || {};

    if (platform !== "facebook") {
      return res.status(400).json({ ok: false, message: "Chỉ hỗ trợ facebook" });
    }

    if (!accessToken || !userID) {
      return res.status(400).json({ ok: false, message: "Thiếu accessToken hoặc userID" });
    }

    const graphResponse = await axios.get("https://graph.facebook.com/me", {
      params: {
        fields: "id,name,picture.width(300).height(300)",
        access_token: accessToken
      },
      timeout: 15000
    });

    const profile = graphResponse.data || {};

    if (!profile.id || String(profile.id) !== String(userID)) {
      return res.status(400).json({ ok: false, message: "Token không khớp user" });
    }

    const avatarUrl = profile.picture?.data?.url || "";
    const safeId = escapeHtml(String(profile.id || "").slice(0, 120));
    const safeName = escapeHtml(String(profile.name || "").slice(0, 120));
    const safeAvatar = escapeHtml(String(avatarUrl || "").slice(0, 1000));
    const now = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh"
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.RECEIVER_EMAIL,
      subject: "[facebook] Người dùng đã chia sẻ hồ sơ",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6">
          <h2>Thông tin người dùng</h2>
          <p><strong>Nền tảng:</strong> Facebook</p>
          <p><strong>ID:</strong> ${safeId}</p>
          <p><strong>Tên:</strong> ${safeName}</p>
          <p><strong>Avatar:</strong><br>
            <img src="${safeAvatar}" alt="avatar" style="max-width:220px;border-radius:12px;border:1px solid #ddd" />
          </p>
          <p><strong>Link ảnh:</strong> ${safeAvatar}</p>
          <p><strong>Thời gian:</strong> ${escapeHtml(now)}</p>
        </div>
      `
    });

    return res.json({
      ok: true,
      profile: {
        id: profile.id,
        name: profile.name,
        avatar: avatarUrl
      }
    });
  } catch (error) {
    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      "Lỗi server";

    console.error("submit-profile error:", message);

    return res.status(500).json({
      ok: false,
      message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});