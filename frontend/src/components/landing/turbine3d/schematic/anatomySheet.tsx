/**
 * A-01 Nacelle anatomy — the exploded view as a drawing sheet: the parts of
 * the IEA 15 MW direct-drive nacelle pulled apart along the shaft (rotor side
 * left), numbered balloons (ISO 6433 item references) and a parts list with
 * each part's function, IEA 15 MW mass and published failure rate. Content
 * comes from constants/nacelleAnatomy; proportions follow the IEA dimensions
 * where they exist (hub Ø 7.94 m, main shaft Ø 3.0 m, turret Ø 2.2 m, bearing
 * spacing 1.2 m, 12 px per metre) and are indicative elsewhere.
 *
 * Hovering a row or a part highlights both; clicking selects the part (shared
 * with the 3D view, like every other sheet).
 */

import { useState, type ReactNode } from "react";

import { NACELLE_ANATOMY, anatomyOf, type AnatomyPart } from "../../../../constants/nacelleAnatomy";
import { carrollTotal } from "../../../../constants/reliability";
import type { TurbinePartId } from "../../../../constants/turbinePartEducation";
import { Sheet } from "./sheet";
import type { SheetProps } from "./sheets";

const ACCENT = "var(--color-accent)";
const COPPER = "#b8733a";
const RED = "#c1121f";
const AXIS_Y = 300;

type Hover = number | null;

/** First published rate of a part and its footnote letter. */
function tableRate(p: AnatomyPart): string {
  const r = p.rates[0];
  if (!r) return "–";
  if (r.row) return `${carrollTotal(r.row).toFixed(3)} a`;
  return `${(r.perYear ?? 0).toFixed(3)} b`;
}

