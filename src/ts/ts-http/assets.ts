export function toPlain(result: any): any[] {
    // Spaltennamen aus dem DuckDB-Result ziehen
    const cols = result?.schema?.fields?.map((f: any) => f.name) ?? [];
    const rows = result.toArray();

    if (cols.length === 0) {
        // Fallback: flaches Spread der Proxy-Objekte (für einfache Typen ok)
        // @ts-ignore
        return rows.map((r: any) => ({ ...r }));
    }
    // Sauber: pro Zeile ein Plain-Object mit allen Spalten
    return rows.map((r: any) => Object.fromEntries(cols.map((c: string) => [c, r[c]])));
}