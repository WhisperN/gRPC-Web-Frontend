import { Schema } from "apache-arrow";

export function matchColumns(schema: Schema, keyword: string | RegExp): number[] {
    const re = typeof keyword === "string" ? new RegExp(keyword, "i") : keyword;
    const idx: number[] = [];
    for (let i=0; i<schema.fields.length; i++) {
        const name = schema.fields[i].name;
        if (re.test(name)) idx.push(i);
    }
    return idx;
}