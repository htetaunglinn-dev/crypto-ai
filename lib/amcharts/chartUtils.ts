import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import { createDarkTheme } from "./theme";

export function createChartRoot(container: HTMLElement): am5.Root {
  const root = am5.Root.new(container);
  root.setThemes([am5themes_Dark.new(root), createDarkTheme(root)]);
  root.interfaceColors.set("grid", am5.color(0x374151));
  root.interfaceColors.set("text", am5.color(0xe5e7eb));

  return root;
}

export function createXYChart(root: am5.Root, config?: am5xy.IXYChartSettings): am5xy.XYChart {
  return root.container.children.push(
    am5xy.XYChart.new(root, {
      panX: true,
      panY: false,
      wheelY: "zoomX",
      layout: root.verticalLayout,
      paddingLeft: 0,
      paddingRight: 10,
      ...config,
    })
  );
}

export function createDateAxis(chart: am5xy.XYChart, root: am5.Root): am5xy.DateAxis<am5xy.AxisRenderer> {
  return chart.xAxes.push(
    am5xy.DateAxis.new(root, {
      baseInterval: { timeUnit: "minute", count: 1 },
      renderer: am5xy.AxisRendererX.new(root, {
        minGridDistance: 50,
      }),
      tooltip: am5.Tooltip.new(root, {}),
    })
  );
}

export function createValueAxis(chart: am5xy.XYChart, root: am5.Root, opposite: boolean = false): am5xy.ValueAxis<am5xy.AxisRenderer> {
  return chart.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {
        opposite,
      }),
    })
  );
}

export function formatTimestamp(timestamp: number): number {
  return timestamp;
}

export function formatPrice(value: number): string {
  return value.toFixed(2);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function createCursor(chart: am5xy.XYChart, root: am5.Root): am5xy.XYCursor {
  const cursor = chart.set(
    "cursor",
    am5xy.XYCursor.new(root, {
      behavior: "zoomX",
    })
  );
  cursor.lineY.set("visible", false);
  return cursor;
}

export function createScrollbar(chart: am5xy.XYChart, root: am5.Root): am5xy.XYChartScrollbar {
  const scrollbar = am5xy.XYChartScrollbar.new(root, {
    orientation: "horizontal",
    height: 20,
  });
  chart.set("scrollbarX", scrollbar);
  return scrollbar;
}
