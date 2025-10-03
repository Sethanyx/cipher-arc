import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurveParams, Point, addPoints, scalarMultiply, pointToString, POINT_AT_INFINITY } from "@/utils/ellipticCurve";
import { calculateYFromX } from "@/utils/pointCalculation";
import { Plus, X, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  curve: CurveParams;
  onVisualize: (p1: Point, p2: Point, result: Point) => void;
}

export const PointCalculator = ({ curve, onVisualize }: Props) => {
  const [x1, setX1] = useState<string>("");
  const [y1Options, setY1Options] = useState<number[]>([]);
  const [point1, setPoint1] = useState<Point | null>(null);
  
  const [x2, setX2] = useState<string>("");
  const [y2Options, setY2Options] = useState<number[]>([]);
  const [point2, setPoint2] = useState<Point | null>(null);
  
  const [scalar, setScalar] = useState<string>("2");
  const [result, setResult] = useState<Point | null>(null);
  const [error, setError] = useState<string>("");

  // Calculate y options when x1 changes
  useEffect(() => {
    if (x1 === "") {
      setY1Options([]);
      setPoint1(null);
      return;
    }
    
    const xValue = curve.useFp ? parseInt(x1) : parseFloat(x1);
    if (isNaN(xValue)) {
      setY1Options([]);
      setPoint1(null);
      return;
    }
    
    const yValues = calculateYFromX(xValue, curve);
    setY1Options(yValues);
    setPoint1(null);
    
    if (yValues.length === 0) {
      setError(`No valid y values for x = ${xValue} on this curve`);
    } else {
      setError("");
    }
  }, [x1, curve]);

  // Calculate y options when x2 changes
  useEffect(() => {
    if (x2 === "") {
      setY2Options([]);
      setPoint2(null);
      return;
    }
    
    const xValue = curve.useFp ? parseInt(x2) : parseFloat(x2);
    if (isNaN(xValue)) {
      setY2Options([]);
      setPoint2(null);
      return;
    }
    
    const yValues = calculateYFromX(xValue, curve);
    setY2Options(yValues);
    setPoint2(null);
    
    if (yValues.length === 0) {
      setError(`No valid y values for x = ${xValue} on this curve`);
    } else {
      setError("");
    }
  }, [x2, curve]);

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
          Enter x-coordinate and select y-coordinate for point operations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Point Selection */}
        <div className="space-y-4">
          {/* Point 1 */}
          <div className="space-y-3 p-4 border rounded-lg">
            <Label className="text-sm font-semibold">Point 1</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="x1" className="text-xs">x-coordinate</Label>
                <Input
                  id="x1"
                  type={curve.useFp ? "number" : "text"}
                  value={x1}
                  onChange={(e) => setX1(e.target.value)}
                  placeholder={curve.useFp ? "e.g., 47" : "e.g., 1.5"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="y1" className="text-xs">y-coordinate</Label>
                <Select
                  value={point1 ? `${point1.y}` : ""}
                  onValueChange={(value) => {
                    const xValue = curve.useFp ? parseInt(x1) : parseFloat(x1);
                    const yValue = parseFloat(value);
                    setPoint1({ x: xValue, y: yValue, isInfinity: false });
                  }}
                  disabled={y1Options.length === 0}
                >
                  <SelectTrigger id="y1">
                    <SelectValue placeholder={y1Options.length > 0 ? "Select y" : "Enter x first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {y1Options.map((y, idx) => (
                      <SelectItem key={idx} value={`${y}`}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {point1 && (
              <p className="text-xs text-muted-foreground">
                Selected: {pointToString(point1)}
              </p>
            )}
          </div>

          {/* Point 2 */}
          <div className="space-y-3 p-4 border rounded-lg">
            <Label className="text-sm font-semibold">Point 2 (for addition)</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="x2" className="text-xs">x-coordinate</Label>
                <Input
                  id="x2"
                  type={curve.useFp ? "number" : "text"}
                  value={x2}
                  onChange={(e) => setX2(e.target.value)}
                  placeholder={curve.useFp ? "e.g., 71" : "e.g., 2.5"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="y2" className="text-xs">y-coordinate</Label>
                <Select
                  value={point2 ? `${point2.y}` : ""}
                  onValueChange={(value) => {
                    const xValue = curve.useFp ? parseInt(x2) : parseFloat(x2);
                    const yValue = parseFloat(value);
                    setPoint2({ x: xValue, y: yValue, isInfinity: false });
                  }}
                  disabled={y2Options.length === 0}
                >
                  <SelectTrigger id="y2">
                    <SelectValue placeholder={y2Options.length > 0 ? "Select y" : "Enter x first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {y2Options.map((y, idx) => (
                      <SelectItem key={idx} value={`${y}`}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {point2 && (
              <p className="text-xs text-muted-foreground">
                Selected: {pointToString(point2)}
              </p>
            )}
          </div>

          {/* Option for Point at Infinity */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPoint1(POINT_AT_INFINITY)}
              className="flex-1"
            >
              Set P1 as O (∞)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPoint2(POINT_AT_INFINITY)}
              className="flex-1"
            >
              Set P2 as O (∞)
            </Button>
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
