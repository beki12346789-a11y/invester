'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function TelegramPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only show if user is logged in
    if (!user) return;

    // Check if user has seen the popup before
    const hasSeenPopup = localStorage.getItem('telegram_popup_seen');
    
    if (!hasSeenPopup) {
      // Show popup after 3 seconds of successful login
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setShowPopup(false);
    localStorage.setItem('telegram_popup_seen', 'true');
  };

  const handleJoinTelegram = () => {
    localStorage.setItem('telegram_popup_seen', 'true');
    window.open('https://t.me/+yLNR6hcimS04Njc0', '_blank');
    setShowPopup(false);
  };

  if (!showPopup || !user) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 animate-fadeIn"
        onClick={handleClose}
      />
      
      {/* Popup */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slideUp">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-t-2xl text-center">
            <div className="text-6xl mb-3">📱</div>
            <h2 className="text-2xl font-bold text-white mb-2">Join Our Telegram!</h2>
            <p className="text-blue-100 text-sm">Get updates, news, and exclusive offers</p>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                <span className="text-2xl">💰</span>
                <p className="text-sm text-gray-700">Daily investment opportunities</p>
              </div>
              
              <div className="flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                <span className="text-2xl">📢</span>
                <p className="text-sm text-gray-700">Latest platform updates</p>
              </div>
              
              <div className="flex items-center gap-3 bg-purple-50 p-3 rounded-lg">
                <span className="text-2xl">🎁</span>
                <p className="text-sm text-gray-700">Exclusive bonuses & rewards</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 space-y-3">
              <button
                onClick={handleJoinTelegram}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all transform active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.038-1.36 5.356-.168.558-.5.744-.818.762-.694.064-1.222-.459-1.894-.899-1.056-.689-1.653-1.119-2.678-1.791-1.185-.776-.417-1.204.258-1.901.177-.183 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.001.321.023.465.141.122.1.155.234.171.329.016.095.036.312.02.482z"/>
                </svg>
                Join Telegram Channel
              </button>
              
              <button
                onClick={handleClose}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition-all"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </>
  );
}
