import { injectable } from 'tsyringe';
import { supabaseAdmin } from '../../config/supabase';

export interface ChatMessage {
  role: 'user' | 'model' | 'assistant';
  content: string;
}

export interface SuggestedProduct {
  id: string;
  name: string;
  price: number;
  icon: string;
  category: string;
  reason?: string;
}

export interface ChatResponse {
  reply: string;
  suggestedProducts: SuggestedProduct[];
  quickReplies: string[];
}

@injectable()
export class ChatService {
  /**
   * Process a chat message with AI Barista reasoning
   */
  async processMessage(
    userMessage: string,
    history: ChatMessage[] = [],
    _userId?: string,
    _branchId?: string
  ): Promise<ChatResponse> {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    // Fetch active menu products for recommendation context
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name, base_price, description, categories(name)')
      .eq('is_active', true);

    const defaultCatalog = [
      { id: '11111111-1111-1111-1111-111111111101', name: 'Doppio', base_price: 65, categories: { name: 'Sıcak Kahve' } },
      { id: '11111111-1111-1111-1111-111111111102', name: 'Flat White', base_price: 80, categories: { name: 'Sıcak Kahve' } },
      { id: '11111111-1111-1111-1111-111111111103', name: 'Brownie', base_price: 85, categories: { name: 'Tatlı' } },
      { id: '11111111-1111-1111-1111-111111111104', name: 'San Sebastian Cheesecake', base_price: 95, categories: { name: 'Tatlı' } },
      { id: '11111111-1111-1111-1111-111111111105', name: 'Cold Brew', base_price: 85, categories: { name: 'Soğuk Kahve' } },
      { id: '11111111-1111-1111-1111-111111111106', name: 'Iced Karamel Macchiato', base_price: 90, categories: { name: 'Soğuk Kahve' } },
      { id: '11111111-1111-1111-1111-111111111107', name: 'Latte', base_price: 75, categories: { name: 'Sıcak Kahve' } },
      { id: '11111111-1111-1111-1111-111111111108', name: 'Filtre Kahve', base_price: 60, categories: { name: 'Sıcak Kahve' } },
    ];

    const menuList = products && products.length > 0 ? products : defaultCatalog;

    if (geminiApiKey && geminiApiKey.trim().length > 0) {
      try {
        return await this.callGemini(userMessage, history, menuList, geminiApiKey);
      } catch (err) {
        console.error('Gemini API call failed, falling back to local barista engine:', err);
      }
    }

    // Local AI Barista Sommelier Engine (Fast, zero-cost, 100% reliable)
    return this.localBaristaEngine(userMessage, menuList);
  }

