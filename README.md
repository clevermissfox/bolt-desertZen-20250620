# bolt-desertZen-20250620

[Edit in StackBlitz next generation editor ⚡️](https://stackblitz.com/~/github.com/clevermissfox/bolt-desertZen-20250620)

# Set secrets for PROD (these are encrypted and secure)

npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "your_supabase_url"
npx eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your_supabase_anon_key"

## or in EAS use the references instead

"env": {
"EXPO_PUBLIC_SUPABASE_URL": "$EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "$EXPO_PUBLIC_SUPABASE_ANON_KEY"
}

## update dependancies

`npx expo install --check`
