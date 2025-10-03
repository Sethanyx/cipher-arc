import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CurveParams } from "@/utils/ellipticCurve";
import { Settings } from "lucide-react";

interface Props {
  onCurveChange: (curve: CurveParams) => void;
  currentCurve: CurveParams;
}

export const CurveConfig = ({ onCurveChange, currentCurve }: Props) => {
  const [a, setA] = useState(currentCurve.a.toString());
  const [b, setB] = useState(currentCurve.b.toString());
  const [p, setP] = useState(currentCurve.p.toString());

  const handleApply = () => {
    const newA = parseInt(a) || 0;
    const newB = parseInt(b) || 0;
    const newP = parseInt(p) || 223;

    const newCurve: CurveParams = {
      a: newA,
      b: newB,
      p: newP,
      G: currentCurve.G, // Keep existing G
      n: currentCurve.n, // Keep existing n
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
          Customize elliptic curve parameters: y² = x³ + ax + b (mod p)
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
            Recommended: p ≤ 1000 for optimal performance. Must be prime for cryptographic applications.
          </p>
        </div>

        <Button onClick={handleApply} className="w-full">
          Apply Curve Parameters
        </Button>
        
        <p className="text-xs text-muted-foreground text-center">
          Base point G and order n are configured in the ECDH Protocol tab
        </p>
      </CardContent>
    </Card>
  );
};
