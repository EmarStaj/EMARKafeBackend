-- EMARKafe OneSignal Migration
-- 1. device_tokens tablosundaki 'fcm_token' sütununu 'onesignal_id' olarak yeniden adlandırır.

ALTER TABLE device_tokens 
RENAME COLUMN fcm_token TO onesignal_id;

-- 2. Eğer benzersizlik kısıtlaması (Unique Constraint) fcm_token ismine bağlıysa, onu da güncelleyelim.
-- Not: Supabase'de upsert onConflict için isim değiştirmeye gerek kalmayabilir ancak güvenceye alalım.
ALTER TABLE device_tokens
DROP CONSTRAINT IF EXISTS device_tokens_user_id_fcm_token_key;

ALTER TABLE device_tokens
ADD CONSTRAINT device_tokens_user_id_onesignal_id_key UNIQUE (user_id, onesignal_id);
