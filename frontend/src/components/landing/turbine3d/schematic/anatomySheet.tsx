/**
 * A-01 Nacelle anatomy — exploded side elevation (seen from starboard, rotor
 * left) with ISO 6433 item balloons and a parts list giving each part's
 * function, IEA 15 MW mass and published failure rate. Content comes from
 * constants/nacelleAnatomy.
 *
 * Drawn to one scale (12 px = 1 m) in turbine coordinates — z along the
 * nacelle (toward the rotor), y height — from the IEA 15 MW dimensions where
 * they exist: hub Ø 7.94 m, hollow main shaft Ø 3.0 m × 0.1 m wall, turret
 * Ø 2.2 m, hub flange to first main bearing 1.0 m, bearings 1.2 m apart,
 * generator length 2.15 m, overhang 11.35 m (model/layout). Other sizes
 * (housing, cabinets, yaw ring) are indicative. Rotating parts are shown in
 * half section above the shaft axis (hatched) and in view below it, as a
 * drivetrain drawing would; the 6° shaft tilt is not drawn.
 *
 * Exploded: the drivetrain is pulled forward along the shaft axis, the cover
 * lifted, the bedplate and yaw system lowered; the equipment stays where it
 * stands on the deck. Thin chain lines trace each part back to its place.
 *
 * Hovering a row or a part highlights both; clicking selects the part (shared
 * with the 3D view, like every other sheet).
 */

import { useState, type ReactNode } from "react";

import { NACELLE_ANATOMY, anatomyOf, type AnatomyPart } from "../../../../constants/nacelleAnatomy";
import { IEA15_ONTOLOGY, IEA15_OVERVIEW, carrollTotal } from "../../../../constants/reliability";
import type { TurbinePartId } from "../../../../constants/turbinePartEducation";
import { HUB } from "../model/layout";
import { Sheet } from "./sheet";
import type { SheetProps } from "./sheets";

const ACCENT = "var(--color-accent)";
const BG = "var(--color-bg-primary)";
const COPPER = "#b8733a";
const RED = "#c1121f";

// ── scale and placement ─────────────────────────────────────────────
/** Drawing scale [px per m]. */
const S = 12;
/** Turbine z [m] at the left edge of the drawing (spinner tip, exploded) and height [m] at its top. */
const Z_LEFT = 28.6;
const Y_TOP = 171.6;
const X0 = 48;
const Y0 = 46;
const X = (z: number) => X0 + (Z_LEFT - z) * S;
const Y = (y: number) => Y0 + (Y_TOP - y) * S;
const L = (m: number) => m * S;

/** Hub centre: height and z (overhang) [m]. */
const HUB_Y = HUB[1];
const HUB_Z = HUB[2];
/** Shaft-frame axial station a [m] (toward the hub, 0 at the hub centre) → turbine z, with the exploded pull. */
const A = (a: number, pull = 0) => HUB_Z + a + pull;

// IEA 15 MW dimensions [m]
const R_HUB = IEA15_OVERVIEW.hubDiameterM / 2;
const R_SHAFT = IEA15_ONTOLOGY.lssDiameterM / 2;
const SHAFT_WALL = IEA15_ONTOLOGY.lssWallM;
const R_NOSE = IEA15_ONTOLOGY.noseDiameterM / 2;
const GEN_L = IEA15_ONTOLOGY.generatorLengthM;
/** Shaft-frame stations (assembled): hub flange, the two main bearings (windIO distances), turret flange. */
const A_FLANGE = -1.9;
const A_MB1 = A_FLANGE - IEA15_ONTOLOGY.distanceHubMbM;
const A_MB2 = A_MB1 - IEA15_ONTOLOGY.distanceMbMbM;
const A_NOSE_FLANGE = -6.38;
/** Generator: outer radius of the rotor yoke (OffshoreForge model, model/layout). */
const R_GEN = 5.33;

/** Exploded pull of each drivetrain part along the shaft toward the hub [m]. */
const PULL = { hub: 12.4, shaft: 10.4, brake: 7.6, rotor: 6.4, stator: 3.2 };
/** Lift / drop of the housing and the structure below the deck [m]. */
const COVER_LIFT = 10;
const BEDPLATE_DROP = 5;
const YAW_DROP = 9.5;

const AXIS = Y(HUB_Y);

type Hover = number | null;

/** First published rate of a part and its footnote letter. */
function tableRate(p: AnatomyPart): string {
  const r = p.rates[0];
  if (!r) return "–";
  if (r.row) return `${carrollTotal(r.row).toFixed(3)} a`;
  return `${(r.perYear ?? 0).toFixed(3)} b`;
}

/** Rectangle from turbine coordinates: z1 > z2 (fore → aft), y1 < y2 [m]. */
function box(z1: number, z2: number, y1: number, y2: number) {
  return { x: X(z1), y: Y(y2), width: L(z1 - z2), height: L(y2 - y1) };
}

/** Axisymmetric part in view: radius r [m] about the shaft axis from z1 to z2, toned. */
function solid(z1: number, z2: number, r: number, tone = 0.1) {
  const b = box(z1, z2, HUB_Y - r, HUB_Y + r);
  return (
    <g>
      <rect {...b} fill={BG} />
      <rect {...b} fill="currentColor" fillOpacity={tone} />
    </g>
  );
}

