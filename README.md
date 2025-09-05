# DESERT ZEN

This react native x expo app was originally developed as a mobile app for android / iphone; once the client decided to add the content behind a paywall and found out that the App Stores take 30% , she decided instead to just go with a browser based website ( https://desert-zenmeditations.com). This repo is in case in the future she decides to develop the app, even if its an android only apk file, the work we have done will be saved (although it will likely be very out of date and have to be rebuild anyway, some of the files may still be helpful like the colors etc).

## bolt-desertZen-20250620

(https://stackblitz.com/~/github.com/clevermissfox/bolt-desertZen-20250620)

## EAS Build

- Android, Preview - `eas build --platform android --profile preview`

## Set secrets for PROD (these are encrypted and secure)

npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_supabase_url"
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_supabase_anon_key"

## or in EAS use the references instead

"env": {
"EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
}

## update dependancies

`npx expo install --check`

## Repo

https://github.com/clevermissfox/bolt-desertZen-20250620
