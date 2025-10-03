import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EllipticCurveCanvas } from "@/components/EllipticCurveCanvas";
import { PointCalculator } from "@/components/PointCalculator";
import { ECDHSimulator } from "@/components/ECDHSimulator";
import { defaultCurve, Point, POINT_AT_INFINITY } from "@/utils/ellipticCurve";
import { Lock } from "lucide-react";

const Index = () => {
  const [visualizationLine, setVisualizationLine] = useState<{
    from: Point;
    to: Point;
    result?: Point;
  } | null>(null);

  const handleVisualize = (p1: Point, p2: Point, result: Point) => {
    if (p1.isInfinity || p2.isInfinity) {
      setVisualizationLine(null);
    } else {
      setVisualizationLine({ from: p1, to: p2, result });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-secondary">
              <Lock className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Elliptic Curve Cryptography
              </h1>
              <p className="text-sm text-muted-foreground">
                Interactive visualization and ECDH protocol simulator
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="visualization" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="visualization">Curve & Operations</TabsTrigger>
            <TabsTrigger value="protocol">ECDH Protocol</TabsTrigger>
          </TabsList>

          <TabsContent value="visualization" className="space-y-6">
            {/* Curve Info */}
            <Card>
              <CardHeader>
                <CardTitle>Elliptic Curve Parameters</CardTitle>
                <CardDescription>
                  Curve equation: y² = x³ + ax + b (mod p)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">a:</span>
                    <span className="ml-2 font-mono font-medium">{defaultCurve.a}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">b:</span>
                    <span className="ml-2 font-mono font-medium">{defaultCurve.b}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">p:</span>
                    <span className="ml-2 font-mono font-medium">{defaultCurve.p}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">G:</span>
                    <span className="ml-2 font-mono font-medium">
                      ({defaultCurve.G.x}, {defaultCurve.G.y})
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">n:</span>
                    <span className="ml-2 font-mono font-medium">{defaultCurve.n}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-[1fr,400px] gap-6">
              {/* Visualization */}
              <Card>
                <CardHeader>
                  <CardTitle>Curve Visualization</CardTitle>
                  <CardDescription>
                    Points on the elliptic curve with operation visualization
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <EllipticCurveCanvas
                    curve={defaultCurve}
                    line={visualizationLine || undefined}
                  />
                </CardContent>
              </Card>

              {/* Calculator */}
              <PointCalculator curve={defaultCurve} onVisualize={handleVisualize} />
            </div>
          </TabsContent>

          <TabsContent value="protocol">
            <ECDHSimulator curve={defaultCurve} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Educational tool for understanding Elliptic Curve Cryptography</p>
          <p className="mt-1">ECDH Key Exchange + AES Symmetric Encryption</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
