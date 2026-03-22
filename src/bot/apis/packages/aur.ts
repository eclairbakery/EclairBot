import { Package } from './commonTypes.ts';

export default async function getAurPackages(query: string): Promise<Package[]> {
    const res = await fetch(
        `https://aur.archlinux.org/rpc/?v=5&type=search&arg=${encodeURIComponent(query)}`,
    );
    const data = await res.json();

    return data.results.map((pkg: { Name: string; Description: string; }) => ({
        name: pkg.Name,
        description: pkg.Description,
    }));
}