/** Hidden edges (ISO 128 thin dashed) of a bore of radius r [m] from z1 to z2. */
function hidden(z1: number, z2: number, r: number) {
  return (
    <g strokeWidth={0.6} strokeDasharray="4 2.5">
      <line x1={X(z1)} y1={Y(HUB_Y + r)} x2={X(z2)} y2={Y(HUB_Y + r)} />
      <line x1={X(z1)} y1={Y(HUB_Y - r)} x2={X(z2)} y2={Y(HUB_Y - r)} />
    </g>
  );
}

export function AnatomySheet({ selected, onSelect }: SheetProps) {
  const [hover, setHover] = useState<Hover>(null);
  const selItem = anatomyOf(selected)?.item ?? null;
  const on = (item: number) => item === hover || item === selItem;
  const pick = (item: number) => onSelect(NACELLE_ANATOMY.find((a) => a.item === item)!.ids[0]);

  /** One part of the drawing: hover/click target, drawn in the accent colour while active. */
  const P = (item: number, children: ReactNode) => {
    const part = NACELLE_ANATOMY.find((a) => a.item === item)!;
    const active = on(item);
    return (
      <g
        key={item}
        data-testid={`anatomy-${part.ids[0]}`}
        onClick={() => pick(item)}
        onMouseEnter={() => setHover(item)}
        onMouseLeave={() => setHover(null)}
        style={{ cursor: "pointer", color: active ? ACCENT : undefined }}
        strokeWidth={active ? 2 : 1.4}
      >
        <title>{part.title}</title>
        {children}
      </g>
    );
  };

  /** ISO 6433 item balloon; the leader ends in a dot on the part. */
  const Balloon = ({ item, x, y, to }: { item: number; x: number; y: number; to: [number, number][] }) => {
    const active = on(item);
    const c = active ? ACCENT : "currentColor";
    return (
      <g
        key={`b${item}-${x}-${y}`}
        style={{ cursor: "pointer" }}
        onMouseEnter={() => setHover(item)}
        onMouseLeave={() => setHover(null)}
        onClick={() => pick(item)}
      >
        {to.map(([tx, ty], i) => {
          const d = Math.hypot(tx - x, ty - y) || 1;
          return (
            <g key={i}>
              <line x1={x + ((tx - x) / d) * 10} y1={y + ((ty - y) / d) * 10} x2={tx} y2={ty} stroke={c} strokeWidth={0.75} />
              <circle cx={tx} cy={ty} r={1.7} fill={c} />
            </g>
          );
        })}
        <circle cx={x} cy={y} r={10} fill={active ? ACCENT : BG} stroke={c} strokeWidth={1.1} />
        <text x={x} y={y + 3.6} textAnchor="middle" fontSize={10.5} fontWeight={800} fill={active ? BG : "currentColor"}>
          {item}
        </text>
      </g>
    );
  };

  // ── drivetrain stations (exploded) ──
  const hub = A(0, PULL.hub);
  const hubFlange = A(A_FLANGE, PULL.hub);
  const shaftFwd = A(A_FLANGE, PULL.shaft);
  const shaftAft = A(A_MB2 - 0.5, PULL.shaft);
  const rotorDisc = A(-2.59, PULL.rotor);
  const statorFwd = A(-2.78 + 0.07, PULL.stator);
  const statorAft = statorFwd - GEN_L;
  const noseFlange = A(A_NOSE_FLANGE);
  const noseTip = A(-2.3);
  const mb1 = A(A_MB1);
  const mb2 = A(A_MB2);
  const brake = A(-2.45, PULL.brake);
  const towerX = X(0);

  return (
    <Sheet
      title="Nacelle anatomy — exploded"
      subtitle="Parts, functions, IEA 15 MW masses and published failure rates"
      dwg="SB5-WTG-A-001"
      sheet="4 / 4"
      standard="ISO 6433 · ISO 128 · ISO 7573"
    >
      <g fill="none" stroke="currentColor" strokeLinejoin="round">
        {/* ── centre lines (ISO 128 long-dash dotted) ── */}
        <g strokeWidth={0.7} strokeDasharray="16 3 2 3" strokeOpacity={0.8}>
          <line x1={X(Z_LEFT + 0.6)} y1={AXIS} x2={X(A_NOSE_FLANGE + HUB_Z - 1.2)} y2={AXIS} />
          <line x1={towerX} y1={Y(150.5)} x2={towerX} y2={Y(124.6)} />
        </g>

        {/* ── exploded trace lines (thin chain): where each part sits assembled ── */}
        <g strokeWidth={0.6} strokeDasharray="6 3" strokeOpacity={0.55}>
          {/* cover down to the deck */}
          <line x1={X(4.5) + 10} y1={Y(146.5 + COVER_LIFT)} x2={X(4.5) + 10} y2={Y(155.2)} />
          <line x1={X(-14.5) - 10} y1={Y(146.5 + COVER_LIFT)} x2={X(-14.5) - 10} y2={Y(155.2)} />
          {/* bedplate up to the deck, yaw ring up to the bedplate */}
          <line x1={X(3.25)} y1={Y(144.6 - BEDPLATE_DROP)} x2={X(3.25)} y2={Y(144.0 - YAW_DROP) - 8} />
          <line x1={X(-3.25)} y1={Y(144.6 - BEDPLATE_DROP)} x2={X(-3.25)} y2={Y(144.0 - YAW_DROP) - 8} />
          {/* brake caliper down to the generator rotor disc */}
          <line x1={X(brake) - L(0.4)} y1={Y(HUB_Y + 5.6)} x2={X(brake) - L(0.4)} y2={Y(HUB_Y + 3.9)} />
          {/* bedplate front flange to the turret flange */}
          <line x1={X(noseFlange)} y1={Y(HUB_Y + 2.1)} x2={X(noseFlange)} y2={Y(HUB_Y + 2.1 - BEDPLATE_DROP)} />
        </g>

        {/* 1 blade root (one blade, broken off) */}
        {P(1, <>
          <path
            d={`M ${X(hub + 2.6)} ${Y(HUB_Y + R_HUB - 0.3)} L ${X(hub + 2.45)} ${Y(HUB_Y + 13.5)} L ${X(hub - 2.45)} ${Y(HUB_Y + 13.5)} L ${X(hub - 2.6)} ${Y(HUB_Y + R_HUB - 0.3)}`}
            fill="currentColor" fillOpacity={0.05}
          />
          <path d={`M ${X(hub + 2.6)} ${Y(HUB_Y + R_HUB + 0.55)} L ${X(hub - 2.6)} ${Y(HUB_Y + R_HUB + 0.55)}`} strokeWidth={0.8} />
          {/* break line */}
          <path
            d={`M ${X(hub + 2.85)} ${Y(HUB_Y + 13.5)} q 8 -7 16 0 t 16 0 t 16 0 t 16 0`}
            strokeWidth={0.9}
          />
          <text x={X(hub) } y={Y(HUB_Y + 9.5)} textAnchor="middle" fontSize={9} fontWeight={600} fill="currentColor" stroke="none" fillOpacity={0.75}>
            Ø 5.2
          </text>
        </>)}

        {/* 2 hub (cast, in view) with the spinner and the pitch bearing of the blade shown */}
        {P(2, <>
          <path
            d={`M ${X(hub + 4.7)} ${AXIS} C ${X(hub + 4.5)} ${Y(HUB_Y + 2.2)} ${X(hub + 3.6)} ${Y(HUB_Y + 3.3)} ${X(hub + 2.6)} ${Y(HUB_Y + 3.45)} L ${X(hub + 2.6)} ${Y(HUB_Y - 3.45)} C ${X(hub + 3.6)} ${Y(HUB_Y - 3.3)} ${X(hub + 4.5)} ${Y(HUB_Y - 2.2)} ${X(hub + 4.7)} ${AXIS} Z`}
            fill="currentColor" fillOpacity={0.05}
          />
          <rect {...box(hub + 2.6, hubFlange, HUB_Y - R_HUB, HUB_Y + R_HUB)} rx={L(1.3)} fill={BG} />
          <rect {...box(hub + 2.6, hubFlange, HUB_Y - R_HUB, HUB_Y + R_HUB)} rx={L(1.3)} fill="currentColor" fillOpacity={0.09} />
          <rect {...box(hub + 2.6, hub - 2.6, HUB_Y + R_HUB - 0.3, HUB_Y + R_HUB + 0.55)} fill={BG} />
          <line x1={X(hubFlange)} y1={Y(HUB_Y + 2.2)} x2={X(hubFlange)} y2={Y(HUB_Y - 2.2)} strokeWidth={2} />
        </>)}

        {/* 3 hollow main shaft Ø 3.0 m with its hub flange; bore (wall 0.1 m) hidden */}
        {P(3, <>
          {solid(shaftFwd, shaftAft, R_SHAFT)}
          {solid(shaftFwd + 0.35, shaftFwd, 2.2)}
          {hidden(shaftFwd + 0.35, shaftAft, R_SHAFT - SHAFT_WALL)}
        </>)}

        {/* 5 rotor brake / lock caliper, lifted off the generator rotor disc */}
        {P(5, <>
          <rect {...box(brake, brake - 0.8, HUB_Y + 5.6, HUB_Y + 6.6)} fill={BG} />
          <rect {...box(brake, brake - 0.8, HUB_Y + 5.6, HUB_Y + 6.6)} fill="currentColor" fillOpacity={0.1} />
          <rect {...box(brake - 0.15, brake - 0.65, HUB_Y + 5.75, HUB_Y + 6.1)} fill={RED} fillOpacity={0.6} stroke="none" />
        </>)}

        {/* 6 generator: outer rotor (drum, magnets inside hidden) and stator (core, copper end windings) */}
        {P(6, <>
          {solid(rotorDisc + 0.25, rotorDisc - GEN_L - 0.4, R_GEN)}
          <line x1={X(rotorDisc)} y1={Y(HUB_Y + R_GEN)} x2={X(rotorDisc)} y2={Y(HUB_Y - R_GEN)} strokeWidth={0.7} />
          {hidden(rotorDisc - 0.25, rotorDisc - GEN_L - 0.25, R_GEN - 0.45)}
          {[1, -1].map((k) => (
            <rect key={k} {...box(rotorDisc - 0.25, rotorDisc - GEN_L - 0.25, k > 0 ? HUB_Y + R_GEN - 0.45 : HUB_Y - R_GEN + 0.25, k > 0 ? HUB_Y + R_GEN - 0.25 : HUB_Y - R_GEN + 0.45)}
              fill="currentColor" fillOpacity={0.55} stroke="none" />
          ))}
          {solid(statorFwd, statorAft, R_GEN - 0.75, 0.2)}
          {Array.from({ length: 7 }, (_, i) => {
            const z = statorFwd - (GEN_L / 7) * (i + 0.5);
            return <line key={i} x1={X(z)} y1={Y(HUB_Y + R_GEN - 0.8)} x2={X(z)} y2={Y(HUB_Y - R_GEN + 0.8)} strokeWidth={0.4} strokeOpacity={0.5} />;
          })}
          {[1, -1].map((k) =>
            [statorFwd + 0.3, statorAft].map((z) => (
              <rect key={`${k}${z}`} {...box(z, z - 0.3, k > 0 ? HUB_Y + R_GEN - 1.5 : HUB_Y - R_GEN + 0.85, k > 0 ? HUB_Y + R_GEN - 0.85 : HUB_Y - R_GEN + 1.5)}
                rx={2} fill={COPPER} fillOpacity={0.85} stroke={COPPER} />
            )),
          )}
          {solid(statorAft + 0.05, statorAft - 0.55, R_NOSE + 0.35)}
        </>)}

        {/* 4 turret (stationary nose, Ø 2.2 m) and the two main bearings on it, 1.2 m apart */}
        {P(4, <>
          {solid(noseTip, noseFlange, R_NOSE)}
          {solid(noseFlange + 0.35, noseFlange, 2.2)}
          {hidden(noseTip, noseFlange + 0.35, R_NOSE - 0.1)}
          {[mb1, mb2].map((z) =>
            [1, -1].map((k) => {
              // ISO 8826-1 simplified rolling bearing: rectangle with a diagonal cross
              const r = box(z + 0.3, z - 0.3, k > 0 ? HUB_Y + R_NOSE : HUB_Y - R_NOSE - 0.5, k > 0 ? HUB_Y + R_NOSE + 0.5 : HUB_Y - R_NOSE);
              return (
                <g key={`${z}${k}`}>
                  <rect {...r} fill={BG} strokeWidth={1.1} />
                  <path d={`M ${r.x} ${r.y} l ${r.width} ${r.height} M ${r.x + r.width} ${r.y} l ${-r.width} ${r.height}`} strokeWidth={0.7} />
                </g>
              );
            }),
          )}
        </>)}

        {/* 15 nacelle cover, lifted */}
        {P(15, <>
          <rect {...box(4.5, -14.5, 146.5 + COVER_LIFT, 155.5 + COVER_LIFT)} rx={L(1.6)} fill="currentColor" fillOpacity={0.07} />
          {/* panel seams and roof hatch */}
          {[-0.5, -5.5, -10.5].map((z) => (
            <line key={z} x1={X(z)} y1={Y(146.5 + COVER_LIFT) - 2} x2={X(z)} y2={Y(155.5 + COVER_LIFT) + 2} strokeWidth={0.6} strokeDasharray="5 3" />
          ))}
          <rect {...box(-1.5, -4.5, 155.5 + COVER_LIFT - 0.3, 155.5 + COVER_LIFT)} fill={BG} strokeWidth={0.8} />
        </>)}

        {/* 18 lightning protection: air terminal and roof conductor */}
        {P(18, <>
          <line x1={X(3.6)} y1={Y(155.6 + COVER_LIFT)} x2={X(-13.9)} y2={Y(155.6 + COVER_LIFT)} stroke={COPPER} strokeWidth={1.6} />
          <line x1={X(-13.9)} y1={Y(155.6 + COVER_LIFT)} x2={X(-13.9)} y2={Y(158.6 + COVER_LIFT)} stroke={COPPER} strokeWidth={1.6} />
          <path d={`M ${X(-13.9) - 3} ${Y(158.6 + COVER_LIFT)} l 3 -6 l 3 6`} stroke={COPPER} fill={COPPER} />
        </>)}

        {/* 19 met sensors: cup anemometer and vane on the mast */}
        {P(19, <>
          <line x1={X(-12.4)} y1={Y(155.5 + COVER_LIFT)} x2={X(-12.4)} y2={Y(158.9 + COVER_LIFT)} />
          <line x1={X(-11.6)} y1={Y(158.6 + COVER_LIFT)} x2={X(-13.2)} y2={Y(158.6 + COVER_LIFT)} />
          <path d={`M ${X(-11.6)} ${Y(158.6 + COVER_LIFT)} v -6 m -4 0 h 8`} />
          <path d={`M ${X(-13.2)} ${Y(158.6 + COVER_LIFT)} v -5 l -7 -2 v 4 Z`} fill={BG} />
        </>)}

        {/* 11 cooling: roof cooler (fins) and coolant pump skid */}
        {P(11, <>
          <rect {...box(-6.2, -10.8, 155.5 + COVER_LIFT, 157.9 + COVER_LIFT)} fill="currentColor" fillOpacity={0.07} />
          {Array.from({ length: 11 }, (_, i) => (
            <line key={i} x1={X(-6.5 - i * 0.4)} y1={Y(155.7 + COVER_LIFT)} x2={X(-6.5 - i * 0.4)} y2={Y(157.7 + COVER_LIFT)} strokeWidth={0.6} />
          ))}
          <rect {...box(0.9, -0.7, 148.8, 150.6)} fill="currentColor" fillOpacity={0.07} />
          <circle cx={X(0.4)} cy={Y(149.4)} r={L(0.35)} fill={BG} />
          <rect {...box(-0.1, -0.6, 149.8, 150.4)} rx={3} fill={BG} strokeWidth={0.9} />
        </>)}

        {/* 16 service crane: rail under the roof, trolley and hook */}
        {P(16, <>
          <rect {...box(3.4, -13.4, 154.5, 154.9)} fill={BG} />
          <line x1={X(3.4)} y1={Y(154.7)} x2={X(-13.4)} y2={Y(154.7)} strokeWidth={0.6} />
          <rect {...box(-4.0, -5.2, 153.95, 154.5)} fill={BG} />
          <line x1={X(-4.6)} y1={Y(153.95)} x2={X(-4.6)} y2={Y(153.2)} strokeWidth={0.9} />
          <path d={`M ${X(-4.6)} ${Y(153.2)} a 3 3 0 1 0 3 3`} strokeWidth={1.1} />
        </>)}

        {/* 12 hydraulic power unit with accumulator */}
        {P(12, <>
          <rect {...box(2.9, 1.4, 147.3, 148.4)} fill="currentColor" fillOpacity={0.07} />
          <rect {...box(2.65, 2.25, 148.4, 149.6)} rx={L(0.2)} fill={BG} />
          <circle cx={X(1.9)} cy={Y(147.85)} r={L(0.22)} fill={BG} strokeWidth={0.9} />
        </>)}

        {/* 9 power converter: four cabinet modules */}
        {P(9, <>
          <rect {...box(-1.4, -4.8, 147.3, 149.6)} fill="currentColor" fillOpacity={0.07} />
          {[-2.25, -3.1, -3.95].map((z) => (
            <line key={z} x1={X(z)} y1={Y(147.3)} x2={X(z)} y2={Y(149.6)} strokeWidth={0.7} />
          ))}
          {[-1.82, -2.67, -3.52, -4.37].map((z) => (
            <g key={z}>
              <path d={`M ${X(z) - 6} ${Y(148.8)} l 12 -10`} strokeWidth={0.7} />
              <text x={X(z) - 4} y={Y(148.95)} fontSize={7} fontWeight={700} fill="currentColor" stroke="none">~</text>
              <text x={X(z) + 1} y={Y(148.4)} fontSize={7} fontWeight={700} fill="currentColor" stroke="none">=</text>
            </g>
          ))}
        </>)}

        {/* 17 fire suppression: four agent cylinders */}
        {P(17, <>
          {[-5.45, -5.85, -6.25, -6.65].map((z) => (
            <rect key={z} {...box(z, z - 0.3, 147.3, 148.75)} rx={L(0.15)} fill={BG} stroke={RED} />
          ))}
        </>)}

        {/* 13 control and safety cabinets */}
        {P(13, <>
          <rect {...box(-7.3, -9.2, 147.3, 149.3)} fill="currentColor" fillOpacity={0.07} />
          <line x1={X(-8.25)} y1={Y(147.3)} x2={X(-8.25)} y2={Y(149.3)} strokeWidth={0.7} />
          {[-7.55, -8.5].map((z) => (
            <line key={z} x1={X(z)} y1={Y(148.1)} x2={X(z)} y2={Y(148.5)} strokeWidth={1.3} />
          ))}
        </>)}

        {/* 14 UPS / battery cabinet */}
        {P(14, <>
          <rect {...box(-9.6, -10.6, 147.3, 149.3)} fill="currentColor" fillOpacity={0.07} />
          <path d={`M ${X(-9.85)} ${Y(148.75)} h ${L(0.5)} M ${X(-10.1)} ${Y(149.0)} v ${L(0.5)} M ${X(-9.85)} ${Y(147.9)} h ${L(0.5)}`} strokeWidth={0.9} />
        </>)}

        {/* 10 step-up transformer with cooling fins and MV bushings */}
        {P(10, <>
          <rect {...box(-11.1, -14.2, 147.3, 149.9)} fill="currentColor" fillOpacity={0.07} />
          {Array.from({ length: 7 }, (_, i) => (
            <line key={i} x1={X(-11.45 - i * 0.4)} y1={Y(147.6)} x2={X(-11.45 - i * 0.4)} y2={Y(149.6)} strokeWidth={0.6} />
          ))}
          {[-11.9, -12.65, -13.4].map((z) => (
            <rect key={z} {...box(z + 0.12, z - 0.12, 149.9, 150.7)} fill={BG} strokeWidth={0.9} />
          ))}
        </>)}

        {/* 7 bedplate (cast front, fabricated rear frame), lowered */}
        {P(7, (() => {
          const d = BEDPLATE_DROP;
          const outline = `M ${X(5.0)} ${Y(152.1 - d)} L ${X(5.0)} ${Y(147.9 - d)} Q ${X(3.6)} ${Y(145.6 - d)} ${X(3.25)} ${Y(144.6 - d)} L ${X(-3.25)} ${Y(144.6 - d)} L ${X(-3.6)} ${Y(146.3 - d)} L ${X(-14.3)} ${Y(146.3 - d)} L ${X(-14.3)} ${Y(147.3 - d)} L ${X(-2.4)} ${Y(147.3 - d)} Q ${X(2.6)} ${Y(147.6 - d)} ${X(4.3)} ${Y(152.1 - d)} Z`;
          return <>
            <path d={outline} fill="url(#dwg-hatch)" />
            <path d={outline} />
            <line x1={X(-3.6)} y1={Y(146.8 - d)} x2={X(-14.3)} y2={Y(146.8 - d)} strokeWidth={0.6} />
          </>;
        })())}

        {/* 8 yaw bearing (toothed ring), drives and brake calipers, lowered */}
        {P(8, (() => {
          const d = YAW_DROP;
          return <>
            <rect {...box(3.25, -3.25, 144.0 - d, 144.6 - d)} fill="currentColor" fillOpacity={0.07} />
            <path
              d={Array.from({ length: 26 }, (_, i) => `M ${X(3.15 - i * 0.25)} ${Y(144.0 - d)} v 3`).join(" ")}
              strokeWidth={0.6}
            />
            {[-2.55, -1.15, 1.15, 2.55].map((z) => (
              <g key={z}>
                <rect {...box(z + 0.25, z - 0.25, 142.4 - d, 144.0 - d)} rx={2} fill={BG} />
                <line x1={X(z + 0.25)} y1={Y(143.5 - d)} x2={X(z - 0.25)} y2={Y(143.5 - d)} strokeWidth={0.6} />
              </g>
            ))}
            {[-2.0, 2.0].map((z) => (
              <rect key={z} {...box(z + 0.35, z - 0.35, 144.6 - d, 145.0 - d)} fill={RED} fillOpacity={0.55} stroke={RED} />
            ))}
          </>;
        })())}

        {/* 20 cable loop into the tower */}
        {P(20, <>
          <path
            d={`M ${X(0.3)} ${Y(144.0 - YAW_DROP)} C ${X(1.6)} ${Y(139.6 - YAW_DROP)} ${X(-1.6)} ${Y(139.6 - YAW_DROP)} ${X(-0.3)} ${Y(144.0 - YAW_DROP)}`}
            strokeWidth={2}
          />
          <line x1={towerX} y1={Y(140.9 - YAW_DROP)} x2={towerX} y2={Y(127.4)} strokeWidth={2} />
        </>)}

        {/* tower top (reference, not a part of the nacelle) */}
        <g strokeWidth={1.2} strokeOpacity={0.85}>
          <path d={`M ${X(3.25)} ${Y(127.4)} L ${X(3.25)} ${Y(131.6)} L ${X(-3.25)} ${Y(131.6)} L ${X(-3.25)} ${Y(127.4)}`} />
          <rect {...box(3.55, -3.55, 131.6, 131.95)} fill={BG} />
          <path d={`M ${X(3.45)} ${Y(127.4)} q 8 -6 16.6 0 t 16.6 0 t 16.6 0 t 16.6 0 t 16.6 0`} strokeWidth={0.9} />
        </g>

        {/* ── dimensions (thin, IEA 15 MW values) ── */}
        <g strokeWidth={0.6} fill="currentColor" fontSize={9} fontWeight={700}>
          {/* hub Ø */}
          <line x1={X(hubFlange) + 4} y1={Y(HUB_Y + R_HUB - 0.4)} x2={X(hubFlange) + 18} y2={Y(HUB_Y + R_HUB - 0.4)} />
          <line x1={X(hubFlange) + 4} y1={Y(HUB_Y - R_HUB + 0.4)} x2={X(hubFlange) + 18} y2={Y(HUB_Y - R_HUB + 0.4)} />
          <line x1={X(hubFlange) + 14} y1={Y(HUB_Y + R_HUB - 0.4)} x2={X(hubFlange) + 14} y2={Y(HUB_Y - R_HUB + 0.4)} markerStart="url(#dwg-arrow)" markerEnd="url(#dwg-arrow)" />
          <text x={X(hubFlange) + 12} y={Y(HUB_Y - 3.2)} stroke="none" transform={`rotate(-90 ${X(hubFlange) + 12} ${Y(HUB_Y - 3.2)})`}>
            Ø {IEA15_OVERVIEW.hubDiameterM.toFixed(2)}
          </text>
          {/* main bearing spacing */}
          <line x1={X(mb1)} y1={Y(HUB_Y + R_SHAFT + 0.2)} x2={X(mb1)} y2={Y(HUB_Y + 3.1)} />
          <line x1={X(mb2)} y1={Y(HUB_Y + R_SHAFT + 0.2)} x2={X(mb2)} y2={Y(HUB_Y + 3.1)} />
          <line x1={X(mb1) - 12} y1={Y(HUB_Y + 2.8)} x2={X(mb2) + 12} y2={Y(HUB_Y + 2.8)} />
          <path d={`M ${X(mb1) - 6} ${Y(HUB_Y + 2.8) - 3} l 6 3 l -6 3 M ${X(mb2) + 6} ${Y(HUB_Y + 2.8) - 3} l -6 3 l 6 3`} strokeWidth={0.8} fill="none" />
          <text x={(X(mb1) + X(mb2)) / 2} y={Y(HUB_Y + 3.15)} textAnchor="middle" stroke="none">{IEA15_ONTOLOGY.distanceMbMbM.toFixed(1)}</text>
          {/* generator (stator core) length, above the stator */}
          <line x1={X(statorFwd)} y1={Y(HUB_Y + R_GEN - 0.75) - 3} x2={X(statorFwd)} y2={Y(HUB_Y + R_GEN + 0.6)} />
          <line x1={X(statorAft)} y1={Y(HUB_Y + R_GEN - 0.75) - 3} x2={X(statorAft)} y2={Y(HUB_Y + R_GEN + 0.6)} />
          <line x1={X(statorFwd)} y1={Y(HUB_Y + R_GEN + 0.35)} x2={X(statorAft)} y2={Y(HUB_Y + R_GEN + 0.35)} markerStart="url(#dwg-arrow)" markerEnd="url(#dwg-arrow)" />
          <text x={(X(statorFwd) + X(statorAft)) / 2} y={Y(HUB_Y + R_GEN + 0.75)} textAnchor="middle" stroke="none">{GEN_L.toFixed(2)}</text>
          {/* shaft and turret Ø as notes */}
          <text x={(X(shaftFwd) + X(shaftAft)) / 2} y={Y(HUB_Y + R_SHAFT + 0.45)} textAnchor="middle" stroke="none">Ø {IEA15_ONTOLOGY.lssDiameterM.toFixed(1)}</text>
          <text x={X(noseTip) + 2} y={Y(HUB_Y - R_NOSE - 1.6)} stroke="none">Ø {IEA15_ONTOLOGY.noseDiameterM.toFixed(1)}</text>
        </g>

        {/* ── balloons ── */}
        {Balloon({ item: 1, x: X(hub + 4.4), y: Y(HUB_Y + 11.6), to: [[X(hub + 2.5), Y(HUB_Y + 11.2)]] })}
        {Balloon({ item: 2, x: X(hub + 3.4), y: Y(HUB_Y - 7.6), to: [[X(hub + 1.6), Y(HUB_Y - R_HUB + 0.2)]] })}
        {Balloon({ item: 3, x: X(shaftAft + 0.6), y: Y(HUB_Y - 7.6), to: [[X(shaftAft + 1.0), Y(HUB_Y - R_SHAFT)]] })}
        {Balloon({ item: 6, x: X(rotorDisc - 1.2), y: Y(HUB_Y - 7.6), to: [[X(rotorDisc - 1.2), Y(HUB_Y - R_GEN)], [X(statorFwd - 0.6), Y(HUB_Y - R_GEN + 0.75)]] })}
        {Balloon({ item: 4, x: X(mb2 - 0.4), y: Y(HUB_Y - 7.6), to: [[X(mb2 - 1.65), Y(HUB_Y - R_NOSE)]] })}
        {Balloon({ item: 5, x: X(brake + 2.0), y: Y(HUB_Y + 8.2), to: [[X(brake - 0.2), Y(HUB_Y + 6.4)]] })}

        {Balloon({ item: 15, x: X(6.6), y: Y(152 + COVER_LIFT), to: [[X(4.5), Y(152 + COVER_LIFT)]] })}
        {Balloon({ item: 16, x: X(6.6), y: Y(154.7), to: [[X(3.4), Y(154.7)]] })}
        {Balloon({ item: 11, x: X(-8.5), y: Y(161.2 + COVER_LIFT), to: [[X(-8.5), Y(157.9 + COVER_LIFT)]] })}
        {Balloon({ item: 19, x: X(-11.3), y: Y(161.4 + COVER_LIFT), to: [[X(-12.0), Y(158.9 + COVER_LIFT)]] })}
        {Balloon({ item: 18, x: X(-16.6), y: Y(158.6 + COVER_LIFT), to: [[X(-13.9), Y(158.0 + COVER_LIFT)]] })}

        {/* equipment on the deck: one row of balloons between the crane and the equipment */}
        {Balloon({ item: 12, x: X(2.15), y: Y(152.2), to: [[X(2.45), Y(149.6)]] })}
        {Balloon({ item: 11, x: X(0.1), y: Y(152.2), to: [[X(0.1), Y(150.6)]] })}
        {Balloon({ item: 9, x: X(-3.1), y: Y(152.2), to: [[X(-3.1), Y(149.6)]] })}
        {Balloon({ item: 17, x: X(-6.05), y: Y(152.2), to: [[X(-6.05), Y(148.75)]] })}
        {Balloon({ item: 13, x: X(-8.0), y: Y(152.2), to: [[X(-8.25), Y(149.3)]] })}
        {Balloon({ item: 14, x: X(-10.3), y: Y(152.2), to: [[X(-10.1), Y(149.3)]] })}
        {Balloon({ item: 10, x: X(-12.65), y: Y(152.2), to: [[X(-12.65), Y(150.7)]] })}

        {Balloon({ item: 7, x: X(-16.4), y: Y(146.8 - BEDPLATE_DROP), to: [[X(-14.3), Y(146.8 - BEDPLATE_DROP)]] })}
        {Balloon({ item: 8, x: X(5.6), y: Y(144.3 - YAW_DROP), to: [[X(3.25), Y(144.3 - YAW_DROP)]] })}
        {Balloon({ item: 20, x: X(-5.4), y: Y(139.4 - YAW_DROP), to: [[X(-0.2), Y(138.6 - YAW_DROP)]] })}

        <AssembledKey />

        {/* ── notes and graphic scale ── */}
        <g fill="currentColor" stroke="none" fontSize={9.5} fontWeight={600} fillOpacity={0.75}>
          <text x={X(3.7)} y={Y(129.6)} textAnchor="end">tower (reference)</text>
          <text x={X(Z_LEFT)} y={Y(124.0)}>View from starboard · exploded · hidden edges dashed</text>
          <text x={X(Z_LEFT)} y={Y(124.0) + 13}>Centre lines: shaft axis (6° tilt not drawn), tower axis · dimensions in m (IEA 15 MW)</text>
        </g>
        <g transform={`translate(${X(Z_LEFT)} ${Y(126.6)})`} fontSize={8.5} fontWeight={700} fill="currentColor">
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={i * L(2.5)} y={-4} width={L(2.5)} height={4} fill={i % 2 ? BG : "currentColor"} strokeWidth={0.7} />
          ))}
          {[0, 5, 10].map((m) => (
            <text key={m} x={L(m)} y={-8} textAnchor="middle" stroke="none">{m}</text>
          ))}
          <text x={L(12.5) + 6} y={0} stroke="none">m</text>
        </g>
      </g>

      <PartsList hover={hover} selItem={selItem} setHover={setHover} onSelect={onSelect} />
    </Sheet>
  );
}

