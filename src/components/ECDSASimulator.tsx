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
    toast.success("Generated signer's key pair!");
  };

  const signDoc = () => {
    if (!signerPrivateKey || !message) {
      toast.error("Please generate keys and enter a message first!");
      return;
    }

    try {
      const sig = signMessage(message, signerPrivateKey, curve);
      setSignature(sig);
      setTamperedMessage(message);
      setVerificationResult(null);
      setCurrentStep(2);
      toast.success("Message signed with private key!");
    } catch (error) {
      toast.error("Signing failed!");
      console.error(error);
    }
  };

  const verify = (messageToVerify: string) => {
    if (!signature || !signerPublicKey) {
      toast.error("No signature to verify!");
      return;
    }

    try {
      const isValid = verifySignature(messageToVerify, signature, signerPublicKey, curve);
      setVerificationResult(isValid);
      setCurrentStep(3);
      
      if (isValid) {
        toast.success("✓ Signature verification successful! Message is authentic.");
      } else {
        toast.error("✗ Signature verification failed! Message may be tampered.");
      }
    } catch (error) {
      toast.error("Verification error!");
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
          <CardTitle>ECDSA Digital Signature Protocol</CardTitle>
          <CardDescription>
            Sign and verify messages using Elliptic Curve Digital Signature Algorithm
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 1 ? "default" : "outline"}>
                {currentStep >= 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </Badge>
              <span className={currentStep >= 1 ? "font-medium" : "text-muted-foreground"}>
                Generate signer's private key (d) and public key (Q = d × G)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 2 ? "default" : "outline"}>
                {currentStep >= 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
              </Badge>
              <span className={currentStep >= 2 ? "font-medium" : "text-muted-foreground"}>
                Sign the message with private key to generate signature (r, s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 3 ? "default" : "outline"}>
                {currentStep >= 3 ? <CheckCircle2 className="h-4 w-4" /> : "3"}
              </Badge>
              <span className={currentStep >= 3 ? "font-medium" : "text-muted-foreground"}>
                Verify signature validity using public key
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
            Key Generation
          </CardTitle>
          <CardDescription>
            Signer generates elliptic curve key pair
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generateKeys} className="w-full">
            <Shield className="mr-2 h-4 w-4" />
            Generate Signing Key Pair
          </Button>

          {signerPrivateKey && (
            <div className="space-y-2">
              <Label className="text-xs">Private Key (d) - Secret</Label>
              <p className="text-sm font-mono bg-muted p-2 rounded">{signerPrivateKey}</p>
            </div>
          )}

          {signerPublicKey && (
            <div className="space-y-2">
              <Label className="text-xs">Public Key (Q = d × G) - Public</Label>
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
            Message Signing
          </CardTitle>
          <CardDescription>
            Generate digital signature for the message using private key
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Original Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter message to sign..."
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
            Sign with Private Key
          </Button>

          {signature && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <Label className="text-sm font-semibold">Digital Signature (r, s)</Label>
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
              Signature Verification
            </CardTitle>
            <CardDescription>
              Verify message signature authenticity using public key
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {/* Original Message Verification */}
              <div className="p-4 border rounded-lg space-y-3">
                <Label className="text-sm font-semibold">Verify Original Message</Label>
                <p className="text-sm bg-muted p-3 rounded">{message}</p>
                <Button
                  onClick={() => verify(message)}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Verify Original Message Signature
                </Button>
              </div>

              {/* Tampered Message Verification */}
              <div className="p-4 border border-destructive/30 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <Label className="text-sm font-semibold">Try Verifying Tampered Message</Label>
                </div>
                <Textarea
                  value={tamperedMessage}
                  onChange={(e) => setTamperedMessage(e.target.value)}
                  placeholder="Modify the message to test..."
                  rows={3}
                />
                <Button
                  onClick={() => verify(tamperedMessage)}
                  className="w-full"
                  variant="destructive"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Verify Modified Message
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
                      <span className="font-semibold text-green-500">Verification Successful</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-destructive" />
                      <span className="font-semibold text-destructive">Verification Failed</span>
                    </>
                  )}
                </div>
                <p className="text-sm mt-2 text-muted-foreground">
                  {verificationResult 
                    ? "Signature is valid. Message has not been tampered with and was indeed signed by the private key holder."
                    : "Signature is invalid! Message may have been tampered with or signature does not match."
                  }
                </p>
              </div>
            )}

            <Button onClick={reset} variant="outline" className="w-full">
              Reset Demo
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Educational Info */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">How ECDSA Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><strong>Signature Generation:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
            <li>Calculate message hash z = hash(message)</li>
            <li>Generate random k, calculate point (x, y) = k × G</li>
            <li>r = x mod n</li>
            <li>s = k⁻¹(z + r·d) mod n</li>
            <li>Signature is (r, s)</li>
          </ul>
          <p className="mt-3"><strong>Signature Verification:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
            <li>Calculate w = s⁻¹ mod n</li>
            <li>u₁ = z·w mod n, u₂ = r·w mod n</li>
            <li>Calculate point (x, y) = u₁×G + u₂×Q</li>
            <li>Verify r ≡ x (mod n)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
