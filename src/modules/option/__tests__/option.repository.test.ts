import { OptionRepository } from '../option.repository';
import { supabaseAdmin } from '../../../config/supabase';

jest.mock('../../../config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  }
}));

describe('OptionRepository', () => {
  let repository: OptionRepository;

  beforeEach(() => {
    repository = new OptionRepository();
    jest.clearAllMocks();
  });

  it('getProductOptions', async () => {
    (supabaseAdmin.from as jest.Mock)().eq.mockResolvedValue({ data: [], error: null });
    expect(await repository.getProductOptions('p1')).toEqual([]);
  });

  it('getProductOptions error', async () => {
    (supabaseAdmin.from as jest.Mock)().eq.mockResolvedValue({ data: null, error: new Error('err') });
    await expect(repository.getProductOptions('p1')).rejects.toThrow('err');
  });

  it('createOption', async () => {
    (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: { id: 'o1' }, error: null });
    expect(await repository.createOption({ product_id: 'p1', name: 'n1' })).toEqual({ id: 'o1' });
  });

  it('createOption error', async () => {
    (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: null, error: new Error('err') });
    await expect(repository.createOption({ product_id: 'p1', name: 'n1' })).rejects.toThrow('err');
  });

  it('createOptionValue', async () => {
    (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: { id: 'v1' }, error: null });
    expect(await repository.createOptionValue({ option_id: 'o1', label: 'l1' })).toEqual({ id: 'v1' });
  });

  it('createOptionValue error', async () => {
    (supabaseAdmin.from as jest.Mock)().single.mockResolvedValue({ data: null, error: new Error('err') });
    await expect(repository.createOptionValue({ option_id: 'o1', label: 'l1' })).rejects.toThrow('err');
  });

  it('deleteOption', async () => {
    (supabaseAdmin.from as jest.Mock)().eq.mockResolvedValue({ error: null });
    await expect(repository.deleteOption('o1')).resolves.toBeUndefined();
  });

  it('deleteOption error', async () => {
    (supabaseAdmin.from as jest.Mock)().eq.mockResolvedValue({ error: new Error('err') });
    await expect(repository.deleteOption('o1')).rejects.toThrow('err');
  });

  it('deleteOptionValue', async () => {
    (supabaseAdmin.from as jest.Mock)().eq.mockResolvedValue({ error: null });
    await expect(repository.deleteOptionValue('v1')).resolves.toBeUndefined();
  });

  it('deleteOptionValue error', async () => {
    (supabaseAdmin.from as jest.Mock)().eq.mockResolvedValue({ error: new Error('err') });
    await expect(repository.deleteOptionValue('v1')).rejects.toThrow('err');
  });
});
