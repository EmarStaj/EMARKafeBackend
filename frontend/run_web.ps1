# EMAR Kafe — Supabase bağlantılı web sürümünü çalıştırır.
#
# Kullanım:
#   .\run_web.ps1
#
# Değerler ortam değişkenlerinden okunur; yoksa aşağıdaki varsayılanlar
# kullanılır. Anon key istemciye açık olacak şekilde tasarlanmıştır, gizli
# değildir. service_role key'i ASLA buraya koyma.

$SupabaseUrl = if ($env:SUPABASE_URL) { $env:SUPABASE_URL } else {
  "https://ngcrtjqmeuskwnkafccu.supabase.co"
}
$SupabaseAnonKey = if ($env:SUPABASE_ANON_KEY) { $env:SUPABASE_ANON_KEY } else {
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY3J0anFtZXVza3dua2FmY2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3MzQwNjgsImV4cCI6MjEwMTMxMDA2OH0.gNGi67G0b2_5pkvXAtNpVblklgA-ZBr7-t66ZJN06oc"
}

flutter run -d web-server --web-port=8765 --web-hostname=localhost `
  --dart-define=SUPABASE_URL=$SupabaseUrl `
  --dart-define=SUPABASE_ANON_KEY=$SupabaseAnonKey
