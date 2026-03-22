export interface RedditPost {
    title: string;
    body: string;
    comments: string[];
};

export async function fetchPost(url: string, maxComments: number = 5): Promise<RedditPost | null> {
    try {
        const res = await fetch(url + '.json', {
            headers: { 'User-Agent': 'eclairbot/1.0' }
        });

        if (!res.ok) return null;

        const data = await res.json();
        const post = data[0].data.children[0].data;

        return {
            title: post.title,
            body: post.selftext,
            comments: data[1].data.children
                .filter((c: { kind: string }) => c.kind == 't1')
                .slice(0, maxComments)
                .map((c: { data: { body: string } }) => c.data.body)
        };
    } catch {
        return null;
    }
}
