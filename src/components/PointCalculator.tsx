import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurveParams, Point, addPoints, scalarMultiply, pointToString, POINT_AT_INFINITY, getAllPoints } from "@/utils/ellipticCurve";
import { Plus, X } from "lucide-react";

interface Props {
  curve: CurveParams;
  onVisualize: (p1: Point, p2: Point, result: Point) => void;
}

export const PointCalculator = ({ curve, onVisualize }: Props) => {
  const [point1, setPoint1] = useState<Point | null>(null);
  const [point2, setPoint2] = useState<Point | null>(null);
  const [scalar, setScalar] = useState<string>("2");
  const [result, setResult] = useState<Point | null>(null);
  const [allPoints] = useState(() => getAllPoints(curve));

  const handlePointAddition = () => {
    if (point1 && point2) {
      const sum = addPoints(point1, point2, curve);
      setResult(sum);
      onVisualize(point1, point2, sum);
    }
  };

  const handleScalarMultiplication = () => {
    if (point1) {
      const k = parseInt(scalar) || 0;
      const product = scalarMultiply(k, point1, curve);
      setResult(product);
      onVisualize(point1, point1, product);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Point Operations</CardTitle>
        <CardDescription>
          Calculate point addition and scalar multiplication
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Point Selection */}
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Point 1</Label>
            <Select
              onValueChange={(value) => {
                if (value === "infinity") {
                  setPoint1(POINT_AT_INFINITY);
                } else {
                  const [x, y] = value.split(",").map(Number);
                  setPoint1({ x, y, isInfinity: false });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a point" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="infinity">O (Point at Infinity)</SelectItem>
                {allPoints
                  .filter(p => !p.isInfinity)
                  .map((p, idx) => (
                    <SelectItem key={idx} value={`${p.x},${p.y}`}>
                      ({p.x}, {p.y})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Point 2 (for addition)</Label>
            <Select
              onValueChange={(value) => {
                if (value === "infinity") {
                  setPoint2(POINT_AT_INFINITY);
                } else {
                  const [x, y] = value.split(",").map(Number);
                  setPoint2({ x, y, isInfinity: false });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a point" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="infinity">O (Point at Infinity)</SelectItem>
                {allPoints
                  .filter(p => !p.isInfinity)
                  .map((p, idx) => (
                    <SelectItem key={idx} value={`${p.x},${p.y}`}>
                      ({p.x}, {p.y})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Operations */}
        <div className="space-y-3">
          <Button
            onClick={handlePointAddition}
            disabled={!point1 || !point2}
            className="w-full"
            variant="secondary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Calculate P + Q
          </Button>

          <div className="flex gap-2">
            <Input
              type="number"
              value={scalar}
              onChange={(e) => setScalar(e.target.value)}
              placeholder="Scalar k"
              className="flex-1"
            />
            <Button
              onClick={handleScalarMultiplication}
              disabled={!point1}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Calculate k × P
            </Button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="p-4 rounded-lg bg-muted">
            <Label className="text-sm font-medium">Result:</Label>
            <p className="text-lg font-mono mt-2">{pointToString(result)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
