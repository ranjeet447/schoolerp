import { useEffect, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { Network } from '@capacitor/network';

const WEB_APP_URL = import.meta.env.VITE_WEB_APP_URL || 'http://localhost:3000';

export default function App() {
  const [ready, setReady] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          await StatusBar.setStyle({ style: Style.Light });
          await StatusBar.setBackgroundColor({ color: '#4f46e5' });
        } catch { /* web fallback */ }

        // Handle Android back button
        CapApp.addListener('backButton', async ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
          } else {
            CapApp.exitApp();
          }
        });

        // Network status listener
        Network.addListener('networkStatusChange', status => {
          setIsConnected(status.connected);
        });
        const status = await Network.getStatus();
        setIsConnected(status.connected);

        // App URL listener (deep links)
        CapApp.addListener('appUrlOpen', async (/* { url } */) => {
           // Handle deep links if needed, or let webview handle it
           // For now, we trust the webview to handle routing
        });
      }

      try {
        // Hide splash screen after a short delay to ensure webview is ready
        setTimeout(async () => {
            await SplashScreen.hide();
        }, 1000);
      } catch { /* ignore on web */ }

      setReady(true);
    };

    init();

    return () => {
        if (Capacitor.isNativePlatform()) {
             Network.removeAllListeners();
             CapApp.removeAllListeners();
        }
    }
  }, []);

  if (!ready) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#4f46e5',
        color: 'white',
        fontFamily: 'Inter, sans-serif',
        fontSize: '24px',
        fontWeight: 'bold',
      }}>
        SchoolERP
      </div>
    );
  }

  // Offline state for native app
  if (Capacitor.isNativePlatform() && !isConnected) {
       return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'Inter, sans-serif',
        }}>
            <h2 style={{ marginBottom: '10px' }}>No Internet Connection</h2>
            <p style={{ color: '#666' }}>Please check your network and try again.</p>
            <button 
                onClick={async () => {
                    const status = await Network.getStatus();
                    setIsConnected(status.connected);
                }}
                style={{
                    marginTop: '20px',
                    padding: '10px 20px',
                    background: '#4f46e5',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px'
                }}
            >
                Retry
            </button>
        </div>
       )
  }

  // Native: serve dist/ via Capacitor
  if (Capacitor.isNativePlatform()) {
    // We redirect to root just in case, but really Capacitor handles this via webDir
    return null; 
  }

  // Web/Dev: usage iframe
  return (
    <iframe
      src={WEB_APP_URL}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
      }}
      title="SchoolERP"
    />
  );
}
