import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";

// Define your API keys
const API_KEYS = {
    ios: import.meta.env.VITE_REVENUECAT_IOS_KEY || "",
    android: import.meta.env.VITE_REVENUECAT_ANDROID_KEY || "",
};

export class RevenueCatService {
    static async configure() {
        if (!Capacitor.isNativePlatform()) {
            console.log("RevenueCat: Skipping configuration on web");
            return;
        }

        try {
            Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

            if (Capacitor.getPlatform() === 'ios') {
                await Purchases.configure({ apiKey: API_KEYS.ios });
            } else if (Capacitor.getPlatform() === 'android') {
                await Purchases.configure({ apiKey: API_KEYS.android });
            }

            console.log("RevenueCat: Configured successfully");
        } catch (error) {
            console.error("RevenueCat: Configuration failed", error);
        }
    }

    static async identify(userId: string) {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await Purchases.logIn({ appUserID: userId });
            console.log("RevenueCat: Identified user", userId);
        } catch (error) {
            console.error("RevenueCat: Identify failed", error);
        }
    }

    static async reset() {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await Purchases.logOut();
            console.log("RevenueCat: Reset/Logged out");
        } catch (error) {
            console.error("RevenueCat: Reset failed", error);
        }
    }

    static async getOfferings() {
        if (!Capacitor.isNativePlatform()) return null;
        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current;
        } catch (error) {
            console.error("RevenueCat: Failed to get offerings", error);
            return null;
        }
    }

    static async getCustomerInfo() {
        if (!Capacitor.isNativePlatform()) return null;
        try {
            const { customerInfo } = await Purchases.getCustomerInfo();
            return customerInfo;
        } catch (error) {
            console.error("RevenueCat: Failed to get customer info", error);
            return null;
        }
    }

    static async purchasePackage(verifiedPackage: any) {
        if (!Capacitor.isNativePlatform()) return null;
        try {
            const { customerInfo } = await Purchases.purchasePackage({ aPackage: verifiedPackage });
            return customerInfo;
        } catch (error: any) {
            if (error.userCancelled) return null;
            throw error;
        }
    }

    static async restorePurchases() {
        if (!Capacitor.isNativePlatform()) return null;
        try {
            const { customerInfo } = await Purchases.restorePurchases();
            return customerInfo;
        } catch (error) {
            console.error("RevenueCat: Restore failed", error);
            throw error;
        }
    }
}
