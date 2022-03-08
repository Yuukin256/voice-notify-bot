# voice-notify-bot

Discord サーバー上のボイスチャンネルで通話が始まった際に通知を送信する Bot です。

現在、招待 URL の公開は行っておりません。ご自身で起動してお使いください。

## Development / Hosting

Docker 環境が必要です。各自でインストールしてください。

```
$ git clone https://github.com/Yuukin256/voice-notify-bot.git
```

[Discord Developer Portal](https://discord.com/developers/applications) で Bot アカウントを作成し、`.env.example` ファイルにならって `.env` ファイルに Bot のトークンを記入してください。

```
$ docker compose up -d
```

起動完了です。
