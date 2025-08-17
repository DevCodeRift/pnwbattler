'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../stores';

export default function LoginPage() {
  const { data: session } = useSession();
  const { isVerified } = useAuthStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [animatedText, setAnimatedText] = useState('');

  const matrixTexts = useMemo(() => [
    'INITIALIZING SECURE CONNECTION...',
    'ACCESSING POLITICS & WAR DATABASE...',
    'ESTABLISHING ENCRYPTED CHANNEL...',
    'VALIDATING DIGITAL CREDENTIALS...',
    'PREPARING BATTLE SIMULATION...',
    'READY FOR AUTHENTICATION'
  ], []);

  useEffect(() => {
    // Redirect if already authenticated and verified
    if (session && isVerified) {
      router.push('/dashboard');
      return;
    }

    // Matrix text animation
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeText = () => {
      const currentText = matrixTexts[currentIndex];
      
      if (!isDeleting) {
        setAnimatedText(currentText.slice(0, charIndex + 1));
        charIndex++;
        
        if (charIndex === currentText.length) {
          setTimeout(() => {
            isDeleting = true;
          }, 2000);
        }
      } else {
        setAnimatedText(currentText.slice(0, charIndex));
        charIndex--;
        
        if (charIndex === 0) {
          isDeleting = false;
          currentIndex = (currentIndex + 1) % matrixTexts.length;
        }
      }
    };

    const interval = setInterval(typeText, isDeleting ? 50 : 100);
    return () => clearInterval(interval);
  }, [session, isVerified, router, matrixTexts]);

  const handleDiscordLogin = async () => {
    setLoading(true);
    try {
      await signIn('discord', { callbackUrl: '/verify' });
    } catch (error) {
      console.error('Login failed:', error);
      setLoading(false);
    }
  };

  const MatrixRain = () => {
    const columns = 50;
    const drops = Array.from({ length: columns }, () => Math.random() * 20);
    
    return (
      <div className="matrix-rain">
        {drops.map((drop, i) => (
          <div
            key={i}
            className="matrix-column"
            style={{
              left: `${(i / columns) * 100}%`,
              animationDelay: `${drop}s`,
            }}
          >
            {Array.from({ length: 20 }, (_, j) => (
              <div key={j} className="matrix-char">
                {String.fromCharCode(0x30A0 + Math.random() * 96)}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <style jsx>{`
        .matrix-rain {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
          pointer-events: none;
        }
        
        .matrix-column {
          position: absolute;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          color: #00ff41;
          animation: fall 10s linear infinite;
          opacity: 0.8;
        }
        
        .matrix-char {
          text-shadow: 0 0 10px #00ff41;
          animation: glow 2s ease-in-out infinite alternate;
        }
        
        @keyframes fall {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        
        @keyframes glow {
          0% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        
        .neon-border {
          border: 2px solid #00ff41;
          box-shadow: 
            0 0 10px #00ff41,
            inset 0 0 10px rgba(0, 255, 65, 0.1);
          animation: neon-pulse 2s ease-in-out infinite alternate;
        }
        
        .neon-text {
          text-shadow: 
            0 0 5px #00ff41,
            0 0 10px #00ff41,
            0 0 15px #00ff41,
            0 0 20px #00ff41;
        }
        
        .neon-button {
          background: rgba(0, 255, 65, 0.1);
          border: 2px solid #00ff41;
          color: #00ff41;
          text-shadow: 0 0 10px #00ff41;
          box-shadow: 
            0 0 20px rgba(0, 255, 65, 0.3),
            inset 0 0 20px rgba(0, 255, 65, 0.1);
          transition: all 0.3s ease;
        }
        
        .neon-button:hover {
          background: rgba(0, 255, 65, 0.2);
          box-shadow: 
            0 0 30px rgba(0, 255, 65, 0.5),
            inset 0 0 30px rgba(0, 255, 65, 0.2);
          transform: scale(1.05);
        }
        
        @keyframes neon-pulse {
          0% { box-shadow: 0 0 10px #00ff41, inset 0 0 10px rgba(0, 255, 65, 0.1); }
          100% { box-shadow: 0 0 20px #00ff41, inset 0 0 20px rgba(0, 255, 65, 0.2); }
        }
        
        .typing-cursor::after {
          content: '█';
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      <div className="min-h-screen bg-black relative overflow-hidden">
        <MatrixRain />
        
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md w-full">
            {/* Logo/Title */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-green-400 neon-text mb-2">
                P&W BATTLER
              </h1>
              <div className="text-green-300 text-sm font-mono">
                [ BATTLE SIMULATION SYSTEM ]
              </div>
            </div>

            {/* Main login card */}
            <div className="neon-border bg-black bg-opacity-90 rounded-lg p-8 backdrop-blur-sm">
              <div className="text-center space-y-6">
                {/* Animated status text */}
                <div className="h-8 flex items-center justify-center">
                  <span className="text-green-400 font-mono text-sm typing-cursor">
                    {animatedText}
                  </span>
                </div>

                {/* System info */}
                <div className="text-green-300 font-mono text-xs space-y-1 border border-green-400 border-opacity-30 rounded p-3">
                  <div>[ SYSTEM STATUS: ONLINE ]</div>
                  <div>[ ENCRYPTION: AES-256 ]</div>
                  <div>[ PROTOCOL: DISCORD OAUTH2 ]</div>
                  <div>[ DATABASE: POLITICS & WAR API v3 ]</div>
                </div>

                {/* Login button */}
                <button
                  onClick={handleDiscordLogin}
                  disabled={loading}
                  className="w-full py-4 px-6 neon-button font-mono font-bold text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                      <span>CONNECTING...</span>
                    </div>
                  ) : (
                    '► AUTHENTICATE VIA DISCORD'
                  )}
                </button>

                {/* Security notice */}
                <div className="text-green-300 font-mono text-xs space-y-2 border-t border-green-400 border-opacity-30 pt-4">
                  <div className="text-yellow-400">⚠ SECURITY PROTOCOL</div>
                  <div>Your Discord account will be linked to your Politics & War nation for secure battle simulation access.</div>
                </div>

                {/* Version info */}
                <div className="text-green-500 text-xs font-mono opacity-70">
                  BATTLER v3.14.1 | BUILD: MATRIX-ALPHA
                </div>
              </div>
            </div>

            {/* Additional matrix effects */}
            <div className="mt-8 text-center">
              <div className="inline-block text-green-400 font-mono text-xs opacity-60">
                ▓▓▓▓▓▓▓▓▓▓ SECURE CONNECTION ESTABLISHED ▓▓▓▓▓▓▓▓▓▓
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
