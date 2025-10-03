import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { CurveParams, Point } from "@/utils/ellipticCurve";
import { Settings } from "lucide-react";

interface Props {
  onCurveChange: (curve: CurveParams) => void;
  currentCurve: CurveParams;
}

export const CurveConfig = ({ onCurveChange, currentCurve }: Props) => {
  const [a, setA] = useState(currentCurve.a.toString());
  const [b, setB] = useState(currentCurve.b.toString());
  const [useFp, setUseFp] = useState(true);
  const [p, setP] = useState(currentCurve.p.toString());
  const [gx, setGx] = useState(currentCurve.G.x?.toString() || "47");
  const [gy, setGy] = useState(currentCurve.G.y?.toString() || "71");
  const [n, setN] = useState(currentCurve.n.toString());

  const handleApply = () => {
    const newA = parseInt(a) || 0;
    const newB = parseInt(b) || 0;
    const newP = useFp ? parseInt(p) || 223 : 1000000; // Large number for non-Fp visualization
    const newGx = parseInt(gx) || 47;
    const newGy = parseInt(gy) || 71;
    const newN = parseInt(n) || 227;

    const newCurve: CurveParams = {
      a: newA,
      b: newB,
      p: newP,
      G: { x: newGx, y: newGy, isInfinity: false },
      n: newN,
    };

    onCurveChange(newCurve);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Curve Configuration
        </CardTitle>
        <CardDescription>
          Customize elliptic curve parameters: y² = x³ + ax + b {useFp && "(mod p)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="param-a">Parameter a</Label>
            <Input
              id="param-a"
              type="number"
              value={a}
              onChange={(e) => setA(e.target.value)}
              placeholder="e.g., -7"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="param-b">Parameter b</Label>
            <Input
              id="param-b"
              type="number"
              value={b}
              onChange={(e) => setB(e.target.value)}
              placeholder="e.g., 10"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="space-y-0.5">
            <Label htmlFor="use-fp">Use Finite Field (Fp)</Label>
            <p className="text-xs text-muted-foreground">
              Enable modular arithmetic with prime p
            </p>
          </div>
          <Switch
            id="use-fp"
            checked={useFp}
            onCheckedChange={setUseFp}
          />
        </div>

        {useFp && (
          <div className="space-y-2">
            <Label htmlFor="param-p">Prime Modulus (p)</Label>
            <Input
              id="param-p"
              type="number"
              value={p}
              onChange={(e) => setP(e.target.value)}
              placeholder="e.g., 223"
            />
            <p className="text-xs text-muted-foreground">
              Must be a prime number for finite field operations
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="g-x">Base Point G (x)</Label>
            <Input
              id="g-x"
              type="number"
              value={gx}
              onChange={(e) => setGx(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="g-y">Base Point G (y)</Label>
            <Input
              id="g-y"
              type="number"
              value={gy}
              onChange={(e) => setGy(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="param-n">Order of G (n)</Label>
          <Input
            id="param-n"
            type="number"
            value={n}
            onChange={(e) => setN(e.target.value)}
            placeholder="e.g., 227"
          />
        </div>

        <Button onClick={handleApply} className="w-full">
          Apply Curve Parameters
        </Button>
      </CardContent>
    </Card>
  );
};
