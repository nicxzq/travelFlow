'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import type { EventCategory } from '@/lib/domain/trip';
import type { JourneyStop, LatLng, TransportMode } from '@/lib/domain/journey';
import { selectCoreStops } from '@/lib/journey/viewport';

export type BaseLayerId = 'osm' | 'satellite';

export type JourneyMapController = {
  setVehicle: (position: LatLng | null, mode: TransportMode) => void;
  setProgress: (segmentIndex: number, traveled: LatLng[]) => void;
  setRouteGeometry: (paths: LatLng[][]) => void;
  setBaseLayer: (layer: BaseLayerId) => void;
  fitCore: () => void;
  fitAll: () => void;
  followVehicle: (position: LatLng) => void;
  invalidate: () => void;
};

type JourneyMapCanvasProps = {
  stops: JourneyStop[];
  segmentModes: TransportMode[];
  activeStopIndex: number;
  controllerRef: MutableRefObject<JourneyMapController | null>;
  onReady?: () => void;
  onStopSelect?: (index: number) => void;
  className?: string;
};

const KIND_COLORS: Record<EventCategory, string> = {
  spot: '#059669',
  food: '#f59e0b',
  hotel: '#7c3aed',
  transport: '#0284c7',
  custom: '#64748b',
};

const routeStyle = (dashArray: string, weight: number, opacity: number): L.PolylineOptions => ({
  color: '#64748b',
  weight,
  opacity,
  dashArray,
  interactive: false,
});

const ROUTE_STYLES: Record<TransportMode, L.PolylineOptions> = {
  drive: routeStyle('8,9', 3, 0.34),
  flight: routeStyle('2,10', 2, 0.45),
  rail: routeStyle('12,6', 3, 0.4),
  walk: routeStyle('2,6', 2, 0.4),
};

/** Camera stops following once the traveller takes over, for this long. */
const USER_GESTURE_GRACE_MS = 4_000;
/** Vehicle may drift this far into the viewport before the camera re-centres. */
const FOLLOW_INSET = -0.22;

const toLatLng = (point: LatLng): L.LatLngExpression => [point.lat, point.lng];

function markerIcon(stop: JourneyStop, label: number, active: boolean) {
  const color = KIND_COLORS[stop.kind];
  const size = active ? 36 : 28;

  return L.divIcon({
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    html: `<div style="transform:translate(-50%,-100%) rotate(-45deg);display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:12px 12px 12px 3px;background:${active ? color : '#fff'};border:3px solid ${active ? '#fff' : color};box-shadow:${active ? `0 0 0 5px ${color}33,0 8px 20px rgba(0,0,0,.28)` : '0 4px 12px rgba(0,0,0,.22)'}"><span style="transform:rotate(45deg);font-size:${active ? 12 : 11}px;font-weight:800;color:${active ? '#fff' : color}">${label}</span></div>`,
  });
}

const vehicleIcon = (glyph: string) =>
  L.divIcon({
    className: '',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    html: `<div style="width:42px;height:42px;border-radius:50%;background:#fff;border:3px solid #0f172a;display:grid;place-items:center;font-size:21px;line-height:1;box-shadow:0 8px 22px rgba(15,23,42,.35)">${glyph}</div>`,
  });

const VEHICLE_ICONS: Record<TransportMode, L.DivIcon> = {
  drive: vehicleIcon('🚙'),
  flight: vehicleIcon('✈️'),
  rail: vehicleIcon('🚄'),
  walk: vehicleIcon('🚶'),
};

