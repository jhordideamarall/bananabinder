'use client';

/**
 * Helper component to dynamically update document.title on the client.
 * In React 19 / Next.js 15, simply rendering a <title> tag inside
 * any component will automatically hoist it to the <head>.
 */
export function PageTitle({ title }: { title: string }) {
  return <title>{`${title} | Bananasbindery`}</title>;
}
