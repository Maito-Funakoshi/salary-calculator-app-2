# 給料計算機 version 2
googleログイン機能を搭載し、アカウントごとにシフトデータを保存する

## firebaseでの設定
忘れたから何かあった時はとりあえず[ここ](https://console.firebase.google.com/u/0/project/salary-calculator-app-2/overview)を見ること

ルートディレクトリに.env.localを作成する必要がある
/.env.localには[ここのページ](https://console.firebase.google.com/u/0/project/salary-calculator-app-2/settings/general/web:MmIyM2I1ODAtMGQzYy00ZjQ0LTg3YzUtNGI1NDJiYzc5ZDE3)をスクロールしたところにある各種情報を以下のように記入すれば多分良い
- NEXT_PUBLIC_FIREBASE_API_KEY=(firebaseConfigのapiKey)
- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=(firebaseConfigのauthDomain)
- NEXT_PUBLIC_FIREBASE_PROJECT_ID=(firebaseConfigのprojectId)
- NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=(firebaseConfigのstorageBucket)
- NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=(firebaseConfigのmessagingSenderId)
- NEXT_PUBLIC_FIREBASE_APP_ID=(firebaseConfigのappId)
- NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=(firebaseConfigのmeasurementId) 
