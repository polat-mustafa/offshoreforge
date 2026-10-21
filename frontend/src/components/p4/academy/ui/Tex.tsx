/**
 * Typeset maths with KaTeX (HTML + MathML for screen readers). The TeX comes from the
 * course files in this folder, never from users, so rendering to an HTML string is safe.
 */

import { memo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

function render(tex: string, display: boolean): string {
  return katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: "ignore", output: "htmlAndMathml" });
}

export const Tex = memo(function Tex({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  return <span translate="no" className={className} dangerouslySetInnerHTML={{ __html: render(tex, display) }} />;
});
