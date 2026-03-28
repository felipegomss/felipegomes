const FETCH_TIMEOUT = 5000;

export async function githubFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}
