// EMAR Kafe — Asistan Edge Function
//
// Uygulama bu fonksiyonu çağırır; Gemini API anahtarı yalnızca burada,
// sunucu tarafında bulunur ve hiçbir zaman tarayıcıya inmez.
//
// Gerekli secret:
//   supabase secrets set GEMINI_API_KEY=...
// İsteğe bağlı (model değiştirmek için):
//   supabase secrets set GEMINI_MODEL=gemini-2.5-flash

// Secret'lar modül yüklenirken değil, her istekte okunur. Aksi halde secret
// eklendiğinde hâlâ ayakta olan bir fonksiyon örneği eski (boş) değeri taşımaya
// devam eder ve secret eklenmiş gibi görünse de "tanımlı değil" hatası alınır.
const geminiApiKey = () => Deno.env.get("GEMINI_API_KEY");
// Not: bazı sürüme sabitlenmiş adlar (ör. gemini-2.5-flash) model listesinde
// görünmeye devam etse de generateContent çağrısında 404 verebiliyor.
// GEMINI_MODEL secret'ıyla geçersiz kılınabilir.
const geminiModel = () => Deno.env.get("GEMINI_MODEL") ?? "gemini-3.6-flash";

// Flutter web tarayıcıdan çağırdığı için CORS şart.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Turn = { role: "user" | "model"; text: string };
type MenuItem = { name: string; kind: string; price: number; rating: number };

function buildSystemPrompt(menu: MenuItem[]): string {
  const lines = menu
    .map((m) => `- ${m.name} (${m.kind}, ${m.price}₺, ★${m.rating})`)
    .join("\n");

  return `Sen EMAR Kafe'nin uygulama içi sipariş asistanısın. Türkçe, sıcak ve kısa
cevaplar ver (genelde 2-4 cümle). Görevin: müşterinin ruh haline, hava
durumuna, tatlı/acı tercihine göre menüden ürün önermek, ürünler hakkında
soruları yanıtlamak ve "yanında ne iyi gider" gibi eşleştirme önerileri
sunmak. Menüde olmayan bir şey önerme. Kendi başına sipariş oluşturamazsın;
önerdiğin ürünü sepete eklemesi için kullanıcıyı menüden seçim yapmaya
yönlendir. EMAR Kafe dışı konularda kısaca nazikçe konunun dışında
kaldığını belirt ve kafeyle ilgili konuya dön.

Güncel Menü:
${lines}`;
}

/// Bu anahtarın erişebildiği, metin üretebilen modelleri listeler.
/// Yalnızca teşhis amaçlı; model adı yanlış olduğunda çağrılır.
async function listModels(apiKey: string): Promise<string[] | string> {
  try {
    const res = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models",
      { headers: { "x-goog-api-key": apiKey } },
    );
    if (!res.ok) return `Model listesi alınamadı (HTTP ${res.status}).`;
    const data = await res.json();
    return (data?.models ?? [])
      .filter((m: { supportedGenerationMethods?: string[] }) =>
        m.supportedGenerationMethods?.includes("generateContent")
      )
      .map((m: { name: string }) => m.name.replace(/^models\//, ""));
  } catch (e) {
    return `Model listesi alınamadı: ${e}`;
  }
}

/// Gemini'den dönen HTTP durumunu kurulum sırasında işe yarar bir ipucuna çevirir.
function switchStatus(status: number): string {
  switch (status) {
    case 400:
      return "İstek reddedildi — model adı (GEMINI_MODEL) yanlış olabilir.";
    case 401:
    case 403:
      return "Anahtar geçersiz ya da yetkisiz — GEMINI_API_KEY'i kontrol et.";
    case 404:
      return `"${geminiModel()}" modeli bulunamadı. AI Studio'da görünen model adını GEMINI_MODEL secret'ına yaz.`;
    case 429:
      return "Ücretsiz kota doldu — bir süre bekle ya da kotayı yükselt.";
    default:
      return "Ayrıntı için Edge Function loglarına bak.";
  }
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Sadece POST destekleniyor." }, 405);
  }

  const apiKey = geminiApiKey();
  if (!apiKey) {
    // Hangi secret'ların göründüğünü de bildir — ad yanlış yazıldıysa buradan anlaşılır.
    const visible = Object.keys(Deno.env.toObject())
      .filter((k) => !k.startsWith("SUPABASE_"))
      .join(", ");
    return json({
      error: "GEMINI_API_KEY secret'ı tanımlı değil.",
      gorunen_secretlar: visible || "(hiçbiri)",
    }, 500);
  }

  let payload: { turns?: Turn[]; menu?: MenuItem[] };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Geçersiz JSON gövdesi." }, 400);
  }

  const turns = payload.turns ?? [];
  const menu = payload.menu ?? [];

  if (turns.length === 0) {
    return json({ error: "En az bir mesaj gerekli." }, 400);
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel()}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(menu) }] },
        contents: turns.map((t) => ({
          role: t.role,
          parts: [{ text: t.text }],
        })),
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const detail = await geminiResponse.text();
    console.error("Gemini hatası:", geminiResponse.status, detail);

    // Detayı istemciye sızdırma, ama kurulum sırasında teşhis edilebilsin diye
    // durum koduna göre ne yapılacağını söyle.
    const body: Record<string, unknown> = {
      error: "Asistan şu an yanıt veremiyor.",
      ipucu: switchStatus(geminiResponse.status),
    };

    // Model bulunamadıysa bu anahtarın erişebildiği modelleri listele —
    // doğru adı tahmin etmek yerine doğrudan görelim.
    if (geminiResponse.status === 404) {
      body.kullanilabilir_modeller = await listModels(apiKey);
    }

    return json(body, 502);
  }

  const data = await geminiResponse.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text ?? "")
      .join("")
      .trim();

  if (!text) {
    // Güvenlik filtresi ya da boş cevap.
    const reason = data?.candidates?.[0]?.finishReason ?? "bilinmiyor";
    console.warn("Boş cevap, finishReason:", reason);
    return json({ reply: "Bu isteği yanıtlayamadım, başka türlü sorar mısın?" });
  }

  return json({ reply: text });
});
