require("dotenv").config();

const fs = require("fs");
const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const looksSame = require("looks-same");

const SCREENSHOT_LAST = "screenshot-last.png";
const SCREENSHOT_CURRENT = "screenshot-current.png";
const SCREENSHOT_DIFF = "screenshot-diff.png";

const URL = `https://www.mvideo.ru/products/igrovaya-konsol-sony-playstation-5-40073270`;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(URL);

  if (!fs.existsSync(SCREENSHOT_LAST)) {
    await page.screenshot({ path: SCREENSHOT_LAST });
    await browser.close();
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

  console.log(result);

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

    const transporter = nodemailer.createTransport({
      host: "smtp.mail.ru",
      port: 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: "xak4444@mail.ru", // sender address
      to: "k.serjey@gmail.com", // list of receivers
      subject: "Changes Detected", // Subject line
      text: "Here you go:", // plain text body
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
