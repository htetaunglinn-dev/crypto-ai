import * as am5 from "@amcharts/amcharts5";

export function createDarkTheme(root: am5.Root): am5.Theme {
  const theme = am5.Theme.new(root);

  theme.rule("ColorSet").set("colors", [
    am5.color(0x10b981), // green-500
    am5.color(0xef4444), // red-500
    am5.color(0x3b82f6), // blue-500
    am5.color(0xf59e0b), // amber-500
    am5.color(0x8b5cf6), // violet-500
    am5.color(0xec4899), // pink-500
  ]);

  theme.rule("Grid").setAll({
    stroke: am5.color(0x374151),
    strokeOpacity: 0.3,
    strokeWidth: 1,
  });

  theme.rule("AxisLabel").setAll({
    fill: am5.color(0x9ca3af),
    fontSize: 11,
    fontFamily: "ui-monospace, monospace",
  });

  theme.rule("Tooltip").setAll({
    fill: am5.color(0x1f2937),
    stroke: am5.color(0x374151),
    strokeWidth: 1,
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
    labelText: "{valueY}",
  });

  theme.rule("Label").setAll({
    fill: am5.color(0xe5e7eb),
    fontSize: 12,
    fontFamily: "ui-monospace, monospace",
  });

  theme.rule("Graphics").setAll({
    strokeOpacity: 1,
  });

  return theme;
}

export const chartColors = {
  bullish: am5.color(0x10b981),
  bearish: am5.color(0xef4444),
  neutral: am5.color(0x6b7280),
  primary: am5.color(0x3b82f6),
  secondary: am5.color(0x8b5cf6),
  warning: am5.color(0xf59e0b),
  overbought: am5.color(0xef4444),
  oversold: am5.color(0x10b981),
  ema9: am5.color(0x10b981),
  ema21: am5.color(0x3b82f6),
  ema50: am5.color(0xf59e0b),
  ema200: am5.color(0xef4444),
};
