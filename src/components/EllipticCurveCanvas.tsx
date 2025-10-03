import { useEffect, useRef, useState } from "react";
import { CurveParams, Point, getAllPoints, POINT_AT_INFINITY } from "@/utils/ellipticCurve";

interface Props {
  curve: CurveParams;
  points?: Point[];
  highlightPoints?: Point[];
  line?: { from: Point; to: Point; result?: Point };
  onPointClick?: (point: Point) => void;
}

export const EllipticCurveCanvas = ({ 
  curve, 
  points = [], 
  highlightPoints = [], 
  line,
  onPointClick 
}: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [allCurvePoints, setAllCurvePoints] = useState<Point[]>([]);

  useEffect(() => {
    const curvePoints = getAllPoints(curve);
    setAllCurvePoints(curvePoints);
  }, [curve]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    
    // Determine scale based on whether using Fp or R
    const range = curve.useFp ? curve.p : 20; // For R, use range [-10, 10] = 20
    const scale = Math.min(
      (width - 2 * padding) / range,
      (height - 2 * padding) / range
    );

    // Transform coordinates
    const toCanvasX = (x: number) => curve.useFp 
      ? padding + x * scale 
      : padding + (x + 10) * scale; // Shift for negative x in R
    const toCanvasY = (y: number) => curve.useFp
      ? height - padding - y * scale
      : height - padding - (y + 10) * scale; // Shift for negative y in R

    // Draw grid
    ctx.strokeStyle = "hsl(var(--border))";
    ctx.lineWidth = 0.5;
    const gridStep = curve.useFp ? Math.floor(curve.p / 10) : 2;
    const gridStart = curve.useFp ? 0 : -10;
    const gridEnd = curve.useFp ? curve.p : 10;
    
    for (let i = gridStart; i <= gridEnd; i += gridStep) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(i), padding);
      ctx.lineTo(toCanvasX(i), height - padding);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, toCanvasY(i));
      ctx.lineTo(width - padding, toCanvasY(i));
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = "hsl(var(--foreground))";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, toCanvasY(0));
    ctx.lineTo(width - padding, toCanvasY(0));
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), padding);
    ctx.lineTo(toCanvasX(0), height - padding);
    ctx.stroke();

    // Draw curve as continuous smooth line (no points)
    ctx.strokeStyle = "hsl(var(--primary))";
    ctx.lineWidth = 2;

    // Group points by x-coordinate and connect them
    const pointsByX = new Map<number, number[]>();
    allCurvePoints.forEach(point => {
      if (!point.isInfinity && point.x !== null && point.y !== null) {
        if (!pointsByX.has(point.x)) {
          pointsByX.set(point.x, []);
        }
        pointsByX.get(point.x)!.push(point.y);
      }
    });

    // Sort x values and draw smooth curve outline only
    const sortedX = Array.from(pointsByX.keys()).sort((a, b) => a - b);
    
    // Draw upper curve
    ctx.beginPath();
    sortedX.forEach((x, idx) => {
      const yValues = pointsByX.get(x)!.sort((a, b) => b - a); // Sort descending
      const upperY = yValues[0]; // Highest y value
      
      if (idx === 0) {
        ctx.moveTo(toCanvasX(x), toCanvasY(upperY));
      } else {
        ctx.lineTo(toCanvasX(x), toCanvasY(upperY));
      }
    });
    ctx.stroke();
    
    // Draw lower curve if exists (when there are 2 y values for x)
    const hasLowerCurve = sortedX.some(x => pointsByX.get(x)!.length === 2);
    if (hasLowerCurve) {
      ctx.beginPath();
      sortedX.forEach((x, idx) => {
        const yValues = pointsByX.get(x)!.sort((a, b) => b - a); // Sort descending
        const lowerY = yValues.length === 2 ? yValues[1] : yValues[0]; // Lowest y value
        
        if (idx === 0) {
          ctx.moveTo(toCanvasX(x), toCanvasY(lowerY));
        } else {
          ctx.lineTo(toCanvasX(x), toCanvasY(lowerY));
        }
      });
      ctx.stroke();
    }

    // Draw addition line
    if (line && !line.from.isInfinity && !line.to.isInfinity) {
      ctx.strokeStyle = "hsl(var(--secondary))";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      const x1 = toCanvasX(line.from.x!);
      const y1 = toCanvasY(line.from.y!);
      const x2 = toCanvasX(line.to.x!);
      const y2 = toCanvasY(line.to.y!);

      // Calculate slope and extend line
      const slope = (y2 - y1) / (x2 - x1);
      const intercept = y1 - slope * x1;

      // Extend line across canvas
      const leftY = intercept;
      const rightY = slope * width + intercept;

      ctx.beginPath();
      ctx.moveTo(0, leftY);
      ctx.lineTo(width, rightY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw result point if exists
      if (line.result && !line.result.isInfinity) {
        ctx.fillStyle = "hsl(var(--accent))";
        ctx.strokeStyle = "hsl(var(--accent))";
        ctx.lineWidth = 3;
        
        const rx = toCanvasX(line.result.x!);
        const ry = toCanvasY(line.result.y!);
        
        // Draw reflection line
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx, toCanvasY(curve.p - line.result.y!));
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw result point
        ctx.beginPath();
        ctx.arc(rx, ry, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = "hsl(var(--background))";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Draw highlighted points
    highlightPoints.forEach((point) => {
      if (!point.isInfinity && point.x !== null && point.y !== null) {
        ctx.fillStyle = "hsl(var(--secondary))";
        ctx.strokeStyle = "hsl(var(--background))";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(toCanvasX(point.x), toCanvasY(point.y), 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    });

    // Draw additional points
    points.forEach((point) => {
      if (!point.isInfinity && point.x !== null && point.y !== null) {
        ctx.fillStyle = "hsl(var(--accent))";
        ctx.strokeStyle = "hsl(var(--background))";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(toCanvasX(point.x), toCanvasY(point.y), 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }
    });
  }, [curve, allCurvePoints, points, highlightPoints, line]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onPointClick) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const scale = Math.min(
      (width - 2 * padding) / curve.p,
      (height - 2 * padding) / curve.p
    );

    // Convert canvas coordinates to curve coordinates
    const curveX = Math.round((x - padding) / scale);
    const curveY = Math.round((height - padding - y) / scale);

    // Find closest point
    let closestPoint: Point | null = null;
    let minDistance = Infinity;

    allCurvePoints.forEach((point) => {
      if (!point.isInfinity && point.x !== null && point.y !== null) {
        const distance = Math.sqrt(
          Math.pow(point.x - curveX, 2) + Math.pow(point.y - curveY, 2)
        );
        if (distance < minDistance && distance < 5) {
          minDistance = distance;
          closestPoint = point;
        }
      }
    });

    if (closestPoint) {
      onPointClick(closestPoint);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-border rounded-lg bg-card cursor-crosshair"
      onClick={handleCanvasClick}
    />
  );
};
