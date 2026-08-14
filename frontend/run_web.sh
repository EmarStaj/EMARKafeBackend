#!/bin/bash
# EMAR Kafe — Supabase bağlantılı web sürümünü çalıştırır (Linux/macOS).

SUPABASE_URL=${SUPABASE_URL:-"https://ngcrtjqmeuskwnkafccu.supabase.co"}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY:-"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY3J0anFtZXVza3dua2FmY2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzQwNjgsImV4cCI6MjEwMTMxMDA2OH0.gNGi67G0b2_5pkvXAtNpVblklgA-ZBr7-t66ZJN06oc"}

echo "🌍 EMAR Kafe Web Sürümü (Chrome) Başlatılıyor..."
flutter run -d chrome \
  --dart-define=SUPABASE_URL="$SUPABASE_URL" \
  --dart-define=SUPABASE_ANON_KEY="$SUPABASE_ANON_KEY"