  private async callGemini(
    userMessage: string,
    history: ChatMessage[],
    products: any[],
    apiKey: string
  ): Promise<ChatResponse> {
    const systemInstruction = `Sen EMAR Kafe'nin samimi, esprili ve uzman AI Baristasısın ☕.
Görevin müşterilere damak zevklerine göre kahve ve tatlı önermek, menümüzdeki ürünleri tanıtmak ve kahve kültürünü anlatmak.
Menümüzdeki gerçek ürünler şunlardır:
${products.map(p => `- ${p.name} (${p.categories?.name || 'Kahve'}): ${p.base_price}₺, Açıklama: ${p.description || ''}, ID: ${p.id}`).join('\n')}

Kurallar:
1. Türkçe yanıt ver, sıcak ve pozitif bir barista dili kullan.
2. Öneri yaparken menümüzdeki ürünlerin birebir tam isimlerini kullan.
3. Yanıtında eğer menüden spesifik ürünler önerdiysen, yanıtın en sonuna şu formatta bir JSON bloğu ekle:
\`\`\`json
{"suggestedProductIds": ["ürün-id-1", "ürün-id-2"], "quickReplies": ["Sıcak bir şey öner", "Tatlı ne var?", "Sepetime ekle"]}
\`\`\`
`;

    const contents = [
      { role: 'user', parts: [{ text: systemInstruction }] },
      { role: 'model', parts: [{ text: 'Anladım! EMAR Kafe müşterilerine harika öneriler sunmaya hazırım ☕' }] },
      ...history.slice(-6).map(h => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: h.content }]
      })),
      { role: 'user', parts: [{ text: userMessage }] }
    ];

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
        }
      })
    });

    if (!res.ok) {
      throw new Error(`Gemini HTTP error ${res.status}`);
    }

    const data = await res.json() as any;
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Extract JSON block if present
    let reply = rawText;
    let suggestedProductIds: string[] = [];
    let quickReplies: string[] = ['☕ Sıcak Kahve', '🧊 Soğuk Kahve', '🍰 Tatlılar'];

    const jsonMatch = rawText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (Array.isArray(parsed.suggestedProductIds)) {
          suggestedProductIds = parsed.suggestedProductIds;
        }
        if (Array.isArray(parsed.quickReplies)) {
          quickReplies = parsed.quickReplies;
        }
        reply = rawText.replace(/```json[\s\S]*?```/, '').trim();
      } catch (_) {}
    }

    const suggestedProducts: SuggestedProduct[] = products
      .filter(p => suggestedProductIds.includes(p.id))
      .map(p => ({
        id: p.id,
        name: p.name,
        price: Number(p.base_price || 0),
        icon: this.getProductIcon(p.name, p.categories?.name),
        category: p.categories?.name || 'Kahve',
      }));

    return {
      reply,
      suggestedProducts,
      quickReplies,
    };
  }

  private localBaristaEngine(userMessage: string, products: any[]): ChatResponse {
    const q = userMessage.toLowerCase();
    let reply = '';
    const suggested: any[] = [];
    let quickReplies = ['☕ Ne içmeliyim?', '🍰 Tatlı öner', '⚡ Sert bir kahve', '🧊 Soğuk kahve'];

    // 1. Sert / Uykusuzluk / Güçlü Kafein
    if (q.includes('sert') || q.includes('uyku') || q.includes('enerji') || q.includes('ayıl') || q.includes('yoğun')) {
      reply = 'Uykunu anında açacak ve sana tam enerji verecek sert bir kahve arıyorsan, kesinlikle **Doppio** (çift shot espresso) veya sütlü ama sert olan **Flat White** öneririm! ⚡';
      const doppio = products.find(p => p.name.toLowerCase().includes('doppio')) || products.find(p => p.name.toLowerCase().includes('espresso'));
      const flatWhite = products.find(p => p.name.toLowerCase().includes('flat white')) || products.find(p => p.name.toLowerCase().includes('cortado'));
      if (doppio) suggested.push(doppio);
      if (flatWhite) suggested.push(flatWhite);
      quickReplies = ['🍰 Yanına tatlı öner', '🧊 Soğuk bir şey var mı?', '☕ Filtre kahve nasıl?'];
    }
    // 2. Tatlı / Pasta / Çikolata
    else if (q.includes('tatlı') || q.includes('pasta') || q.includes('çikolata') || q.includes('açım') || q.includes('kek')) {
      reply = 'Tatlı krizine birebir! Fırından yeni çıkmış sıcacık yoğun çikolatalı **Brownie** veya enfes akışkan kremasıyla **San Sebastian Cheesecake** kahvenin yanına harika gider 🍰✨';
      const brownie = products.find(p => p.name.toLowerCase().includes('brownie'));
      const cheesecake = products.find(p => p.name.toLowerCase().includes('sebastian')) || products.find(p => p.name.toLowerCase().includes('cheesecake')) || products.find(p => p.name.toLowerCase().includes('macaron'));
      if (brownie) suggested.push(brownie);
      if (cheesecake) suggested.push(cheesecake);
      quickReplies = ['☕ Hangi kahveyle gider?', '🍰 Başka tatlı var mı?', '🎁 Kampanya var mı?'];
    }
    // 3. Soğuk Kahve / Ferahlatıcı / Sıcak hava
    else if (q.includes('soğuk') || q.includes('sıcak') || q.includes('ice') || q.includes('ferah') || q.includes('yaz')) {
      reply = 'Ferahlamak için 18 saat soğuk demlenmiş kadifemsi **Cold Brew** veya tatlı karamel dokunuşlu **Iced Karamel Macchiato** tam sana göre! 🧊';
      const coldBrew = products.find(p => p.name.toLowerCase().includes('cold brew'));
      const icedLatte = products.find(p => p.name.toLowerCase().includes('iced') || p.name.toLowerCase().includes('frappe'));
      if (coldBrew) suggested.push(coldBrew);
      if (icedLatte) suggested.push(icedLatte);
      quickReplies = ['☕ Sıcak kahve öner', '🍰 Yanına tatlı ne gider?', '📍 Şubede var mı?'];
    }
    // 4. Hafif / Sütlü / Yumuşak İçim
    else if (q.includes('hafif') || q.includes('sütlü') || q.includes('yumuşak') || q.includes('tatlımsı') || q.includes('latte')) {
      reply = 'Yumuşak ve kremamsı bir lezzet istiyorsan, ipeksi süt köpüğüyle **Latte** veya aromatik baharat dokunuşlu **Chai Latte** harika bir seçim olur ☕';
      const latte = products.find(p => p.name.toLowerCase().includes('latte'));
      const cappuccino = products.find(p => p.name.toLowerCase().includes('cappuccino')) || products.find(p => p.name.toLowerCase().includes('mocha'));
      if (latte) suggested.push(latte);
      if (cappuccino) suggested.push(cappuccino);
      quickReplies = ['⚡ Daha sert bir şey', '🍰 Tatlı öner', '🎁 Sadakat durumum'];
    }
    // 5. Sipariş / Kasa Durumu
    else if (q.includes('sipariş') || q.includes('nerede') || q.includes('hazır') || q.includes('durum')) {
      reply = 'Sipariş durumunu ve kalan hazırlık süresini Profilim > Sipariş Geçmişi sekmesinden canlı olarak takip edebilirsin. Siparişin hazır olduğunda telefonuna bildirim göndereceğiz! 📦🔔';
      quickReplies = ['☕ Yeni kahve öner', '🎁 Kaç yıldızım var?', '💳 Cüzdan bakiye'];
    }
    // 6. Sadakat / Bedava Kahve
    else if (q.includes('yıldız') || q.includes('bedava') || q.includes('sadakat') || q.includes('hediye') || q.includes('puan')) {
      reply = 'EMAR Kafe Sadakat Programı ile her 5 kahve siparişinde 1 kahve bizden hediye! 🎁 Profil sekmesinden kaç yıldızın kaldığını görebilir, sepette "1x Bedava Kahve Kullan" seçeneğini aktif edebilirsin.';
      quickReplies = ['☕ Kahve öner', '🍰 Tatlı öner', '📦 Sipariş ver'];
    }
    // 7. Genel / Selamlama / Varsayılan
    else {
      reply = 'Merhaba! Ben EMAR Kafe AI Baristanım ☕ Sana en uygun kahveyi seçebilir, tatlı eşleşmeleri önerebilir veya menümüz hakkında merak ettiğin her şeyi yanıtlayabilirim. Bugün damak tadın nasıl bir şey istiyor?';
      const filterCoffee = products.find(p => p.name.toLowerCase().includes('filtre')) || products[0];
      const latte = products.find(p => p.name.toLowerCase().includes('latte')) || products[1];
      if (filterCoffee) suggested.push(filterCoffee);
      if (latte) suggested.push(latte);
    }

    const suggestedProducts: SuggestedProduct[] = suggested.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.base_price || 0),
      icon: this.getProductIcon(p.name, p.categories?.name),
      category: p.categories?.name || 'Kahve',
      reason: 'Baristanın Özel Tavsiyesi',
    }));

    return {
      reply,
      suggestedProducts,
      quickReplies,
    };
  }

  private getProductIcon(name: string, category?: string): string {
    const n = name.toLowerCase();
    if (n.includes('tatlı') || n.includes('brownie') || n.includes('cheesecake') || n.includes('macaron') || category === 'Tatlı') {
      return '🍰';
    }
    if (n.includes('cold') || n.includes('iced') || n.includes('frappe') || category === 'Soğuk Kahve') {
      return '🧊';
    }
    return '☕';
  }
}
