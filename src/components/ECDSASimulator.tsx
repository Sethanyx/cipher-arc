import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  CurveParams, 
  Point, 
  Signature,
  pointToString, 
  generatePrivateKey, 
  computePublicKey, 
  signMessage,
  verifySignature
} from "@/utils/ellipticCurve";
import { Key, FileSignature, CheckCircle2, XCircle, Shield, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  curve: CurveParams;
}

export const ECDSASimulator = ({ curve }: Props) => {
  const [signerPrivateKey, setSignerPrivateKey] = useState<number | null>(null);
  const [signerPublicKey, setSignerPublicKey] = useState<Point | null>(null);
  const [message, setMessage] = useState<string>("");
  const [signature, setSignature] = useState<Signature | null>(null);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [tamperedMessage, setTamperedMessage] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(0);

  const generateKeys = () => {
    const privateKey = generatePrivateKey(curve.n);
    const publicKey = computePublicKey(privateKey, curve);
    
    setSignerPrivateKey(privateKey);
    setSignerPublicKey(publicKey);
    setSignature(null);
    setVerificationResult(null);
    setCurrentStep(1);
    toast.success("生成了签名者的密钥对!");
  };

  const signDoc = () => {
    if (!signerPrivateKey || !message) {
      toast.error("请先生成密钥并输入消息！");
      return;
    }

    try {
      const sig = signMessage(message, signerPrivateKey, curve);
      setSignature(sig);
      setTamperedMessage(message);
      setVerificationResult(null);
      setCurrentStep(2);
      toast.success("消息已使用私钥签名！");
    } catch (error) {
      toast.error("签名失败！");
      console.error(error);
    }
  };

  const verify = (messageToVerify: string) => {
    if (!signature || !signerPublicKey) {
      toast.error("没有可验证的签名！");
      return;
    }

    try {
      const isValid = verifySignature(messageToVerify, signature, signerPublicKey, curve);
      setVerificationResult(isValid);
      setCurrentStep(3);
      
      if (isValid) {
        toast.success("✓ 签名验证成功！消息未被篡改。");
      } else {
        toast.error("✗ 签名验证失败！消息可能被篡改。");
      }
    } catch (error) {
      toast.error("验证过程出错！");
      console.error(error);
    }
  };

  const reset = () => {
    setSignerPrivateKey(null);
    setSignerPublicKey(null);
    setMessage("");
    setSignature(null);
    setVerificationResult(null);
    setTamperedMessage("");
    setCurrentStep(0);
  };

  return (
    <div className="space-y-6">
      {/* Protocol Steps */}
      <Card>
        <CardHeader>
          <CardTitle>ECDSA 数字签名协议</CardTitle>
          <CardDescription>
            使用椭圆曲线数字签名算法进行消息签名和验证
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 1 ? "default" : "outline"}>
                {currentStep >= 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </Badge>
              <span className={currentStep >= 1 ? "font-medium" : "text-muted-foreground"}>
                生成签名者的私钥 (d) 和公钥 (Q = d × G)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 2 ? "default" : "outline"}>
                {currentStep >= 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
              </Badge>
              <span className={currentStep >= 2 ? "font-medium" : "text-muted-foreground"}>
                使用私钥对消息进行签名，生成签名 (r, s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 3 ? "default" : "outline"}>
                {currentStep >= 3 ? <CheckCircle2 className="h-4 w-4" /> : "3"}
              </Badge>
              <span className={currentStep >= 3 ? "font-medium" : "text-muted-foreground"}>
                使用公钥验证签名的有效性
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Generation */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            密钥生成
          </CardTitle>
          <CardDescription>
            签名者生成椭圆曲线密钥对
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateKeys} className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            生成签名密钥对
          </Button>

          {signerPrivateKey && (
            <div className="space-y-2">
              <Label className="text-xs">私钥 (d) - 保密</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded">{signerPrivateKey}</p>
            </div>
          )}

          {signerPublicKey && (
            <div className="space-y-2">
              <Label className="text-xs">公钥 (Q = d × G) - 公开</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                {pointToString(signerPublicKey)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Signing */}
      <Card className="border-secondary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-secondary" />
            消息签名
          </CardTitle>
          <CardDescription>
            使用私钥对消息生成数字签名
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>原始消息</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="输入要签名的消息..."
              rows={3}
            />
          </div>

          <Button
            onClick={signDoc}
            disabled={!signerPrivateKey || !message}
            className="w-full"
            variant="secondary"
          >
            <FileSignature className="mr-2 h-4 w-4" />
            使用私钥签名
          </Button>

          {signature && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-semibold">数字签名 (r, s)</Label>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs text-muted-foreground">r:</Label>
                  <p className="text-sm font-mono bg-background p-2 rounded mt-1">
                    {signature.r}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">s:</Label>
                  <p className="text-sm font-mono bg-background p-2 rounded mt-1">
                    {signature.s}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Signature Verification */}
      {signature && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              签名验证
            </CardTitle>
            <CardDescription>
              使用公钥验证消息签名的真实性
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Original Message Verification */}
              <div className="p-4 border rounded-lg space-y-3">
                <Label className="text-sm font-semibold">验证原始消息</Label>
                <p className="text-sm bg-muted p-3 rounded">{message}</p>
                <Button
                  onClick={() => verify(message)}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  验证原始消息签名
                </Button>
              </div>

              {/* Tampered Message Verification */}
              <div className="p-4 border border-destructive/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <Label className="text-sm font-semibold">尝试验证篡改后的消息</Label>
                </div>
                <Textarea
                  value={tamperedMessage}
                  onChange={(e) => setTamperedMessage(e.target.value)}
                  placeholder="修改消息内容来测试..."
                  rows={3}
                />
                <Button
                  onClick={() => verify(tamperedMessage)}
                  className="w-full"
                  variant="destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  验证修改后的消息
                </Button>
              </div>
            </div>

            {verificationResult !== null && (
              <div className={`p-4 rounded-lg border-2 ${
                verificationResult 
                  ? "bg-green-500/10 border-green-500/50" 
                  : "bg-destructive/10 border-destructive/50"
              }`}>
                <div className="flex items-center gap-2">
                  {verificationResult ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-green-500">验证成功</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="font-semibold text-destructive">验证失败</span>
                    </>
                  )}
                </div>
                <p className="text-sm mt-2 text-muted-foreground">
                  {verificationResult 
                    ? "签名有效，消息未被篡改，确实由私钥持有者签名。"
                    : "签名无效！消息可能被篡改，或签名不匹配。"
                  }
                </p>
              </div>
            )}

            <Button onClick={reset} variant="outline" className="w-full">
              重置演示
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Educational Info */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">ECDSA 工作原理</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>签名生成：</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
            <li>计算消息哈希 z = hash(message)</li>
            <li>生成随机数 k，计算点 (x, y) = k × G</li>
            <li>r = x mod n</li>
            <li>s = k⁻¹(z + r·d) mod n</li>
            <li>签名为 (r, s)</li>
          </ul>
          <p className="mt-3"><strong>签名验证：</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
            <li>计算 w = s⁻¹ mod n</li>
            <li>u₁ = z·w mod n，u₂ = r·w mod n</li>
            <li>计算点 (x, y) = u₁×G + u₂×Q</li>
            <li>验证 r ≡ x (mod n)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
