import { createServerClient } from '@supabase/ssr';
import type { TypedSupabaseClient } from '@bananasbindery/api-client/types';
import { cookies } from 'next/headers';

type EmptyQueryResult = { data: never[]; error: null; count: number };
type EmptySingleResult = { data: null; error: null };

type EmptyQuery = PromiseLike<EmptyQueryResult> & {
  select: (...args: unknown[]) => EmptyQuery;
  order: (...args: unknown[]) => EmptyQuery;
  eq: (...args: unknown[]) => EmptyQuery;
  neq: (...args: unknown[]) => EmptyQuery;
  in: (...args: unknown[]) => EmptyQuery;
  contains: (...args: unknown[]) => EmptyQuery;
  gt: (...args: unknown[]) => EmptyQuery;
  gte: (...args: unknown[]) => EmptyQuery;
  lt: (...args: unknown[]) => EmptyQuery;
  lte: (...args: unknown[]) => EmptyQuery;
  limit: (...args: unknown[]) => EmptyQuery;
  range: (...args: unknown[]) => EmptyQuery;
  insert: (...args: unknown[]) => EmptyQuery;
  update: (...args: unknown[]) => EmptyQuery;
  upsert: (...args: unknown[]) => EmptyQuery;
  delete: (...args: unknown[]) => EmptyQuery;
  single: () => Promise<EmptySingleResult>;
  maybeSingle: () => Promise<EmptySingleResult>;
};

function createEmptyQuery(): EmptyQuery {
  const listResult: EmptyQueryResult = { data: [], error: null, count: 0 };
  const singleResult: EmptySingleResult = { data: null, error: null };
  const query = {} as EmptyQuery;
  const chain = () => query;

  Object.assign(query, {
    select: chain,
    order: chain,
    eq: chain,
    neq: chain,
    in: chain,
    contains: chain,
    gt: chain,
    gte: chain,
    lt: chain,
    lte: chain,
    limit: chain,
    range: chain,
    insert: chain,
    update: chain,
    upsert: chain,
    delete: chain,
    single: async () => singleResult,
    maybeSingle: async () => singleResult,
    then: (
      onfulfilled?: ((value: EmptyQueryResult) => unknown) | null,
      onrejected?: ((reason: unknown) => unknown) | null,
    ) => Promise.resolve(listResult).then(onfulfilled, onrejected),
  });

  return query;
}

function createBuildTimeClient(): TypedSupabaseClient {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => createEmptyQuery(),
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: null, error: null }),
      }),
    },
  } as unknown as TypedSupabaseClient;
}

export async function createClient(): Promise<TypedSupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createBuildTimeClient();
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  });
}
