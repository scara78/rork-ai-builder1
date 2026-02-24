'use client';

import { useState } from 'react';
import { RefreshCw, Smartphone, Tablet, ExternalLink, QrCode } from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { useAgentStore } from '@/stores/agentStore';
import { SnackPreview } from './SnackPreview';
import { ConsolePanel } from './ConsolePanel';

interface PreviewPanelProps {
  projectId: string;
  webPreviewRef: React.MutableRefObject<Window | null>;
  webPreviewURL: string | undefined;
  expoURL: string | undefined;
  isOnline: boolean;
  isBusy: boolean;
  connectedClients: number;
  snackError: string | null;
  hasRequestedOnline: boolean;
}

export function PreviewPanel({
  projectId,
  webPreviewRef,
  webPreviewURL,
  expoURL,
  isOnline,
  isBusy,
  connectedClients,
  snackError,
  hasRequestedOnline,
}: PreviewPanelProps) {
  const { generatingFiles } = useProjectStore();
  const { isRunning: isAgentRunning } = useAgentStore();

  const isGenerating = isAgentRunning;

  const [deviceSize, setDeviceSize] = useState<'phone' | 'tablet'>('phone');
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="h-full w-full flex flex-col bg-[#1a1a1d] relative pb-10">
      {/* Top bar with status + controls */}
      <div className="h-10 flex items-center justify-between px-3 border-b border-[#27272a] bg-[#0f0f11] flex-shrink-0 relative z-10">
        <div className="flex items-center gap-2">
          {/* Status */}
          {isGenerating ? (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
              </span>
              <span className="text-blue-400 font-medium text-xs">Building</span>
            </div>
          ) : isBusy ? (
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
              </span>
              <span className="text-yellow-400 font-medium text-xs">Resolving</span>
            </div>
          ) : isOnline ? (
            <div className="flex items-center gap-1.5">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              <span className="text-green-400 font-medium text-xs">Live</span>
              {connectedClients > 0 && (
                <span className="text-[10px] text-gray-500">({connectedClients} device{connectedClients > 1 ? 's' : ''})</span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gray-500" />
              <span className="text-gray-500 font-medium text-xs">Connecting</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* QR Code button — open in Expo Go */}
          {expoURL && (
            <button
              onClick={() => setShowQR(!showQR)}
              className={`p-1.5 rounded-md transition-colors ${showQR ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
              title="Open in Expo Go"
            >
              <QrCode size={13} />
            </button>
          )}
          <div className="w-px h-4 bg-[#27272a] mx-1" />
          {/* Device type icons */}
          <button
            onClick={() => setDeviceSize('phone')}
            className={`p-1.5 rounded-md transition-colors ${deviceSize === 'phone' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title="Phone"
          >
            <Smartphone size={13} />
          </button>
          <button
            onClick={() => setDeviceSize('tablet')}
            className={`p-1.5 rounded-md transition-colors ${deviceSize === 'tablet' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
            title="Tablet"
          >
            <Tablet size={13} />
          </button>
          {webPreviewURL && (
            <button
              onClick={() => window.open(webPreviewURL, '_blank')}
              className="p-1.5 text-gray-500 hover:text-white transition-colors rounded-md hover:bg-white/5 ml-1"
              title="Open preview in new tab"
            >
              <ExternalLink size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px]">
        {/* Device Frame - phone or tablet */}
        <div
          className={`relative bg-black border-[4px] border-[#333] shadow-[0_0_60px_-15px_rgba(0,0,0,0.6)] overflow-hidden z-10 transition-all duration-300 ease-in-out ${
            deviceSize === 'tablet'
              ? 'w-[580px] h-[760px] rounded-[24px]'
              : 'w-[320px] h-[693px] rounded-[40px]'
          }`}
        >
          {/* Hardware elements */}
          {deviceSize === 'phone' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[26px] bg-black rounded-b-3xl z-50 flex justify-center items-end pb-1.5">
              <div className="w-12 h-1.5 rounded-full bg-[#222]" />
            </div>
          )}
          
          <div
            className={`absolute inset-0 bg-[#0a0a0a] overflow-hidden ${
              deviceSize === 'tablet' ? 'rounded-[20px]' : 'rounded-[36px]'
            }`}
          >
            <SnackPreview
              webPreviewRef={webPreviewRef}
              webPreviewURL={webPreviewURL}
              isOnline={isOnline}
              isBusy={isBusy}
              connectedClients={connectedClients}
              error={snackError}
              hasRequestedOnline={hasRequestedOnline}
              className="w-full h-full"
            />

            {/* Building overlay */}
            {isGenerating && generatingFiles.length > 0 && (
              <div className="absolute top-4 right-4 z-40 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 flex flex-col gap-1.5 shadow-xl pointer-events-none">
                <div className="flex items-center gap-2 text-xs font-medium text-white mb-1">
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                  Building updates...
                </div>
                {generatingFiles.slice(-3).map((f) => (
                  <div key={f} className="text-[10px] text-gray-400 font-mono truncate max-w-[140px]">
                    {f}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Console Panel at the bottom */}
      <ConsolePanel />
    </div>
  );
}
