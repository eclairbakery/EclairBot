import process from "node:process";
import logError from '@/util/logError.ts';
const BaseUrl = 'https://api.github.com';

export class GithubError extends Error {}

export type Repo = {
    owner: string;
    repo: string;
    branch?: string; // default: main
};

let token: string | null;

export async function init(tok?: string) {
    token = tok ?? process.env.EB_GITHUB_TOKEN ?? null;
}

async function request(url: string, method?: string) {
    const res = await fetch(url, {
        headers: {
            Accept: 'application/vnd.github+json',
            ...(token && {
                Authorization: `Bearer ${token}`,
            }),
        },
        ...(method ? { method } : {})
    });

    if (!res.ok && res.status !== 404) {
        const text = await res.text();
        throw new GithubError(`GitHub API error: ${res.status} ${text}`);
    }

    const resp = await res.text();
    let resps = {};
    if (resp.trim() == '') resps = {};
    else resps = JSON.parse(resp);
    
    // deno-lint-ignore no-explicit-any
    return { ...resps, httpResponseCode: res.status } as Record<PropertyKey, any> & { httpResponseCode: number };
}

function shouldIgnore(path: string): boolean {
    const ignored = [
        'node_modules/',
        '.git/',
        'dist/',
        'build/',
        '.next/',
        'coverage/',
        'package-lock.json',
        'yarn.lock',
        'pnpm-lock.yaml',
    ];

    return ignored.some((i) => path.includes(i));
}

function getBranch(ref: Repo) {
    return ref.branch ?? 'main';
}

export async function getRepoTree(ref: Repo): Promise<string[]> {
    const branch = getBranch(ref);

    const data = await request(
        `${BaseUrl}/repos/${ref.owner}/${ref.repo}/git/trees/${branch}?recursive=1`,
    );

    return data.tree
        .filter((item: { type: string }) => item.type == 'blob')
        .map((item: { path: string }) => item.path)
        .filter((path: string) => !shouldIgnore(path));
}

export async function getFileContent(ref: Repo, path: string): Promise<string> {
    const branch = getBranch(ref);
    const url = `https://raw.githubusercontent.com/${ref.owner}/${ref.repo}/${branch}/${path}`;
    const res = await fetch(url);

    if (!res.ok) {
        throw new GithubError(`Failed to fetch file: ${path}`);
    }

    return res.text();
}

export async function search(ref: Repo, query: string) {
    const q = encodeURIComponent(`${query} repo:${ref.owner}/${ref.repo}`);
    const data = await request(
        `${BaseUrl}/search/code?q=${q}`,
    );

    return data.items.map((item: { path: string; html_url: string }) => ({
        path: item.path,
        url: item.html_url,
    }));
}

export async function getReadme(ref: Repo): Promise<string> {
    const possiblePaths = ['README.md', 'readme.md', 'README'];

    for (const path of possiblePaths) {
        try {
            return await getFileContent(ref, path);
        } catch (_) {}
    }

    throw new GithubError('README not found');
}

async function starred(org: string, repo: string) {
    return (await request(`${BaseUrl}/user/starred/${org}/${repo}`)).httpResponseCode == 204;
}

export async function starRepository(org: string, repo: string, unstar = false): Promise<boolean> {
    try {
        if (await starred(org, repo) == true) return false;
        await request(`${BaseUrl}/user/starred/${org}/${repo}`, unstar ? "DELETE" : "PUT");
    } catch (e) {
        logError('stdwarn', e, "GitHub repo starring service");
        return false;
    }
    return true;
}
