import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Loader2, ShieldCheck, Smartphone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatINR } from "@/lib/format";
import { fireConfetti } from "@/components/site/EasterEggs";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  amount: number;
  title: string;
  onConfirm: () => Promise<void> | void;
};

/** Simulated checkout — no real payment is processed. */
export default function PaymentModal({ open, onOpenChange, amount, title, onConfirm }: Props) {
  const [processing, setProcessing] = useState(false);

  const pay = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1400));
    try {
      await onConfirm();
      fireConfetti(true);
      onOpenChange(false);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Checkout</DialogTitle>
          <DialogDescription>
            {title} · <span className="font-semibold text-orange-600">{formatINR(amount)}</span>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="upi">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="upi"><Smartphone className="mr-1.5 h-4 w-4" />UPI</TabsTrigger>
            <TabsTrigger value="card"><CreditCard className="mr-1.5 h-4 w-4" />Card</TabsTrigger>
          </TabsList>
          <TabsContent value="upi" className="space-y-3 pt-3">
            <Label>UPI ID</Label>
            <Input placeholder="you@okhdfc" />
          </TabsContent>
          <TabsContent value="card" className="space-y-3 pt-3">
            <Label>Card number</Label>
            <Input placeholder="4242 4242 4242 4242" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="MM/YY" />
              <Input placeholder="CVV" type="password" />
            </div>
          </TabsContent>
        </Tabs>

        <Button onClick={pay} disabled={processing} className="w-full btn-shine" size="lg">
          {processing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…</>
          ) : (
            <>Pay {formatINR(amount)}</>
          )}
        </Button>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 justify-center">
          <ShieldCheck className="h-3.5 w-3.5" />
          Demo checkout — no real money is charged.
        </p>
        {processing && (
          <motion.div
            className="text-center text-xs text-orange-600 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Talking to the (imaginary) bank…
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}
