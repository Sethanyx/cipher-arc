import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CurveParams, Point, pointToString, generatePrivateKey, computePublicKey, deriveSharedSecret } from "@/utils/ellipticCurve";
import { deriveAESKey, encryptMessage, decryptMessage } from "@/utils/aesEncryption";
import { Key, Send, Lock, Unlock, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  curve: CurveParams;
}

interface PartyKeys {
  privateKey: number | null;
  publicKey: Point | null;
  sharedSecret: Point | null;
  aesKey: CryptoKey | null;
}

export const ECDHSimulator = ({ curve }: Props) => {
  const [alice, setAlice] = useState<PartyKeys>({
    privateKey: null,
    publicKey: null,
    sharedSecret: null,
    aesKey: null,
  });

  const [bob, setBob] = useState<PartyKeys>({
    privateKey: null,
    publicKey: null,
    sharedSecret: null,
    aesKey: null,
  });

  const [message, setMessage] = useState<string>("");
  const [encryptedData, setEncryptedData] = useState<{ ciphertext: string; iv: string } | null>(null);
  const [decryptedMessage, setDecryptedMessage] = useState<string>("");
  const [currentStep, setCurrentStep] = useState<number>(0);

  const generateAliceKeys = () => {
    const privateKey = generatePrivateKey(curve.n);
    const publicKey = computePublicKey(privateKey, curve);
    
    setAlice(prev => ({ ...prev, privateKey, publicKey }));
    setCurrentStep(1);
    toast.success("Alice generated her key pair!");
  };

  const generateBobKeys = () => {
    const privateKey = generatePrivateKey(curve.n);
    const publicKey = computePublicKey(privateKey, curve);
    
    setBob(prev => ({ ...prev, privateKey, publicKey }));
    setCurrentStep(2);
    toast.success("Bob generated his key pair!");
  };

  const exchangeKeys = async () => {
    if (!alice.privateKey || !bob.publicKey || !bob.privateKey || !alice.publicKey) {
      toast.error("Generate keys first!");
      return;
    }

    // Alice computes shared secret
    const aliceShared = deriveSharedSecret(alice.privateKey, bob.publicKey, curve);
    const aliceAESKey = await deriveAESKey(aliceShared.x!, aliceShared.y!);

    // Bob computes shared secret
    const bobShared = deriveSharedSecret(bob.privateKey, alice.publicKey, curve);
    const bobAESKey = await deriveAESKey(bobShared.x!, bobShared.y!);

    // Use functional updates to preserve previous state
    setAlice(prev => ({ ...prev, sharedSecret: aliceShared, aesKey: aliceAESKey }));
    setBob(prev => ({ ...prev, sharedSecret: bobShared, aesKey: bobAESKey }));
    setCurrentStep(3);
    
    // Verify shared secrets match
    if (aliceShared.x === bobShared.x && aliceShared.y === bobShared.y) {
      toast.success("Shared secret established via ECDH! Keys match.");
    } else {
      toast.error("Error: Shared secrets don't match!");
    }
  };

  const encryptAndSend = async () => {
    if (!alice.aesKey || !message) {
      toast.error("Generate shared secret and enter a message first!");
      return;
    }

    try {
      const encrypted = await encryptMessage(message, alice.aesKey);
      setEncryptedData(encrypted);
      setCurrentStep(4);
      toast.success("Alice encrypted the message with AES!");
    } catch (error) {
      toast.error("Encryption failed!");
    }
  };

  const decryptReceived = async () => {
    if (!bob.aesKey || !encryptedData) {
      toast.error("No encrypted message to decrypt!");
      return;
    }

    try {
      console.log("Bob's AES Key:", bob.aesKey);
      console.log("Encrypted data:", encryptedData);
      
      const decrypted = await decryptMessage(
        encryptedData.ciphertext,
        encryptedData.iv,
        bob.aesKey
      );
      setDecryptedMessage(decrypted);
      setCurrentStep(5);
      toast.success("Bob successfully decrypted the message!");
    } catch (error) {
      console.error("Decryption error:", error);
      toast.error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const reset = () => {
    setAlice({ privateKey: null, publicKey: null, sharedSecret: null, aesKey: null });
    setBob({ privateKey: null, publicKey: null, sharedSecret: null, aesKey: null });
    setMessage("");
    setEncryptedData(null);
    setDecryptedMessage("");
    setCurrentStep(0);
  };

  return (
    <div className="space-y-6">
      {/* Protocol Steps */}
      <Card>
        <CardHeader>
          <CardTitle>ECDH + AES Encryption Protocol</CardTitle>
          <CardDescription>
            Complete secure message exchange using elliptic curve key agreement and symmetric encryption
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 1 ? "default" : "outline"}>
                {currentStep >= 1 ? <CheckCircle2 className="h-4 w-4" /> : "1"}
              </Badge>
              <span className={currentStep >= 1 ? "font-medium" : "text-muted-foreground"}>
                Alice generates private key (dA) and public key (QA = dA × G)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 2 ? "default" : "outline"}>
                {currentStep >= 2 ? <CheckCircle2 className="h-4 w-4" /> : "2"}
              </Badge>
              <span className={currentStep >= 2 ? "font-medium" : "text-muted-foreground"}>
                Bob generates private key (dB) and public key (QB = dB × G)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 3 ? "default" : "outline"}>
                {currentStep >= 3 ? <CheckCircle2 className="h-4 w-4" /> : "3"}
              </Badge>
              <span className={currentStep >= 3 ? "font-medium" : "text-muted-foreground"}>
                Exchange public keys and compute shared secret (dA × QB = dB × QA)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 4 ? "default" : "outline"}>
                {currentStep >= 4 ? <CheckCircle2 className="h-4 w-4" /> : "4"}
              </Badge>
              <span className={currentStep >= 4 ? "font-medium" : "text-muted-foreground"}>
                Alice encrypts message using AES with derived key
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={currentStep >= 5 ? "default" : "outline"}>
                {currentStep >= 5 ? <CheckCircle2 className="h-4 w-4" /> : "5"}
              </Badge>
              <span className={currentStep >= 5 ? "font-medium" : "text-muted-foreground"}>
                Bob decrypts message using AES with same derived key
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Alice */}
        <Card className="border-secondary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-secondary" />
              Alice
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateAliceKeys} className="w-full" variant="secondary">
              Generate Alice's Keys
            </Button>

            {alice.privateKey && (
              <div className="space-y-2">
                <Label className="text-xs">Private Key (dA)</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{alice.privateKey}</p>
              </div>
            )}

            {alice.publicKey && (
              <div className="space-y-2">
                <Label className="text-xs">Public Key (QA = dA × G)</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                  {pointToString(alice.publicKey)}
                </p>
              </div>
            )}

            {alice.sharedSecret && (
              <div className="space-y-2">
                <Label className="text-xs">Shared Secret (dA × QB)</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                  {pointToString(alice.sharedSecret)}
                </p>
                <Badge variant="outline" className="mt-1">AES Key Derived</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bob */}
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Bob
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={generateBobKeys} className="w-full">
              Generate Bob's Keys
            </Button>

            {bob.privateKey && (
              <div className="space-y-2">
                <Label className="text-xs">Private Key (dB)</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded">{bob.privateKey}</p>
              </div>
            )}

            {bob.publicKey && (
              <div className="space-y-2">
                <Label className="text-xs">Public Key (QB = dB × G)</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                  {pointToString(bob.publicKey)}
                </p>
              </div>
            )}

            {bob.sharedSecret && (
              <div className="space-y-2">
                <Label className="text-xs">Shared Secret (dB × QA)</Label>
                <p className="text-sm font-mono bg-muted p-2 rounded break-all">
                  {pointToString(bob.sharedSecret)}
                </p>
                <Badge variant="outline" className="mt-1">AES Key Derived</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key Exchange */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={exchangeKeys}
            disabled={!alice.publicKey || !bob.publicKey}
            className="w-full"
            size="lg"
          >
            <ArrowRight className="mr-2 h-5 w-5" />
            Exchange Public Keys & Compute Shared Secret
          </Button>
        </CardContent>
      </Card>

      {/* Message Exchange */}
      <Card>
        <CardHeader>
          <CardTitle>Secure Message Exchange</CardTitle>
          <CardDescription>
            Alice encrypts a message with AES, Bob decrypts it
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Alice's Message</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message to encrypt..."
              rows={3}
            />
          </div>

          <Button
            onClick={encryptAndSend}
            disabled={!alice.aesKey || !message}
            className="w-full"
            variant="secondary"
          >
            <Lock className="mr-2 h-4 w-4" />
            Encrypt with AES & Send to Bob
          </Button>

          {encryptedData && (
            <div className="space-y-2">
              <Label>Encrypted Ciphertext (sent over network)</Label>
              <p className="text-xs font-mono bg-muted p-3 rounded break-all">
                {encryptedData.ciphertext}
              </p>
              <Label className="text-xs">IV: {encryptedData.iv}</Label>
            </div>
          )}

          <Button
            onClick={decryptReceived}
            disabled={!bob.aesKey || !encryptedData}
            className="w-full"
          >
            <Unlock className="mr-2 h-4 w-4" />
            Bob Decrypts with AES
          </Button>

          {decryptedMessage && (
            <div className="space-y-2">
              <Label>Decrypted Message</Label>
              <p className="text-lg font-medium bg-accent/10 text-accent-foreground p-4 rounded">
                {decryptedMessage}
              </p>
              <Badge variant="default" className="mt-2">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Successfully Decrypted!
              </Badge>
            </div>
          )}

          <Button onClick={reset} variant="outline" className="w-full">
            Reset Simulation
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
