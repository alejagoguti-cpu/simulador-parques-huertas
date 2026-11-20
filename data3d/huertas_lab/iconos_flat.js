/* ============ BIBLIOTECA DE ICONOS FLAT MONOCROMO (SVG LINEAL ARQUITECTÓNICO) ============
   Cero emojis en toda la interfaz: trazos limpios de 1.6 px estilo CAD / Rayon / Lucide. */

const PATHS = {
  park:       '<path d="M12 22v-7"/><path d="M9 22h6"/><path d="M12 3a6 6 0 0 0-5 9.3A4.5 4.5 0 0 0 8.5 16h7a4.5 4.5 0 0 0 1.5-3.7A6 6 0 0 0 12 3z"/>',
  star:       '<polygon points="12 3 14.9 8.9 21.4 9.8 16.7 14.4 17.8 20.9 12 17.8 6.2 20.9 7.3 14.4 2.6 9.8 9.1 8.9 12 3"/>',
  search:     '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/>',
  map:        '<polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>',
  zoom:       '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/><path d="M11 8v6M8 11h6"/>',
  diagnose:   '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>',
  sprout:     '<path d="M12 22V10"/><path d="M12 13C12 8.5 8.5 5 4 5c0 4.5 3.5 8 8 8z"/><path d="M12 10c0-4 3-7 7-7 0 4-3 7-7 7z"/>',
  leaf:       '<path d="M11 20A7 7 0 0 1 4 13C4 7 11 3 20 3c0 9-4 17-9 17z"/><path d="M4 20l9-9"/>',
  sliders:    '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="11" cy="18" r="2" fill="currentColor"/>',
  compass:    '<circle cx="12" cy="12" r="9"/><polygon points="16.2 7.8 14.1 14.1 7.8 16.2 9.9 9.9 16.2 7.8"/>',
  play:       '<polygon points="6 4 20 12 6 20 6 4"/>',
  pause:      '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
  print:      '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  download:   '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  layers:     '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 12 12 17 22 12"/><polyline points="2 17 12 22 22 17"/>',
  edit:       '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
  blocks:     '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
  hatch:      '<rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="12" x2="12" y2="3"/><line x1="3" y1="21" x2="21" y2="3"/><line x1="12" y1="21" x2="21" y2="12"/>',
  polygon:    '<polygon points="5 4 19 6 21 17 10 21 3 13 5 4"/><circle cx="5" cy="4" r="1.5" fill="currentColor"/><circle cx="19" cy="6" r="1.5" fill="currentColor"/><circle cx="21" cy="17" r="1.5" fill="currentColor"/><circle cx="10" cy="21" r="1.5" fill="currentColor"/><circle cx="3" cy="13" r="1.5" fill="currentColor"/>',
  cursor:     '<path d="M5 3l14 9-6.5 1.8L10 20 5 3z"/>',
  rotate:     '<path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/>',
  copy:       '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash:      '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
  undo:       '<polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/>',
  redo:       '<polyline points="15 14 20 9 15 4"/><path d="M4 20v-7a4 4 0 0 1 4-4h12"/>',
  save:       '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
  cycle:      '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
  chart:      '<line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>',
  compare:    '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="9.5" y="4" width="5" height="16" rx="1"/><rect x="16" y="4" width="5" height="16" rx="1"/>',
  fence:      '<path d="M4 4v16M12 4v16M20 4v16M2 9h20M2 15h20"/>',
  sun:        '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>',
  water:      '<path d="M12 2.7L6.3 9.4a7 7 0 1 0 11.4 0L12 2.7z"/>',
  compost:    '<path d="M4 19h16"/><path d="M6 19l1-10h10l1 10"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/>',
  users:      '<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17" cy="9" r="2.5"/><path d="M16 14.5c2.8.4 5 2.7 5 5.5"/>',
  cost:       '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 6.5c0-2-2.2-3.5-5-3.5s-5 1.5-5 3.5 2.2 3 5 3.5 5 1.5 5 3.5-2.2 3.5-5 3.5-5-1.5-5-3.5"/>',
  check:      '<polyline points="20 6 9 17 4 12"/>',
  alert:      '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  close:      '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  plus:       '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  ruler:      '<path d="M3 7h18v10H3z"/><path d="M7 7v4M11 7v3M15 7v4M19 7v3"/>',
  bench:      '<line x1="3" y1="13" x2="21" y2="13"/><line x1="5" y1="9" x2="19" y2="9"/><line x1="6" y1="9" x2="6" y2="19"/><line x1="18" y1="9" x2="18" y2="19"/>',
  pergola:    '<line x1="3" y1="6" x2="21" y2="6"/><line x1="5" y1="6" x2="5" y2="20"/><line x1="19" y1="6" x2="19" y2="20"/><line x1="9" y1="4" x2="9" y2="8"/><line x1="15" y1="4" x2="15" y2="8"/>',
  greenhouse: '<path d="M3 20V11a9 9 0 0 1 18 0v9H3z"/><line x1="12" y1="2" x2="12" y2="20"/><line x1="3" y1="13" x2="21" y2="13"/>',
  table:      '<line x1="3" y1="9" x2="21" y2="9"/><line x1="6" y1="9" x2="6" y2="19"/><line x1="18" y1="9" x2="18" y2="19"/>',
  flower:     '<circle cx="12" cy="12" r="2.5"/><path d="M12 5a2.5 2.5 0 1 1 0 5M12 14a2.5 2.5 0 1 1 0 5M5 12a2.5 2.5 0 1 1 5 0M14 12a2.5 2.5 0 1 1 5 0"/>',
  sensor:     '<line x1="12" y1="20" x2="12" y2="10"/><circle cx="12" cy="8" r="2"/><path d="M8.5 5a5 5 0 0 0 0 6M15.5 5a5 5 0 0 1 0 6"/>',
  bed:        '<rect x="3" y="7" width="18" height="10" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="9" y1="7" x2="9" y2="17"/><line x1="15" y1="7" x2="15" y2="17"/>'
};

export function ic(name, size = 14) {
  const p = PATHS[name] || PATHS.blocks;
  return `<svg class="ph-ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
