'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import type { EventCategory } from '@/lib/domain/trip';
import type { JourneyStop, LatLng } from '@/lib/domain/journey';

export type BaseLayerId = 'osm' | 'satellite';

export type JourneyMapController = {
  setVehicle: (position: LatLng | null) => void;
  setProgress: (segmentIndex: number, traveled: LatLng[]) => void;
  setRouteGeometry: (paths: LatLng[][]) => void;
  setBaseLayer: (layer: BaseLayerId) => void;
  invalidate: () => void;
};

type JourneyMapCanvasProps = {
  stops: JourneyStop[];
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

const vehicleIcon = L.divIcon({
  className: '',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  html: '<div style="width:42px;height:42px;border-radius:50%;background:#fff;border:3px solid #0f172a;display:grid;place-items:center;font-size:21px;line-height:1;box-shadow:0 8px 22px rgba(15,23,42,.35)">🚙</div>',
});

export function JourneyMapCanvas({
  stops,
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
  const guideLineRef = useRef<L.Polyline | null>(null);
  const traveledLineRef = useRef<L.Polyline | null>(null);
  const vehicleRef = useRef<L.Marker | null>(null);
  const prefixRef = useRef<LatLng[][]>([]);
  const activeRef = useRef(activeStopIndex);
  const onStopSelectRef = useRef(onStopSelect);
  onStopSelectRef.current = onStopSelect;

  const stopsRef = useRef(stops);
  stopsRef.current = stops;

  /** Rebuilds are driven by stop content, never by array identity. */
  const stopsSignature = useMemo(
    () => stops.map((stop) => `${stop.eventId}@${stop.lat},${stop.lng}`).join('|'),
    [stops],
  );

  const fitAll = useCallback(() => {
    const map = mapRef.current;
    const points = stopsRef.current.map(toLatLng);
    if (!map || points.length === 0) return;

    map.fitBounds(L.latLngBounds(points), { padding: [56, 56], maxZoom: 10, animate: false });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
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

    const observer = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
      baseLayersRef.current = null;
      markersRef.current = [];
      guideLineRef.current = null;
      traveledLineRef.current = null;
      vehicleRef.current = null;
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

    guideLineRef.current?.remove();
    guideLineRef.current = stops.length
      ? L.polyline(stops.map(toLatLng), {
          color: '#64748b',
          weight: 3,
          opacity: 0.34,
          dashArray: '8,9',
          interactive: false,
        }).addTo(map)
      : null;
    guideLineRef.current?.bringToBack();

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
    fitAll();
  }, [fitAll, stopsSignature]);

  useEffect(() => {
    activeRef.current = activeStopIndex;
    markersRef.current.forEach((marker, index) => {
      const stop = stopsRef.current[index];
      if (stop) marker.setIcon(markerIcon(stop, index + 1, index === activeStopIndex));
    });
  }, [activeStopIndex, stopsSignature]);

  useEffect(() => {
    const controller: JourneyMapController = {
      setVehicle(position) {
        const map = mapRef.current;
        if (!map) return;

        if (!position) {
          vehicleRef.current?.remove();
          vehicleRef.current = null;
          return;
        }

        if (vehicleRef.current) vehicleRef.current.setLatLng(toLatLng(position));
        else vehicleRef.current = L.marker(toLatLng(position), { icon: vehicleIcon, zIndexOffset: 1200, interactive: false }).addTo(map);
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

        const flattened = paths.flat();
        if (flattened.length > 1) guideLineRef.current?.setLatLngs(flattened.map(toLatLng));
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
      invalidate() {
        mapRef.current?.invalidateSize({ pan: false });
      },
    };

    controllerRef.current = controller;
    onReadyRef.current?.();

    return () => {
      if (controllerRef.current === controller) controllerRef.current = null;
    };
  }, [controllerRef, fitAll]);

  return <div ref={containerRef} className={className} />;
}
