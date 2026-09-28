import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import tonLogo from "@assets/images_(25)_1787362424281.png";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutModal({ open, onClose }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
              <img src={tonLogo} alt="Stone by ton" className="w-10 h-10 object-contain" />
            </div>
             About Stone by ton
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
             Stone by ton is a French company founded in 2013, specializing in the online and physical sale of natural stone, travertine, tiles, and wall cladding.
          </p>
          <p>
             Based in Six-Fours-les-Plages in Var, the brand offers a wide range of coverings for indoor and outdoor floors and walls.
          </p>
          <div className="bg-secondary rounded-lg p-4 space-y-2">
             <h4 className="font-medium text-foreground">Our advantages:</h4>
            <ul className="space-y-1">
               <li>- Automatic daily earnings</li>
               <li>- Quality robotic products</li>
               <li>- Attractive referral system</li>
               <li>- Customer support available</li>
            </ul>
          </div>
          <p className="text-xs">
             Version 1.0.0 - All rights reserved
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