/** Small assembled side view (reference for the exploded one): same coordinates at 5 px/m, lower left. */
function AssembledKey() {
  const s = 5;
  const ox = 64;
  const oy = 440;
  const x = (z: number) => ox + (HUB_Z + 4.9 - z) * s;
  const y = (h: number) => oy + (160.5 - h) * s;
  const r = (z1: number, z2: number, y1: number, y2: number) => ({ x: x(z1), y: y(y2), width: (z1 - z2) * s, height: (y2 - y1) * s });
  return (
    <g strokeWidth={1} fill={BG}>
      <rect x={ox - 12} y={oy - 20} width={(HUB_Z + 4.9 + 14.5) * s + 24} height={(160.5 - 139.5) * s + 32} fill="none" strokeWidth={0.7} strokeDasharray="4 3" strokeOpacity={0.7} />
      <text x={ox - 6} y={oy - 7} fontSize={9} fontWeight={800} fill="currentColor" stroke="none">ASSEMBLED · for reference</text>
      {/* tower top, yaw ring */}
      <path d={`M ${x(3.25)} ${y(139.5)} L ${x(3.25)} ${y(144.0)} L ${x(-3.25)} ${y(144.0)} L ${x(-3.25)} ${y(139.5)}`} fill="none" />
      <rect {...r(3.25, -3.25, 144.0, 144.6)} />
      {/* housing, roof cooler */}
      <rect {...r(4.5, -14.5, 146.5, 155.5)} rx={6} fill="currentColor" fillOpacity={0.07} />
      <rect {...r(-6.2, -10.8, 155.5, 157.9)} fill="currentColor" fillOpacity={0.07} />
      {/* generator drum, hub with spinner, blade root */}
      <rect {...r(A(-2.34), A(-2.34) - GEN_L - 0.65, HUB_Y - R_GEN, HUB_Y + R_GEN)} fill="currentColor" fillOpacity={0.12} />
      <rect {...r(A(2.6), A(A_FLANGE), HUB_Y - R_HUB, HUB_Y + R_HUB)} rx={6} fill="currentColor" fillOpacity={0.12} />
      <path d={`M ${x(A(4.7))} ${y(HUB_Y)} Q ${x(A(4.5))} ${y(HUB_Y + 3.4)} ${x(A(2.6))} ${y(HUB_Y + 3.45)} L ${x(A(2.6))} ${y(HUB_Y - 3.45)} Q ${x(A(4.5))} ${y(HUB_Y - 3.4)} ${x(A(4.7))} ${y(HUB_Y)} Z`} />
      {/* centre lines */}
      <g strokeWidth={0.5} strokeDasharray="10 2 2 2" fill="none" strokeOpacity={0.8}>
        <line x1={x(A(5.4))} y1={y(HUB_Y)} x2={x(A(A_NOSE_FLANGE) - 1)} y2={y(HUB_Y)} />
        <line x1={x(0)} y1={y(147)} x2={x(0)} y2={y(139.5)} />
      </g>
    </g>
  );
}

