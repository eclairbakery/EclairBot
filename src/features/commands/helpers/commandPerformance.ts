export const commandPerformance: number[] = [];
export let commandPerformanceNumber = 0;

export function addCommandPerformanceEntry(start: number, end: number) {
    let eta = end - start;

    commandPerformance.push(eta);
    commandPerformanceNumber += 1;
}