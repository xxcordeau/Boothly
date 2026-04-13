import { useState } from "react";
import { CreditCard, Banknote, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { processNayaxPayment, PaymentMethod } from "../utils/nayaxPayment";
import { useIsMobile } from "./ui/use-mobile";
import { PageHeader } from "./PageHeader";

interface PaymentSelectorProps {
  amount: number;
  onPaymentSuccess: () => void;
  onBack: () => void;
}

type PaymentState = "selection" | "processing" | "success" | "failed";

export const PaymentSelector = ({
  amount,
  onPaymentSuccess,
  onBack,
}: PaymentSelectorProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [paymentState, setPaymentState] = useState<PaymentState>("selection");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handlePayment = async (method: PaymentMethod) => {
    setSelectedMethod(method);
    setPaymentState("processing");
    setErrorMessage("");
    try {
      const response = await processNayaxPayment({ amount, method });
      if (response.success) {
        setPaymentState("success");
        setTimeout(() => onPaymentSuccess(), 1500);
      } else {
        setPaymentState("failed");
        setErrorMessage(response.error || t.payment.failed);
      }
    } catch (error) {
      setPaymentState("failed");
      setErrorMessage(error instanceof Error ? error.message : t.payment.failed);
    }
  };

  const handleRetry = () => {
    setPaymentState("selection");
    setSelectedMethod(null);
    setErrorMessage("");
  };

  const handleSkipPayment = () => {
    onPaymentSuccess();
  };

  if (paymentState === "processing") {
    return (
      <div className="h-[calc(100dvh-56px)] md:h-[calc(100vh-56px)] flex flex-col items-center justify-center bg-[#F3F3F3] p-6 overflow-hidden">
        <div className="w-full max-w-md">
          <div className="p-10 bg-white border border-stone-200 rounded-2xl shadow-xl">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="w-18 h-18 bg-stone-100 rounded-2xl flex items-center justify-center p-4">
                <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
              </div>
              <div>
                <h2 className="text-stone-900 mb-2 text-xl font-bold">{t.payment.processing}</h2>
                <p className="text-stone-500">{t.payment.pleaseWait}</p>
              </div>
              {selectedMethod === "card" && (
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl w-full">
                  <p className="text-stone-600 text-sm">{t.payment.cardInstructions}</p>
                </div>
              )}
              {selectedMethod === "cash" && (
                <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl w-full">
                  <p className="text-stone-600 text-sm">{t.payment.cashInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentState === "success") {
    return (
      <div className="h-[calc(100dvh-56px)] md:h-[calc(100vh-56px)] flex flex-col items-center justify-center bg-[#F3F3F3] p-6 overflow-hidden">
        <div className="w-full max-w-md">
          <div className="p-10 bg-white border border-stone-200 rounded-2xl shadow-xl">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="bg-stone-50 rounded-2xl p-4">
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-stone-900 mb-2 text-xl font-bold">{t.payment.success}</h2>
                <p className="text-stone-500">{t.camera.preparing}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (paymentState === "failed") {
    return (
      <div className="h-[calc(100dvh-56px)] md:h-[calc(100vh-56px)] flex flex-col items-center justify-center bg-[#F3F3F3] p-6 overflow-hidden">
        <div className="w-full max-w-md">
          <div className="p-10 bg-white border border-stone-200 rounded-2xl shadow-xl">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="bg-red-50 rounded-2xl p-4">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
              <div>
                <h2 className="text-stone-900 mb-2 text-xl font-bold">{t.payment.failed}</h2>
                <p className="text-stone-500">{errorMessage}</p>
              </div>
              <button
                onClick={handleRetry}
                className="w-full bg-stone-900 text-white py-3 rounded-xl font-semibold shadow-sm hover:bg-stone-800 transition-colors"
              >
                {t.payment.tryAgain}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-[calc(100dvh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden page-enter">
        <div className="w-full h-full flex flex-col p-4">
          <PageHeader title={t.payment.title} subtitle={t.payment.subtitle} />

          <div className="text-center flex-shrink-0 mb-4">
            <div className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-xl shadow-sm font-semibold">
              <span className="text-sm opacity-90">{t.payment.totalAmount}</span>
              <span className="text-xl">{amount.toLocaleString()}{t.payment.won}</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-3 justify-center min-h-0">
            <button
              onClick={() => handlePayment("card")}
              className="flex-1 text-left transition-opacity active:opacity-70"
            >
              <div className="h-full p-5 bg-white border border-stone-200 rounded-2xl flex items-center gap-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-stone-900 rounded-xl flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-stone-900 mb-1 text-lg font-bold">{t.payment.card.title}</h2>
                  <p className="text-stone-500 text-xs">{t.payment.card.description}</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => handlePayment("cash")}
              className="flex-1 text-left transition-opacity active:opacity-70"
            >
              <div className="h-full p-5 bg-white border border-stone-200 rounded-2xl flex items-center gap-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-stone-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Banknote className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-stone-900 mb-1 text-lg font-bold">{t.payment.cash.title}</h2>
                  <p className="text-stone-500 text-xs">{t.payment.cash.description}</p>
                </div>
              </div>
            </button>
          </div>

          <div className="text-center flex-shrink-0 pt-3">
            <button
              onClick={handleSkipPayment}
              className="text-stone-400 text-xs underline underline-offset-2 hover:text-stone-600 transition-colors"
            >
              {t.payment.skipPayment}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex flex-col bg-[#F3F3F3] overflow-hidden page-enter">
      <div className="w-full h-full flex flex-col justify-center mx-auto py-4">
        <div className="text-center px-6 pb-5 flex-shrink-0">
          <h1 className="text-stone-900 mb-2 text-5xl font-bold tracking-tight">{t.payment.title}</h1>
          <p className="text-stone-500 mb-5 text-xl">{t.payment.subtitle}</p>
          <div className="inline-flex items-center gap-3 bg-stone-900 text-white px-8 py-4 rounded-2xl shadow-sm font-semibold">
            <span className="text-xl">{t.payment.totalAmount}</span>
            <span className="text-4xl font-bold">{amount.toLocaleString()}{t.payment.won}</span>
          </div>
        </div>

        <div className="flex-shrink-0 px-6 mb-4">
          <div className="grid grid-cols-2 gap-5 w-full max-w-3xl mx-auto">
            <button
              onClick={() => handlePayment("card")}
              className="text-left group transition-transform hover:-translate-y-1"
            >
              <div className="p-8 bg-white border border-stone-200 rounded-2xl h-full shadow-md group-hover:shadow-xl transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-stone-900 rounded-2xl flex items-center justify-center mb-5">
                    <CreditCard className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-stone-900 mb-2 text-2xl font-semibold">{t.payment.card.title}</h2>
                  <p className="text-stone-500 mb-6 text-base">{t.payment.card.description}</p>
                  <div className="w-full bg-stone-900 text-white py-3 px-6 rounded-xl text-base font-semibold">
                    {t.payment.card.button}
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => handlePayment("cash")}
              className="text-left group transition-transform hover:-translate-y-1"
            >
              <div className="p-8 bg-white border border-stone-200 rounded-2xl h-full shadow-md group-hover:shadow-xl transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-stone-600 rounded-2xl flex items-center justify-center mb-5">
                    <Banknote className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-stone-900 mb-2 text-2xl font-semibold">{t.payment.cash.title}</h2>
                  <p className="text-stone-500 mb-6 text-base">{t.payment.cash.description}</p>
                  <div className="w-full bg-stone-600 text-white py-3 px-6 rounded-xl text-base font-semibold">
                    {t.payment.cash.button}
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <div className="text-center px-6 flex-shrink-0">
          <button
            onClick={handleSkipPayment}
            className="text-stone-400 text-sm underline underline-offset-2 hover:text-stone-600 transition-colors"
          >
            {t.payment.skipPayment}
          </button>
        </div>
      </div>
    </div>
  );
};
