import {Deck, _GlobeView, AmbientLight, _SunLight as SunLight, LightingEffect} from '@deck.gl/core';
import {GeoJsonLayer, ScatterplotLayer} from '@deck.gl/layers';

// --- viewState utils to prevent deck.gl assertion errors on interaction ---
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
function sanitizeViewState(vs: any) {
    const lon  = Number.isFinite(vs?.longitude) ? vs.longitude : 0;
    const lat  = Number.isFinite(vs?.latitude)  ? vs.latitude  : 0;
    const zoom = Number.isFinite(vs?.zoom)      ? vs.zoom      : 1.5;
    return {
        longitude: lon,
        latitude: clamp(lat, -85, 85),   // avoid pole singularities
        zoom: clamp(zoom, 0, 20)         // sensible bounds
    };
}

type Inputs = {
    container: HTMLDivElement;
    lon: Float64Array;          // Längengrad [deg]
    lat: Float64Array;          // Breitengrad [deg]
};

export function startGlobeScatter({container, lat, lon}: Inputs) {
    // 1) Zero-copy Datenadapter
    // assume both arrays have the samte length...

    const data = {
        length: lat.length,
        getPosition: (_: unknown, {index}: {index: number}) => {
            return [lon[index], lat[index]] as [number, number];
        }
    };

    // 2) Hintergrundlevel: Länder (leichtgewichtiges GeoJSON)
    const land = new GeoJsonLayer({
        id: 'earth-land',
        data: 'https://d2ad6b4ur7yvpq.cloudfront.net/naturalearth-3.3.0/ne_50m_land.geojson',
        filled: true,
        stroked: false,
        getFillColor: [70, 95, 115],
        parameters: {depthTest: false}
    });

    // 3) Punkte-Layer
    const points = new ScatterplotLayer({
        id: 'species',
        data,
        getPosition: (d, ctx) => data.getPosition!(d, ctx)!,
        radiusMinPixels: 1.5,
        radiusMaxPixels: 4,
        getFillColor: [236, 72, 153], // magenta
        pickable: true,
        onHover: ({x, y, object}) => {
            const tip = getTip();
            if (object) {
                tip.style.display = 'block';
                tip.style.left = `${x}px`;
                tip.style.top = `${y}px`;
                tip.textContent = 'plot';
            } else tip.style.display = 'none';
        }
    });

    // 4) Licht + Globe
    const lighting = new LightingEffect({
        ambientLight: new AmbientLight({intensity: 0.7}),
        sunLight: new SunLight({timestamp: Date.now(), intensity: 1.2})
    });

    const initialVS = sanitizeViewState({ latitude: 20, longitude: 120, zoom: 0.9 });
    let autorotate = true;
    let deck: Deck<_GlobeView>;

    deck = new Deck({
        parent: container,
        views: new _GlobeView(),
        controller: true,
        effects: [lighting],
        initialViewState: initialVS,
        onViewStateChange: ({viewState, interactionState}) => {
            const vs = sanitizeViewState(viewState);
            deck.setProps({ viewState: vs });
            const interacting = interactionState.isDragging || interactionState.isPanning ||
                interactionState.isZooming  || interactionState.isRotating;
            autorotate = !interacting;
        },
        layers: [land, points]
    });

    // optional: Autorotation über Longitude (GlobeView kennt kein rotationOrbit)
    // optional: Autorotation über Longitude (pausiert während Interaktion)
    (function spin() {
        if (autorotate) {
            const vs = sanitizeViewState((deck.props as any).viewState || initialVS);
            let lon = vs.longitude + 0.03;
            if (lon > 180) lon -= 360;
            deck.setProps({ viewState: { ...vs, longitude: lon } });
        }
        requestAnimationFrame(spin);
    })();

    return deck;
}

function getTip() {
    let el = document.getElementById('deck-tip') as HTMLDivElement | null;
    if (!el) {
        el = document.createElement('div') as HTMLDivElement;
        el.id = 'deck-tip';
        Object.assign(el.style, {
            position: 'absolute', zIndex: '10', background: 'rgba(0,0,0,0.7)',
            color: '#fff', padding: '4px 6px', borderRadius: '6px',
            pointerEvents: 'none', font: '12px system-ui', display: 'none'
        });
        document.body.appendChild(el);
    }
    return el;
}