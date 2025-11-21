import { useRef, useLayoutEffect } from "react";
import * as am5 from "@amcharts/amcharts5";
import { createChartRoot } from "@/lib/amcharts/chartUtils";

export function useAMChart<T = am5.Root>(
  setupFn: (root: am5.Root) => T
): [React.RefObject<HTMLDivElement | null>, React.RefObject<am5.Root | null>, React.RefObject<T | null>] {
  const chartRef = useRef<HTMLDivElement | null>(null);
  const rootRef = useRef<am5.Root | null>(null);
  const chartInstanceRef = useRef<T | null>(null);

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const root = createChartRoot(chartRef.current);
    rootRef.current = root;

    const chartInstance = setupFn(root);
    chartInstanceRef.current = chartInstance;

    return () => {
      root.dispose();
      rootRef.current = null;
      chartInstanceRef.current = null;
    };
  }, [setupFn]);

  return [chartRef, rootRef, chartInstanceRef];
}
