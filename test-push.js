const fs = require('fs');
const OneSignal = require('@onesignal/node-onesignal');

const envPath = '/home/tuncay/Projects/EMARKafe/.env';
const dotenvContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
dotenvContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
});

const ONESIGNAL_APP_ID = env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = env.ONESIGNAL_REST_API_KEY;

if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
  console.error("Missing OneSignal credentials in .env");
  process.exit(1);
}

async function testPush() {
  const appKeyProvider = { getToken() { return ONESIGNAL_REST_API_KEY; } };
  const configuration = OneSignal.createConfiguration({
    authMethods: { app_key: { tokenProvider: appKeyProvider } }
  });
  const client = new OneSignal.DefaultApi(configuration);

  const notification = new OneSignal.Notification();
  notification.app_id = ONESIGNAL_APP_ID;
  // Send to all subscribers for a quick test
  notification.included_segments = ['Subscribed Users'];
  notification.headings = { en: "Test Bildirimi", tr: "Test Bildirimi" };
  notification.contents = { en: "OneSignal entegrasyonu başarıyla tamamlandı! 🚀", tr: "OneSignal entegrasyonu başarıyla tamamlandı! 🚀" };
  
  try {
    const response = await client.createNotification(notification);
    console.log(`✅ Broadcast notification sent successfully. ID: ${response.id}`);
    console.log("Not: Eğer hiç aboneniz yoksa (hedef kitle 0 ise), OneSignal yine de ID döner ancak kimseye gitmez.");
  } catch (error) {
    console.error('❌ Failed to send OneSignal notification:');
    console.error(error.message || error);
  }
}

testPush();