const COL = { item: 724, part: 748, fn: 908, mass: 1080, rate: 1124, end: 1170 };
const ROW_H = 24;
const HEAD_Y = 44;

function PartsList({ hover, selItem, setHover, onSelect }: {
  hover: Hover; selItem: number | null; setHover: (h: Hover) => void; onSelect: (p: TurbinePartId) => void;
}) {
  const top = HEAD_Y + 24;
  const bottom = top + NACELLE_ANATOMY.length * ROW_H;
  return (
    <g fontSize={10} fill="currentColor">
      <text x={COL.item} y={HEAD_Y - 8} fontSize={11} fontWeight={800}>PARTS LIST</text>
      {/* header */}
      <rect x={COL.item} y={HEAD_Y} width={COL.end - COL.item} height={24} fill="currentColor" fillOpacity={0.08} stroke="currentColor" strokeWidth={1.2} />
      <g fontWeight={800}>
        <text x={COL.item + 12} y={HEAD_Y + 16} textAnchor="middle">#</text>
        <text x={COL.part + 6} y={HEAD_Y + 16}>Part</text>
        <text x={COL.fn + 6} y={HEAD_Y + 16}>Function</text>
        <text x={COL.rate - 5} y={HEAD_Y + 16} textAnchor="end">Mass t</text>
        <text x={COL.end - 5} y={HEAD_Y + 16} textAnchor="end">Fail./yr</text>
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
              fill={active ? "var(--color-accent-muted)" : i % 2 ? "currentColor" : "transparent"}
              fillOpacity={active ? 1 : i % 2 ? 0.035 : 0}
              stroke="currentColor" strokeWidth={0.5} strokeOpacity={0.45} />
            <circle cx={COL.item + 12} cy={y + ROW_H / 2} r={8} fill={active ? ACCENT : "none"} stroke={active ? ACCENT : "currentColor"} strokeWidth={0.9} />
            <text x={COL.item + 12} y={y + ROW_H / 2 + 3.4} textAnchor="middle" fontSize={9} fontWeight={800} fill={active ? BG : "currentColor"}>{p.item}</text>
            <text x={COL.part + 6} y={y + 15.5} fontWeight={700} fill={active ? ACCENT : "currentColor"}>{p.title}</text>
            <text x={COL.fn + 6} y={y + 15.5} fontWeight={500} fillOpacity={0.85}>{p.brief}</text>
            <text x={COL.rate - 5} y={y + 15.5} textAnchor="end" fontFamily="ui-monospace, monospace" fontWeight={600}>
              {p.massT !== undefined ? p.massT.toFixed(1) : model ? "M" : "–"}
            </text>
            <text x={COL.end - 5} y={y + 15.5} textAnchor="end" fontFamily="ui-monospace, monospace" fontWeight={600}>{tableRate(p)}</text>
          </g>
        );
      })}
      {/* column rules */}
      {[COL.part, COL.fn, COL.mass, COL.rate].map((x) => (
        <line key={x} x1={x} y1={HEAD_Y} x2={x} y2={bottom} stroke="currentColor" strokeWidth={0.5} strokeOpacity={0.45} />
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
