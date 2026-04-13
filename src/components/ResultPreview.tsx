import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  Download,
  RotateCcw,
  Share2,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import QRCode from "qrcode";
import {
  saveImage,
  getShareableUrl,
} from "../utils/imageStorage";
import type { PrintOption } from "../types/photobooth";
import { useTranslation } from "../hooks/useTranslation";
import { useIsMobile } from "./ui/use-mobile";
import { PageHeader } from "./PageHeader";

interface ResultPreviewProps {
  imageUrl: string;
  templateName: string;
  printOption?: PrintOption;
  onReset: () => void;
}

export const ResultPreview = ({
  imageUrl,
  templateName,
  printOption,
  onReset,
}: ResultPreviewProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [shareableUrl, setShareableUrl] = useState<string>("");
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  useEffect(() => {
    const cleanupOldImages = async () => {
      try {
        const { deleteOldImages } = await import("../utils/imageStorage");
        await deleteOldImages(24 * 60 * 60 * 1000);
      } catch (err) {
        console.error("Failed to cleanup old images:", err);
      }
    };
    cleanupOldImages();
  }, []);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `photobooth-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    setIsGeneratingQR(true);
    setShowQRDialog(true);

    try {
      let dataUrl = imageUrl;

      if (imageUrl.startsWith("blob:")) {
        const response = await fetch(imageUrl);
        const blob = await response.blob();

        dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } else if (!imageUrl.startsWith("data:image/")) {
        throw new Error("Invalid image URL format");
      }

      if (!dataUrl.startsWith("data:image/")) {
        throw new Error("Converted data URL is not valid");
      }

      const preGeneratedId = (window as any).__photoboothImageId;
      const imageId = await saveImage(dataUrl, templateName, preGeneratedId);
      delete (window as any).__photoboothImageId;

      const url = getShareableUrl(imageId);
      setShareableUrl(url);

      if (!url || url.length === 0) {
        throw new Error("Cannot generate QR code: Invalid URL");
      }

      const qrCode = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: "M",
        type: "image/png",
        color: {
          dark: "#1a1a1a",
          light: "#ffffff",
        },
      });

      if (!qrCode || !qrCode.startsWith("data:image/")) {
        throw new Error("Invalid QR code data URL generated");
      }

      setQrCodeUrl(qrCode);
    } catch (err) {
      console.error("Failed to generate QR code:", err);
      setShowQRDialog(false);
      toast.error(t.result.shareFailed || "공유 링크 생성에 실패했습니다.");
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      toast.success(t.result.shareSuccess || "링크가 복사되었습니다!");
    } catch (err) {
      console.error("Failed to copy:", err);
      toast.error("복사에 실패했습니다.");
    }
  };

  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden page-enter">
        <div className="w-full h-full flex flex-col p-4">
          {/* Celebration header */}
          <div className="flex-shrink-0 text-center mb-3">
            <div className="inline-flex items-center gap-2 bg-white rounded-2xl px-4 py-2 shadow-sm">
              <PartyPopper className="w-5 h-5 text-stone-400" />
              <h2 className="text-stone-900 text-base font-bold">{t.result.title}</h2>
            </div>
          </div>

          <div className="flex-1 bg-white rounded-2xl shadow-sm mb-3 min-h-0 flex items-center justify-center p-3 animate-scale-in">
            <img
              src={imageUrl}
              alt="Photobooth result"
              className="w-full h-full rounded-xl object-contain"
              style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.12))' }}
            />
          </div>

          <div className="flex-shrink-0 space-y-2">
            <Button
              onClick={handleDownload}
              className="w-full bg-stone-900 hover:bg-stone-800 gap-2 rounded-xl h-12 font-semibold shadow-sm"
            >
              <Download className="w-5 h-5" />
              {t.result.downloadImage}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleShare}
                variant="outline"
                className="gap-2 rounded-xl border-stone-200 hover:bg-stone-50 h-11 font-medium"
              >
                <Share2 className="w-4 h-4" />
                {t.common.share}
              </Button>
              <Button
                onClick={onReset}
                variant="outline"
                className="gap-2 rounded-xl border-stone-200 hover:bg-stone-50 h-11 font-medium"
              >
                <RotateCcw className="w-4 h-4" />
                {t.result.retakePhotos}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex items-center justify-center bg-[#F3F3F3] p-6 overflow-hidden page-enter">
      <div className="w-full max-w-5xl h-full flex flex-col py-4">
        <div className="text-center mb-4 flex-shrink-0">
          <div className="inline-flex items-center gap-2.5 bg-white rounded-2xl px-6 py-3 shadow-sm">
            <PartyPopper className="w-6 h-6 text-stone-400" />
            <h2 className="text-stone-900 text-2xl font-bold">{t.result.title}</h2>
          </div>
        </div>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          <div className="bg-white p-4 rounded-2xl shadow-sm flex-1 min-h-0 flex items-center justify-center animate-scale-in">
            <img
              src={imageUrl}
              alt="Photobooth result"
              className="w-full h-full rounded-xl object-contain"
              style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.1))' }}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 flex-shrink-0">
            <Button
              onClick={handleDownload}
              size="lg"
              className="bg-stone-900 hover:bg-stone-800 gap-2 rounded-xl py-5 text-base font-semibold shadow-sm"
            >
              <Download className="w-5 h-5" />
              {t.result.downloadImage}
            </Button>

            <Button
              onClick={handleShare}
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl border-stone-200 hover:bg-stone-50 py-5 text-base font-medium"
            >
              <Share2 className="w-5 h-5" />
              {t.common.share}
            </Button>

            <Button
              onClick={onReset}
              size="lg"
              variant="outline"
              className="gap-2 rounded-xl border-stone-200 hover:bg-stone-50 py-5 text-base font-medium"
            >
              <RotateCcw className="w-5 h-5" />
              {t.result.retakePhotos}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="rounded-2xl max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">
              {t.result.qrShareTitle}
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              {t.result.qrShareDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center p-6">
            {isGeneratingQR ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-stone-600 animate-spin" />
              </div>
            ) : qrCodeUrl ? (
              <>
                <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4">
                  <img src={qrCodeUrl} alt="QR Code" className="w-56 h-56" />
                </div>
                <p className="text-center text-slate-500 mb-4 text-base">
                  {t.result.scanQR}
                </p>
                {shareableUrl && (
                  <div className="w-full">
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={shareableUrl}
                        readOnly
                        className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50"
                        onClick={(e) => e.currentTarget.select()}
                      />
                      <Button
                        onClick={copyToClipboard}
                        variant="outline"
                        size="sm"
                        className="font-medium"
                      >
                        {t.result.copy}
                      </Button>
                    </div>
                    <p className="text-sm text-stone-600 text-center font-medium">
                      {t.result.linkExpiry}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center text-slate-500">QR 코드 생성 실패</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
