import { Package } from './commonTypes.ts';

export default async function getDebianPackages(query: string): Promise<Package[]> {
    const debianResponse: { results: { exact: { name: string }, other: { name: string }[] } } = await (await fetch(`https://sources.debian.org/api/search/${encodeURIComponent(query)}`)).json();
    
    const allResults = [ debianResponse.results.exact, ...debianResponse.results.other ];

    return allResults.map((dp) => ({ name: dp.name, description: 'Unknown package description' }));
}
