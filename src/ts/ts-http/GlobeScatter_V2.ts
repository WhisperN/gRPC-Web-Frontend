export async function fetchLatLonAsTypedArrays(
    conn: any,
    table: string,
    latCol = "Latitude",
    lonCol = "Longitude",
    where: string | null = null
): Promise<{ lat: Float64Array; lon: Float64Array }> {
    const sql = `
    SELECT CAST(${latCol} AS DOUBLE) AS lat,
           CAST(${lonCol} AS DOUBLE) AS lon
    FROM "${table}"
    ${where ? `WHERE ${where}` : ""}
  `;
    const res = await conn.query(sql);
    const rows = res.toArray();

    const n = rows.length;
    const lat = new Float64Array(n);
    const lon = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        const r = rows[i];
        lat[i] = Number.isFinite(r.lat) ? r.lat : 0;
        lon[i] = Number.isFinite(r.lon) ? r.lon : 0;
    }
    return { lat, lon };
}