import { useState, useEffect, useCallback } from "react";
import { RevenueCatService } from "@/lib/revenueCat";
import { toast } from "sonner";
import { CustomerInfo, PurchasesPackage } from "@revenuecat/purchases-capacitor";

export function useSubscription() {
    const [isLoading, setIsLoading] = useState(true);
    const [offerings, setOfferings] = useState<{
        monthly?: PurchasesPackage;
        yearly?: PurchasesPackage;
    }>({});
    const [isPro, setIsPro] = useState(false);
    const [isReturningUser, setIsReturningUser] = useState(false);
    const [planInterval, setPlanInterval] = useState<"monthly" | "yearly" | null>(null);
    const [latestPurchaseDate, setLatestPurchaseDate] = useState<string | null>(null);

    useEffect(() => {
        async function init() {
            try {
                await RevenueCatService.configure();
                const currentOfferings = await RevenueCatService.getOfferings();
                if (currentOfferings) {
                    setOfferings({
                        monthly: currentOfferings.availablePackages.find(p => p.packageType === "MONTHLY"),
                        yearly: currentOfferings.availablePackages.find(p => p.packageType === "ANNUAL")
                    });
                }

                // key check for returning user
                const info = await RevenueCatService.getCustomerInfo();
                if (info) {
                    const activePro = info.entitlements.active["pro"];
                    const hasActivePro = typeof activePro !== 'undefined';
                    const hasPastPro = typeof info.entitlements.all["pro"] !== 'undefined';

                    if (hasActivePro) {
                        setIsPro(true);
                        setPlanInterval(activePro.productIdentifier.toLowerCase().includes("yearly") ? "yearly" : "monthly");
                        setLatestPurchaseDate(activePro.latestPurchaseDate);
                    }

                    // Returning user = Has past entitlement but NO active entitlement
                    if (hasPastPro && !hasActivePro) {
                        setIsReturningUser(true);
                    }
                }

            } catch (e) {
                console.error("Subscription init error:", e);
            } finally {
                setIsLoading(false);
            }
        }
        init();
    }, []);

    const purchase = async (pkg: PurchasesPackage) => {
        try {
            setIsLoading(true);
            const info = await RevenueCatService.purchasePackage(pkg);
            const activePro = info?.entitlements.active["pro"];
            if (info && activePro) { // Assuming "pro" is the identifier
                setIsPro(true);
                setPlanInterval(activePro.productIdentifier.toLowerCase().includes("yearly") ? "yearly" : "monthly");
                setLatestPurchaseDate(activePro.latestPurchaseDate);
                toast.success("Welcome to Pro!");
                return true;
            }
        } catch (e: any) {
            if (!e.userCancelled) {
                toast.error("Purchase failed: " + e.message);
            }
        } finally {
            setIsLoading(false);
        }
        return false;
    };

    const restore = async () => {
        try {
            setIsLoading(true);
            const info = await RevenueCatService.restorePurchases();
            if (info) {
                const activePro = info.entitlements.active["pro"];
                if (activePro) {
                    setIsPro(true);
                    setPlanInterval(activePro.productIdentifier.toLowerCase().includes("yearly") ? "yearly" : "monthly");
                    setLatestPurchaseDate(activePro.latestPurchaseDate);
                    toast.success("Purchases restored!");
                    return true;
                } else {
                    toast.info("No active subscriptions found to restore.");
                }
            }
        } catch (e: any) {
            toast.error("Restore failed: " + e.message);
        } finally {
            setIsLoading(false);
        }
        return false;
    };

    const getPrice = (pkg?: PurchasesPackage) => {
        return pkg?.product.priceString || "";
    };

    return {
        isLoading,
        offerings,
        purchase,
        restore,
        isPro,
        planInterval,
        latestPurchaseDate,
        isReturningUser,
        getPrice
    };
}
