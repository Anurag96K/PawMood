
import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

export const MobileAuthListener = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Only run on native platforms
        if (!Capacitor.isNativePlatform()) return;

        let urlListener: any = null;

        const handleUrlParam = async (url: string) => {
            console.log('MobileAuthListener: Processing URL:', url);

            // Check if it's our auth callback
            // We use 'google-auth' as the universal redirect path for this app
            if (url.includes('google-auth')) {
                console.log('MobileAuthListener: Auth callback detected');

                const hashIndex = url.indexOf('#');
                const queryIndex = url.indexOf('?');

                let paramsStr = '';
                if (hashIndex !== -1) {
                    paramsStr = url.substring(hashIndex + 1);
                } else if (queryIndex !== -1) {
                    paramsStr = url.substring(queryIndex + 1);
                }

                if (!paramsStr) return;

                const params = new URLSearchParams(paramsStr);
                const accessToken = params.get('access_token');
                const refreshToken = params.get('refresh_token');
                const code = params.get('code');

                console.log('MobileAuthListener: Extraction results:', {
                    hasAccess: !!accessToken,
                    hasRefresh: !!refreshToken,
                    hasCode: !!code
                });

                if (accessToken && refreshToken) {
                    console.log('MobileAuthListener: Setting session via tokens...');
                    const { error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken,
                    });

                    if (error) {
                        console.error('MobileAuthListener: Error setting session:', error);
                    } else {
                        console.log('MobileAuthListener: Session set successfully');
                        // No need to navigate if we are already seeing the session reflect
                    }
                } else if (code) {
                    console.log('MobileAuthListener: Exchanging code for session...');
                    const { error } = await supabase.auth.exchangeCodeForSession(code);
                    if (error) {
                        console.error('MobileAuthListener: Error exchanging code:', error);
                    } else {
                        console.log('MobileAuthListener: Code exchange successful');
                    }
                } else {
                    console.warn('MobileAuthListener: No tokens or code found in deep link');
                }
            }
        };

        const setupListener = async () => {
            // Listener for app opening from background/foreground
            urlListener = await App.addListener('appUrlOpen', (event) => {
                handleUrlParam(event.url);
            });

            // Handle cold start
            const launchUrl = await App.getLaunchUrl();
            if (launchUrl?.url) {
                console.log('MobileAuthListener: Launch URL detected:', launchUrl.url);
                handleUrlParam(launchUrl.url);
            }
        };

        setupListener();

        return () => {
            if (urlListener) {
                urlListener.remove();
            }
        };
    }, [navigate]);

    return null;
};
