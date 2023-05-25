export async function load({ params }): Promise<{ content: unknown; title: string; date: string }> {
  const post = await import(`../posts/${params.slug}.md`);
  const { title, date } = post.metadata;
  const content = post.default;

  return {
    content,
    title,
    date,
  }
}
