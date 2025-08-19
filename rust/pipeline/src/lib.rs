use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

/* PlotObservationID    = id    unsigned integer
 * Biome                = b     string
 * Longitude            = lon   double
 * Latitude             = lat   double
 * Species              = s     string
 * Relative_cover      = rc     double
 */
#[wasm_bindgen]
pub fn find_species(id: &[u32], b: &str, lon: &[f32], lat: &[f32], s: &str, rc: &[f32]) -> Vec<u32> {
}