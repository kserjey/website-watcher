# site-watcher

Simple script to watch website content changes. It was created to help me buing PS5, but I think there could be other usecases like watching price. I haven't finished it yet, but someday it might happen. It's lack one main feature to work properly - periodically runs.

For setting it up you need to create .env file and define next variables:

- EMAIL_USER - mail.ru username account
- EMAIL_PASS - mail.ru username password
- EMAIL_TO - email that will accept notification and diff screenshot

If you want to use another SMTP provider you could change it in `createTransport` config.

Then you could run it with URL you want to watch:

```bash
nodejs index.js https://www.mvideo.ru/products/igrovaya-konsol-sony-playstation-5-40073270
```