export function AnatomySheet({ selected, onSelect }: SheetProps) {
  const [hover, setHover] = useState<Hover>(null);
  const selItem = anatomyOf(selected)?.item ?? null;
  const on = (item: number) => item === hover || item === selItem;

  /** One part of the drawing: hover/click target in the part's colour state. */
  const P = (item: number, children: ReactNode) => {
    const part = NACELLE_ANATOMY.find((a) => a.item === item)!;
    const active = on(item);
    return (
      <g
        key={item}
        data-testid={`anatomy-${part.ids[0]}`}
        onClick={() => onSelect(part.ids[0] as TurbinePartId)}
        onMouseEnter={() => setHover(item)}
        onMouseLeave={() => setHover(null)}
        style={{ cursor: "pointer", color: active ? ACCENT : undefined }}
        strokeWidth={active ? 2.4 : 1.5}
      >
        <title>{part.title}</title>
        {children}
      </g>
    );
  };

  /** Item balloon with leader lines to one or more points on the part. */
  const Balloon = ({ item, x, y, to }: { item: number; x: number; y: number; to: [number, number][] }) => {
    const active = on(item);
    return (
      <g
        key={`b${item}-${x}`}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setHover(item)}
        onMouseLeave={() => setHover(null)}
        onClick={() => onSelect(NACELLE_ANATOMY.find((a) => a.item === item)!.ids[0])}
      >
        {to.map(([tx, ty], i) => {
          const d = Math.hypot(tx - x, ty - y) || 1;
          return (
            <g key={i}>
              <line x1={x + ((tx - x) / d) * 11} y1={y + ((ty - y) / d) * 11} x2={tx} y2={ty}
                stroke={active ? ACCENT : "currentColor"} strokeWidth={0.9} />
              <circle cx={tx} cy={ty} r={1.8} fill={active ? ACCENT : "currentColor"} />
            </g>
          );
        })}
        <circle cx={x} cy={y} r={11} fill={active ? ACCENT : "var(--color-bg-primary)"} stroke={active ? ACCENT : "currentColor"} strokeWidth={1.3} />
        <text x={x} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={800}
          fill={active ? "var(--color-bg-primary)" : "currentColor"}>{item}</text>
      </g>
    );
  };

  const fillBg = "var(--color-bg-primary)";

  return (
    <Sheet
      title="Nacelle anatomy — exploded"
      subtitle="Parts, functions, IEA 15 MW masses and published failure rates"
      dwg="SB5-WTG-A-001"
      sheet="4 / 4"
      standard="ISO 6433 · ISO 7573"
    >
      <g fill="none" stroke="currentColor">
        {/* shaft axis and tower axis (dash-dot centre lines) */}
        <line x1={40} y1={AXIS_Y} x2={540} y2={AXIS_Y} strokeWidth={0.8} strokeDasharray="18 4 3 4" />
        <line x1={550} y1={372} x2={550} y2={604} strokeWidth={0.8} strokeDasharray="18 4 3 4" />
        <text x={44} y={574} fontSize={9.5} fontWeight={600} fill="currentColor" stroke="none" fillOpacity={0.7}>Centre lines: shaft axis (6° tilt not drawn), tower axis</text>
        <text x={44} y={588} fontSize={9.5} fontWeight={600} fill="currentColor" stroke="none" fillOpacity={0.7}>Exploded schematic · proportions indicative</text>
        <path d="M 520 604 L 520 566 L 580 566 L 580 604" strokeWidth={1.2} />
        <text x={586} y={598} fontSize={9.5} fontWeight={600} fill="currentColor" stroke="none" fillOpacity={0.7}>tower</text>

        {/* 1 blades: roots only, broken off */}
        {P(1, <>
          <path d="M 99 252 L 93 84 L 131 84 L 125 252" fill={fillBg} />
          <path d="M 99 348 L 93 516 L 131 516 L 125 348" fill={fillBg} />
          <path d="M 88 84 l 9 -5 l 9 9 l 9 -9 l 9 9 l 9 -5" strokeWidth={1} />
          <path d="M 88 516 l 9 5 l 9 -9 l 9 9 l 9 -9 l 9 5" strokeWidth={1} />
        </>)}
        {/* 2 hub + spinner (Ø 7.94 m) */}
        {P(2, <>
          <path d="M 58 300 C 58 258 92 252 150 252 L 150 348 C 92 348 58 342 58 300 Z" fill={fillBg} />
          <line x1={150} y1={252} x2={150} y2={348} />
          <circle cx={112} cy={300} r={10} />
        </>)}
        {/* 5 rotor brake / lock: caliper on the generator rotor disc */}
        {P(5, <>
          <rect x={186} y={218} width={20} height={22} fill={fillBg} />
          <line x1={196} y1={240} x2={196} y2={362} strokeDasharray="4 3" />
          <rect x={189} y={224} width={14} height={10} fill={RED} fillOpacity={0.5} stroke="none" />
        </>)}
        {/* 6 generator: outer rotor (magnets) and stator (windings) */}
        {P(6, <>
          <rect x={226} y={236} width={30} height={128} fill={fillBg} />
          {Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={226} y1={246 + i * 13} x2={256} y2={246 + i * 13} strokeWidth={0.8} />
          ))}
          <rect x={276} y={244} width={26} height={112} fill={fillBg} />
          {Array.from({ length: 7 }, (_, i) => (
            <line key={i} x1={280 + i * 3.4} y1={248} x2={280 + i * 3.4} y2={352} stroke={COPPER} strokeWidth={1.2} />
          ))}
        </>)}
        {/* 3 hollow main shaft (Ø 3.0 m) */}
        {P(3, <>
          <rect x={330} y={282} width={80} height={36} fill="url(#dwg-hatch)" />
          <rect x={330} y={282} width={80} height={36} />
          <line x1={330} y1={286} x2={410} y2={286} strokeWidth={0.8} />
          <line x1={330} y1={314} x2={410} y2={314} strokeWidth={0.8} />
        </>)}
        {/* 4 main bearings 1.2 m apart on the turret (Ø 2.2 m) */}
        {P(4, <>
          <rect x={430} y={287} width={92} height={26} fill={fillBg} strokeDasharray="6 3" />
          {[440, 454].map((bx) => (
            <g key={bx}>
              <rect x={bx - 4} y={268} width={8} height={64} fill={fillBg} />
              <path d={`M ${bx - 4} 268 L ${bx + 4} 332 M ${bx + 4} 268 L ${bx - 4} 332`} strokeWidth={0.8} />
            </g>
          ))}
        </>)}
        {/* 15 cover, lifted */}
        {P(15, <>
          <rect x={440} y={92} width={250} height={58} rx={14} fill={fillBg} />
          <rect x={448} y={100} width={234} height={42} rx={10} strokeDasharray="5 4" strokeWidth={0.8} />
        </>)}
        {/* 18 lightning: air terminal + conductor along the roof */}
        {P(18, <>
          <line x1={452} y1={90} x2={600} y2={90} stroke={COPPER} strokeWidth={2} />
          <line x1={456} y1={72} x2={456} y2={90} stroke={COPPER} strokeWidth={2} />
        </>)}
        {/* 19 met sensors on a mast */}
        {P(19, <>
          <line x1={585} y1={90} x2={585} y2={54} />
          <line x1={575} y1={56} x2={595} y2={56} />
          <circle cx={575} cy={56} r={3} fill={fillBg} />
          <circle cx={595} cy={56} r={3} fill={fillBg} />
        </>)}
        {/* 11 cooling: roof cooler + coolant skid */}
        {P(11, <>
          <rect x={612} y={54} width={60} height={34} fill={fillBg} />
          {Array.from({ length: 6 }, (_, i) => (
            <line key={i} x1={620 + i * 9} y1={58} x2={616 + i * 9} y2={84} strokeWidth={0.8} />
          ))}
          <rect x={528} y={196} width={22} height={48} fill={fillBg} />
          {Array.from({ length: 5 }, (_, i) => (
            <line key={i} x1={531} y1={202 + i * 9} x2={547} y2={202 + i * 9} strokeWidth={0.8} />
          ))}
        </>)}
        {/* 16 service crane: rail + trolley */}
        {P(16, <>
          <line x1={470} y1={170} x2={682} y2={170} strokeWidth={3} />
          <rect x={560} y={172} width={22} height={8} fill={fillBg} />
          <line x1={571} y1={180} x2={571} y2={188} />
        </>)}
        {/* 17 fire suppression cylinders */}
        {P(17, <>
          {[484, 498, 512].map((cx) => (
            <rect key={cx} x={cx - 4} y={188} width={8} height={26} rx={3} fill={fillBg} stroke={RED} />
          ))}
        </>)}
        {/* 9 converter */}
        {P(9, <>
          <rect x={560} y={196} width={52} height={48} fill={fillBg} />
          <line x1={560} y1={244} x2={612} y2={196} strokeWidth={0.8} />
          <text x={570} y={214} fontSize={11} fontWeight={700} fill="currentColor" stroke="none">~</text>
          <text x={598} y={238} fontSize={11} fontWeight={700} fill="currentColor" stroke="none">~</text>
        </>)}
        {/* 13 control and safety cabinets */}
        {P(13, <>
          <rect x={628} y={198} width={30} height={46} fill={fillBg} />
          <line x1={643} y1={198} x2={643} y2={244} strokeWidth={0.8} />
        </>)}
        {/* 14 UPS */}
        {P(14, <>
          <rect x={664} y={198} width={22} height={46} fill={fillBg} />
          <path d="M 670 212 h 10 M 672 208 v 8 M 670 232 h 10" strokeWidth={1} />
        </>)}
        {/* 12 hydraulic power unit + accumulator */}
        {P(12, <>
          <rect x={470} y={228} width={40} height={30} fill={fillBg} />
          <circle cx={500} cy={220} r={7} fill={fillBg} />
        </>)}
        {/* 7 bedplate, dropped */}
        {P(7, <>
          <path d="M 468 392 L 652 392 L 652 410 L 572 430 L 492 430 L 468 410 Z" fill="url(#dwg-hatch)" />
        </>)}
        {/* 8 yaw bearing, drives and brakes */}
        {P(8, <>
          <rect x={500} y={448} width={100} height={14} fill={fillBg} />
          <path d="M 500 448 L 600 462 M 600 448 L 500 462" strokeWidth={0.6} />
          {[514, 586].map((dx) => (
            <rect key={dx} x={dx - 7} y={462} width={14} height={18} fill={fillBg} />
          ))}
          {[530, 570].map((bx) => (
            <rect key={bx} x={bx - 5} y={440} width={10} height={8} fill={RED} fillOpacity={0.5} stroke={RED} />
          ))}
        </>)}
        {/* 10 step-up transformer, moved aft */}
        {P(10, <>
          <rect x={612} y={440} width={58} height={52} fill={fillBg} />
          {[620, 630, 640, 650, 660].map((fx) => (
            <line key={fx} x1={fx} y1={448} x2={fx} y2={484} strokeWidth={0.8} />
          ))}
          <path d="M 628 440 v -10 M 654 440 v -14" strokeWidth={2} />
        </>)}
        {/* 20 cable loop into the tower */}
        {P(20, <>
          <path d="M 544 482 C 518 526 582 526 556 482" strokeWidth={2.2} />
          <line x1={550} y1={520} x2={550} y2={560} strokeWidth={2.2} />
        </>)}

        {/* balloons */}
        {Balloon({ item: 1, x: 60, y: 118, to: [[96, 140]] })}
        {Balloon({ item: 2, x: 50, y: 392, to: [[74, 330]] })}
        {Balloon({ item: 5, x: 196, y: 186, to: [[196, 218]] })}
        {Balloon({ item: 6, x: 266, y: 404, to: [[241, 364], [289, 356]] })}
        {Balloon({ item: 3, x: 370, y: 362, to: [[370, 318]] })}
        {Balloon({ item: 4, x: 447, y: 370, to: [[447, 332]] })}
        {Balloon({ item: 15, x: 414, y: 108, to: [[440, 120]] })}
        {Balloon({ item: 18, x: 470, y: 58, to: [[456, 74]] })}
        {Balloon({ item: 19, x: 556, y: 42, to: [[580, 54]] })}
        {Balloon({ item: 11, x: 700, y: 44, to: [[672, 64]] })}
        {Balloon({ item: 11, x: 539, y: 272, to: [[539, 244]] })}
        {Balloon({ item: 16, x: 704, y: 170, to: [[682, 170]] })}
        {Balloon({ item: 17, x: 462, y: 200, to: [[480, 200]] })}
        {Balloon({ item: 9, x: 586, y: 270, to: [[586, 244]] })}
        {Balloon({ item: 13, x: 643, y: 270, to: [[643, 244]] })}
        {Balloon({ item: 14, x: 704, y: 222, to: [[686, 222]] })}
        {Balloon({ item: 12, x: 436, y: 244, to: [[470, 244]] })}
        {Balloon({ item: 7, x: 680, y: 408, to: [[652, 402]] })}
        {Balloon({ item: 8, x: 472, y: 470, to: [[500, 456]] })}
        {Balloon({ item: 10, x: 704, y: 468, to: [[670, 466]] })}
        {Balloon({ item: 20, x: 600, y: 530, to: [[566, 512]] })}
      </g>

      <PartsList hover={hover} selItem={selItem} setHover={setHover} onSelect={onSelect} />
    </Sheet>
  );
}

