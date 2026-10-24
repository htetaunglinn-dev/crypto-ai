import * as am5 from "@amcharts/amcharts5";

export function createDarkTheme(root: am5.Root): am5.Theme {
  const theme = am5.Theme.new(root);

  theme.rule("ColorSet").set("colors", [
    am5.color(0x1fc786), // green-500
    am5.color(0xf4475d), // red-500
    am5.color(0x6675ff), // blue-500
    am5.color(0xf59e0b), // amber-500
    am5.color(0x8b5cf6), // violet-500
    am5.color(0xec4899), // pink-500
  ]);

  theme.rule("Grid").setAll({
    stroke: am5.color(0x262d3a),
    strokeOpacity: 0.3,
    strokeWidth: 1,
  });

  theme.rule("AxisLabel").setAll({
    fill: am5.color(0x8790a3),
    fontSize: 11,
    fontFamily: "ui-monospace, monospace",
  });

  theme.rule("Rectangle", ["tooltip", "background"]).setAll({
    fill: am5.color(0x171c26),
    stroke: am5.color(0x262d3a),
    strokeWidth: 1,
  });

  theme.rule("Label", ["tooltip"]).setAll({
    fill: am5.color(0xe5e7eb),
    fontFamily: "ui-monospace, monospace",
    fontSize: 12,
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
  bullish: am5.color(0x1fc786),
  bearish: am5.color(0xf4475d),
  neutral: am5.color(0x6b7280),
  primary: am5.color(0x6675ff),
  secondary: am5.color(0x8b5cf6),
  warning: am5.color(0xf59e0b),
  overbought: am5.color(0xf4475d),
  oversold: am5.color(0x1fc786),
  ema9: am5.color(0x1fc786),
  ema21: am5.color(0x6675ff),
  ema50: am5.color(0xf59e0b),
  ema200: am5.color(0xf4475d),
};