export function JourneyMapCanvas({
  stops,
  segmentModes,
  activeStopIndex,
  controllerRef,
  onReady,
  onStopSelect,
  className,
}: JourneyMapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const mapRef = useRef<L.Map | null>(null);
  const baseLayersRef = useRef<Record<BaseLayerId, L.TileLayer> | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const guideLinesRef = useRef<L.Polyline[]>([]);
  const traveledLineRef = useRef<L.Polyline | null>(null);
  const vehicleRef = useRef<L.Marker | null>(null);
  const vehicleModeRef = useRef<TransportMode | null>(null);
  const prefixRef = useRef<LatLng[][]>([]);
  const lastUserGestureRef = useRef(Number.NEGATIVE_INFINITY);
  const activeRef = useRef(activeStopIndex);
  const onStopSelectRef = useRef(onStopSelect);
  onStopSelectRef.current = onStopSelect;

  const stopsRef = useRef(stops);
  stopsRef.current = stops;
  const segmentModesRef = useRef(segmentModes);
  segmentModesRef.current = segmentModes;

  /** Rebuilds are driven by stop content, never by array identity. */
  const stopsSignature = useMemo(
    () => stops.map((stop) => `${stop.eventId}@${stop.lat},${stop.lng}`).join('|'),
    [stops],
  );
  const fitPoints = useCallback((points: LatLng[], maxZoom: number) => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    map.fitBounds(L.latLngBounds(points.map(toLatLng)), { padding: [56, 56], maxZoom, animate: false });
  }, []);

  /** Opens on the trip's centre of gravity; cross-province endpoints are framed out. */
  const fitCore = useCallback(() => {
    const core = selectCoreStops(stopsRef.current);
    fitPoints(core, core.length === 1 ? 13 : 10);
  }, [fitPoints]);

  const fitAll = useCallback(() => fitPoints(stopsRef.current, 10), [fitPoints]);

  const setGuideLines = useCallback((paths: LatLng[][]) => {
    const map = mapRef.current;
    if (!map) return;

    guideLinesRef.current.forEach((line) => line.remove());
    // Index into segmentModes before dropping degenerate paths: coincident stops
    // yield single-point paths, and filtering first would shift every later style.
    guideLinesRef.current = paths.flatMap((path, index) =>
      path.length > 1
        ? [L.polyline(path.map(toLatLng), ROUTE_STYLES[segmentModesRef.current[index] ?? 'drive']).addTo(map)]
        : [],
    );
    guideLinesRef.current.forEach((line) => line.bringToBack());
  }, []);

  const followVehicle = useCallback((position: LatLng) => {
    const map = mapRef.current;
    if (!map || map.getSize().x === 0) return;
    if (map.getBounds().pad(FOLLOW_INSET).contains(toLatLng(position))) return;
    if (performance.now() - lastUserGestureRef.current < USER_GESTURE_GRACE_MS) return;

    map.panTo(toLatLng(position), { animate: true, duration: 0.55, noMoveStart: true });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = L.map(container, {
      zoomControl: true,
      attributionControl: true,
      fadeAnimation: false,
    }).setView([36.3, 112.1], 7);

    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    });
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 19, attribution: 'Tiles &copy; Esri' },
    );

    osm.addTo(map);
    baseLayersRef.current = { osm, satellite };
    mapRef.current = map;

    // Pointer and wheel input, not Leaflet's move events: fitBounds and panTo also
    // emit dragstart/zoomstart, which would let the camera mistake its own framing
    // for the traveller grabbing the map.
    const markUserGesture = () => {
      lastUserGestureRef.current = performance.now();
    };
    container.addEventListener('pointerdown', markUserGesture);
    container.addEventListener('wheel', markUserGesture, { passive: true });

    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(container);

    return () => {
      observer.disconnect();
      container.removeEventListener('pointerdown', markUserGesture);
      container.removeEventListener('wheel', markUserGesture);
      map.remove();
      mapRef.current = null;
      baseLayersRef.current = null;
      markersRef.current = [];
      guideLinesRef.current = [];
      traveledLineRef.current = null;
      vehicleRef.current = null;
      vehicleModeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const stops = stopsRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = stops.map((stop, index) => {
      // textContent, not an HTML string: Leaflet assigns string tooltips through
      // innerHTML and stop titles are user-editable.
      const tooltip = document.createElement('span');
      tooltip.textContent = `${stop.time ? `${stop.time} · ` : ''}${stop.title}`;

      const marker = L.marker(toLatLng(stop), {
        icon: markerIcon(stop, index + 1, index === activeRef.current),
        zIndexOffset: 500,
      })
        .addTo(map)
        .bindTooltip(tooltip, { direction: 'top', offset: [0, -28] });

      marker.on('click', () => onStopSelectRef.current?.(index));
      return marker;
    });

    setGuideLines(stops.slice(1).map((stop, index) => [stops[index], stop]));

    traveledLineRef.current?.remove();
    traveledLineRef.current = L.polyline([], {
      color: '#16a34a',
      weight: 6,
      opacity: 0.96,
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
    }).addTo(map);

    prefixRef.current = [];
    fitCore();
  }, [fitCore, setGuideLines, stopsSignature]);

  useEffect(() => {
    activeRef.current = activeStopIndex;
    markersRef.current.forEach((marker, index) => {
      const stop = stopsRef.current[index];
      if (stop) marker.setIcon(markerIcon(stop, index + 1, index === activeStopIndex));
    });
  }, [activeStopIndex, stopsSignature]);

  useEffect(() => {
    const controller: JourneyMapController = {
      setVehicle(position, mode) {
        const map = mapRef.current;
        if (!map) return;

        if (!position) {
          vehicleRef.current?.remove();
          vehicleRef.current = null;
          vehicleModeRef.current = null;
          return;
        }

        if (vehicleRef.current) {
          vehicleRef.current.setLatLng(toLatLng(position));
          // Rebuilding the icon DOM node every frame would cost 60 replacements a second.
          if (vehicleModeRef.current !== mode) vehicleRef.current.setIcon(VEHICLE_ICONS[mode]);
        } else {
          vehicleRef.current = L.marker(toLatLng(position), {
            icon: VEHICLE_ICONS[mode],
            zIndexOffset: 1200,
            interactive: false,
          }).addTo(map);
        }

        vehicleModeRef.current = mode;
      },
      setProgress(segmentIndex, traveled) {
        const prefix = prefixRef.current[segmentIndex] ?? [];
        traveledLineRef.current?.setLatLngs([...prefix, ...traveled].map(toLatLng));
      },
      setRouteGeometry(paths) {
        const prefixes: LatLng[][] = [];
        let accumulated: LatLng[] = [];
        paths.forEach((path) => {
          prefixes.push(accumulated);
          accumulated = [...accumulated, ...path];
        });
        prefixRef.current = prefixes;

        setGuideLines(paths);
      },
      setBaseLayer(layer) {
        const map = mapRef.current;
        const layers = baseLayersRef.current;
        if (!map || !layers) return;

        (Object.keys(layers) as BaseLayerId[]).forEach((id) => {
          if (id === layer) layers[id].addTo(map);
          else map.removeLayer(layers[id]);
        });
      },
      fitCore,
      fitAll,
      followVehicle,
      invalidate() {
        mapRef.current?.invalidateSize({ pan: false });
      },
    };

    controllerRef.current = controller;
    onReadyRef.current?.();

    return () => {
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [controllerRef, fitAll, fitCore, followVehicle, setGuideLines]);

  return <div ref={containerRef} className={className} />;
}
