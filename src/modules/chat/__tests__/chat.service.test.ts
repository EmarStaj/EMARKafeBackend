import 'reflect-metadata';
import { ChatService } from '../chat.service';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    service = new ChatService();
  });

  it('should recommend strong coffee for sleep/energy queries', async () => {
    const result = await service.processMessage('Bugün çok uykusuzum sert bir şey öner');
    expect(result.reply).toBeDefined();
    expect(result.reply.toLowerCase()).toContain('doppio');
    expect(result.suggestedProducts.length).toBeGreaterThan(0);
    expect(result.quickReplies.length).toBeGreaterThan(0);
  });

  it('should recommend desserts for sweet cravings', async () => {
    const result = await service.processMessage('Tatlı krizindeyim ne önerirsin?');
    expect(result.reply).toBeDefined();
    expect(result.reply.toLowerCase()).toContain('brownie');
    expect(result.suggestedProducts.length).toBeGreaterThan(0);
  });

  it('should recommend cold coffee for cold/hot weather queries', async () => {
    const result = await service.processMessage('Hava çok sıcak buzlu bir kahve var mı?');
    expect(result.reply).toBeDefined();
    expect(result.reply.toLowerCase()).toContain('cold brew');
    expect(result.suggestedProducts.length).toBeGreaterThan(0);
  });

  it('should explain loyalty program for loyalty queries', async () => {
    const result = await service.processMessage('Kaç bedava kahvem var?');
    expect(result.reply).toBeDefined();
    expect(result.reply.toLowerCase()).toContain('sadakat');
  });

  it('should return polite general greeting for generic queries', async () => {
    const result = await service.processMessage('Merhaba');
    expect(result.reply).toBeDefined();
    expect(result.reply.toLowerCase()).toContain('emar kafe');
  });
});
