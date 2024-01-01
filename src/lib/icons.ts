import { svg, SVGTemplateResult } from 'lit';

/**
 * Wraps icon into an SVG container.
 * @param tpl Icon definition
 * @returns Complete SVG icon definition
 */
export const iconWrapper = (tpl: SVGTemplateResult, width = 24, height = 24, top = 0, left = 0): SVGTemplateResult => svg`<svg viewBox="${top} ${left} ${width} ${height}" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 100%; height: 100%;">${tpl}</svg>`;

export const close = iconWrapper(svg`<path d="M6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5l5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6Z"></path>`);
