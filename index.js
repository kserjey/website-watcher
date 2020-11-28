const puppeteer = require("puppeteer");
const nodemailer = require("nodemailer");
const looksSame = require("looks-same");
const fs = require("fs");
const { deepStrictEqual } = require("assert");

const SCREENSHOT = "screenshot.png";
const CURRENT_SCREENSHOT = "screenshot-current.png";
const DIFF = "diff.png";
const URL = `https://www.mvideo.ru/products/igrovaya-konsol-sony-playstation-5-40073270`;
// const URL = `https://github.com/gemini-testing/looks-same`;

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(URL);

  if (!fs.existsSync(SCREENSHOT)) {
    await page.screenshot({ path: SCREENSHOT });
    await browser.close();
    return;
  }

  await page.screenshot({ path: CURRENT_SCREENSHOT });
  await browser.close();

  const result = await new Promise((resolve, reject) => {
    looksSame(SCREENSHOT, CURRENT_SCREENSHOT, (error, result) => {
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
          reference: SCREENSHOT,
          current: CURRENT_SCREENSHOT,
          diff: DIFF,
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
        user: "xak4444@mail.ru",
        pass: "baVA142sfX",
      },
    });

    const info = await transporter.sendMail({
      from: "xak4444@mail.ru", // sender address
      to: "k.serjey@gmail.com", // list of receivers
      subject: "Changes Detected", // Subject line
      text: "Here you go:", // plain text body
      attachments: [
        {
          filename: DIFF,
          content: fs.createReadStream(DIFF),
        },
      ],
    });

    fs.renameSync(CURRENT_SCREENSHOT, SCREENSHOT);
  }
})();
