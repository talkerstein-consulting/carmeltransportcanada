// Lucide icons (lucide-static), emitted once per page as an SVG sprite and referenced with <use>.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const DIR = path.join(path.dirname(createRequire(import.meta.url).resolve('lucide-static/package.json')), 'icons');

// Names used in the templates -> Lucide icon file.
const MAP = {
  'arrow-right': 'arrow-right', 'arrow-up-right': 'arrow-up-right', 'chevron-down': 'chevron-down', 'chevron-left': 'chevron-left', 'chevron-right': 'chevron-right',
  check: 'check', phone: 'phone', mail: 'mail', 'map-pin': 'map-pin', truck: 'truck', 'shield-check': 'shield-check', lock: 'lock', container: 'container',
  clock: 'clock', snowflake: 'snowflake', globe: 'globe', 'file-check': 'file-check', route: 'route', eye: 'eye', warehouse: 'warehouse', train: 'train-front',
  anchor: 'anchor', headset: 'headset', star: 'star', menu: 'menu', x: 'x', search: 'search', users: 'users', upload: 'upload', external: 'external-link',
  dollar: 'circle-dollar-sign', crane: 'forklift', message: 'message-square', calendar: 'calendar', building: 'building-2', play: 'play', filter: 'funnel',
};

const inner = name => fs.readFileSync(path.join(DIR, `${name}.svg`), 'utf8').replace(/^[\s\S]*?<svg[^>]*>|<\/svg>\s*$/g, '').replace(/\s+/g, ' ').trim();

export const icon = (name, cls = '') => `<svg class="i${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${MAP[name] ? name : 'container'}"/></svg>`;

let cache;
export const sprite = () => cache ??= `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${Object.entries(MAP).map(([k, file]) =>
  `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${inner(file)}</symbol>`).join('')}</svg>`;

// Picks an icon from what a feature says, so repeated generic bullets get distinct, meaningful marks.
const RULES = [
  [/refriger|reefer|temperat|genset|generator|perishable/i, 'snowflake'],
  [/bond|customs|a8a|ace |aci |entry number|document|paperwork|manifest/i, 'file-check'],
  [/bolt seal|seal/i, 'lock'],
  [/surveil|monitor|visib|tracking|track /i, 'eye'],
  [/insurance|safety|safe |certif|c.tpat|compli|risk/i, 'shield-check'],
  [/lifting|crane|handling capab/i, 'crane'],
  [/storage|stor(e|ed)|yard|fenced/i, 'warehouse'],
  [/rail|\bcn\b|\bcp\b/i, 'train'],
  [/port|terminal/i, 'anchor'],
  [/24\/7|customer service|support|dispatch/i, 'headset'],
  [/border|u\.s\.|new york|michigan|cross/i, 'globe'],
  [/location|across canada|coverage|offices/i, 'map-pin'],
  [/plan|cost|margin|detention|demurrage|afford/i, 'dollar'],
  [/fast|turn.?around|quick|time|schedule|advance|reservation/i, 'clock'],
  [/communicat|updated|coordinat/i, 'route'],
  [/chassis|fleet|driver|equipment|tractor|truck|trucker|carrier/i, 'truck'],
];
export const iconFor = text => (RULES.find(([re]) => re.test(text)) || [, 'container'])[1];
