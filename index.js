require("dotenv").config();

const fs = require("fs");
const puppeteer = require("puppeteer");
const looksSame = require("looks-same");
const nodemailer = require("nodemailer");

const SCREENSHOT_LAST = "screenshot-last.png";
const SCREENSHOT_CURRENT = "screenshot-current.png";
const SCREENSHOT_DIFF = "screenshot-diff.png";

const [, , url] = process.argv;

process.on("uncaughtException", (error) => {
  console.error(error);
  process.exit(1);
});

const transporter = nodemailer.createTransport({
  host: "smtp.mail.ru",
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// TODO: run periodically
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // TODO: retry multiple times and exit if error will persist
  // TODO: handle HTTP statuses (404, 500)
  await page.goto(url);

  if (!fs.existsSync(SCREENSHOT_LAST)) {
    await page.screenshot({ path: SCREENSHOT_LAST });
    await browser.close();

    // TODO: restart process
    return;
  }

  await page.screenshot({ path: SCREENSHOT_CURRENT });
  await browser.close();

  const result = await new Promise((resolve, reject) => {
    looksSame(SCREENSHOT_LAST, SCREENSHOT_CURRENT, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });

  if (!result.equal) {
    await new Promise((resove, reject) => {
      looksSame.createDiff(
        {
          reference: SCREENSHOT_LAST,
          current: SCREENSHOT_CURRENT,
          diff: SCREENSHOT_DIFF,
        },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resove();
          }
        }
      );
    });

    // TODO: should it be handled somehow?
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      subject: "Changes Detected",
      text: "Here you go:",
      attachments: [
        {
          filename: SCREENSHOT_DIFF,
          content: fs.createReadStream(SCREENSHOT_DIFF),
        },
      ],
    });

    fs.renameSync(SCREENSHOT_CURRENT, SCREENSHOT_LAST);
  }
})();
