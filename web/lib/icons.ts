// Lucide icon picked from what a line of copy says, so repeated bullets get meaningful marks.
import {
  Anchor, CircleDollarSign, Clock, Container, Eye, FileCheck, Forklift, Globe, Headset, Lock, MapPin,
  Route, ShieldCheck, Snowflake, TrainFront, Truck, Warehouse, type LucideIcon,
} from "lucide-react";

const RULES: [RegExp, LucideIcon][] = [
  [/refriger|reefer|temperat|genset|generator|perishable/i, Snowflake],
  [/bond|customs|a8a|ace |aci |entry number|document|paperwork|manifest/i, FileCheck],
  [/bolt seal|seal/i, Lock],
  [/surveil|monitor|visib|tracking|track /i, Eye],
  [/insurance|safety|safe |certif|c.tpat|compli|risk/i, ShieldCheck],
  [/lifting|crane|handling capab/i, Forklift],
  [/storage|stor(e|ed)|yard|fenced/i, Warehouse],
  [/rail|\bcn\b|\bcp\b/i, TrainFront],
  [/port|terminal/i, Anchor],
  [/24\/7|customer service|support|dispatch/i, Headset],
  [/border|u\.s\.|new york|michigan|cross/i, Globe],
  [/location|across canada|coverage|offices/i, MapPin],
  [/plan|cost|margin|detention|demurrage|afford/i, CircleDollarSign],
  [/fast|turn.?around|quick|time|schedule|advance|reservation/i, Clock],
  [/communicat|updated|coordinat/i, Route],
  [/chassis|fleet|driver|equipment|tractor|truck|trucker|carrier|drayage|shipping container|import|export/i, Truck],
];

export const iconFor = (text: string): LucideIcon => RULES.find(([re]) => re.test(text))?.[1] ?? Container;
