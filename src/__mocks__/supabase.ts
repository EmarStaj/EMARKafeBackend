/**
 * Supabase client mock for unit tests.
 * Replaces both supabase (anon) and supabaseAdmin (service role) with jest mocks
 * so tests never touch a real database.
 */

// Builder pattern mock — mirrors Supabase's fluent query builder
const defaultReturnValue = { id: 'mock-user-id', role: 'customer', created_at: '2026-08-04T00:00:00Z' };
const buildQueryMock = (returnValue: unknown = defaultReturnValue) => {
  const builder: any = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: returnValue, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: returnValue, error: null }),
  };
  // Make the builder itself thenable (for awaiting the chain directly)
  builder.then = undefined;
  // Default resolved value for the whole chain
  Object.defineProperty(builder, Symbol.toPrimitive, { value: () => '[MockQueryBuilder]' });
  return builder;
};

export const mockQueryBuilder = buildQueryMock;

export const supabaseAdmin = {
  from: jest.fn(() => buildQueryMock()),
  auth: {
    admin: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
};

export const supabase = {
  from: jest.fn(() => buildQueryMock()),
  auth: {
    signUp: jest.fn().mockResolvedValue({ data: {}, error: null }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: { id: 'mock-user-id' }, session: { access_token: 'mock-token' } },
      error: null,
    }),
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'mock-user-id' } }, error: null }),
    admin: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
};

export const getSupabaseForUser = jest.fn(() => supabase);
