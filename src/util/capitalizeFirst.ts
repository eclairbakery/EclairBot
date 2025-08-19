export default function capitalizeFirst(text: string) {
    const base = text.toLowerCase();
    return base.charAt(0).toUpperCase() + base.slice(1);
}