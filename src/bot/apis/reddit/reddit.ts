import { output } from '@/bot/logging.ts';

export interface RedditPost {
    title: string;
    body: string;
    comments: string[];
}

export async function fetchPost(url: string, maxComments: number = 5): Promise<RedditPost | null> {
    try {
        const initialRes = await fetch(url, {
            headers: { 'User-Agent': 'eclairbot/1.0' },
        });
        if (!initialRes.ok) return null;

        const resolved = new URL(initialRes.url);
        resolved.search = '';
        resolved.pathname = resolved.pathname.replace(/\/$/, '') + '.json';

        const jsonRes = await fetch(resolved.toString(), {
            headers: { 'User-Agent': 'eclairbot/1.0' },
        });
        if (!jsonRes.ok) return null;

        const data = await jsonRes.json();
        const post = data[0].data.children[0].data;

        return {
            title: post.title,
            body: post.selftext,
            comments: data[1].data.children
                .filter((c: { kind: string }) => c.kind == 't1')
                .slice(0, maxComments)
                .map((c: { data: { body: string } }) => c.data.body),
        };
    } catch (err) {
        output.err(err);
        return null;
    }
}