const COL = { item: 724, part: 748, fn: 908, mass: 1080, rate: 1124, end: 1170 };
const ROW_H = 24.5;
const HEAD_Y = 44;

function PartsList({ hover, selItem, setHover, onSelect }: {
  hover: Hover; selItem: number | null; setHover: (h: Hover) => void; onSelect: (p: TurbinePartId) => void;
}) {
  const top = HEAD_Y + 22;
  const bottom = top + NACELLE_ANATOMY.length * ROW_H;
  return (
    <g fontSize={10} fill="currentColor">
      {/* header */}
      <rect x={COL.item} y={HEAD_Y} width={COL.end - COL.item} height={22} fill="currentColor" fillOpacity={0.08} stroke="currentColor" strokeWidth={1.2} />
      <g fontWeight={800}>
        <text x={COL.item + 12} y={HEAD_Y + 15} textAnchor="middle">#</text>
        <text x={COL.part + 4} y={HEAD_Y + 15}>Part</text>
        <text x={COL.fn + 4} y={HEAD_Y + 15}>Function</text>
        <text x={COL.rate - 4} y={HEAD_Y + 15} textAnchor="end">Mass t</text>
        <text x={COL.end - 4} y={HEAD_Y + 15} textAnchor="end">Fail./yr</text>
      </g>
      {NACELLE_ANATOMY.map((p, i) => {
        const y = top + i * ROW_H;
        const active = p.item === hover || p.item === selItem;
        const model = p.facts.length > 0 && p.facts.every((f) => f.src === "model");
        return (
          <g
            key={p.item}
            data-testid={`anatomy-row-${p.item}`}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setHover(p.item)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onSelect(p.ids[0])}
          >
            <rect x={COL.item} y={y} width={COL.end - COL.item} height={ROW_H}
              fill={active ? "var(--color-accent-muted)" : "transparent"} stroke="currentColor" strokeWidth={0.6} strokeOpacity={0.6} />
            <text x={COL.item + 12} y={y + 16} textAnchor="middle" fontWeight={800} fill={active ? ACCENT : "currentColor"}>{p.item}</text>
            <text x={COL.part + 4} y={y + 16} fontWeight={700}>{p.title}</text>
            <text x={COL.fn + 4} y={y + 16} fontWeight={500} fillOpacity={0.85}>{p.brief}</text>
            <text x={COL.rate - 4} y={y + 16} textAnchor="end" fontFamily="ui-monospace, monospace" fontWeight={600}>
              {p.massT !== undefined ? p.massT.toFixed(1) : model ? "M" : "–"}
            </text>
            <text x={COL.end - 4} y={y + 16} textAnchor="end" fontFamily="ui-monospace, monospace" fontWeight={600}>{tableRate(p)}</text>
          </g>
        );
      })}
      {/* column rules */}
      {[COL.part, COL.fn, COL.mass, COL.rate].map((x) => (
        <line key={x} x1={x} y1={HEAD_Y} x2={x} y2={bottom} stroke="currentColor" strokeWidth={0.6} strokeOpacity={0.6} />
      ))}
      <rect x={COL.item} y={HEAD_Y} width={COL.end - COL.item} height={bottom - HEAD_Y} fill="none" stroke="currentColor" strokeWidth={1.2} />
      {/* notes */}
      <g fontSize={9.5} fontWeight={600} fillOpacity={0.8}>
        <text x={COL.item} y={bottom + 14}>Mass: IEA 15 MW tabular data (Gaertner et al. 2020) · M: OffshoreForge model value only</text>
        <text x={COL.item} y={bottom + 27}>Failures per turbine per year: a Carroll 2016 (offshore, geared 2–4 MW)</text>
        <text x={COL.item} y={bottom + 40}>b Carroll 2015 (PMG with fully rated converter) · – not reported separately</text>
      </g>
    </g>
  );
}
