'use client';

import React, { useEffect, useRef, useState, useCallback } from "react";
import { AlertCircle, RefreshCw, Wand2, Loader2 } from "lucide-react";
import { useErrorStore } from "@/stores/errorStore";

interface LivePreviewProps {
    code?: string;
    projectId?: string;
    className?: string;
    onLoad?: () => void;
    onError?: (error: string | null) => void;
}

export function LivePreview({ code, projectId, className, onLoad, onError }: LivePreviewProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [bundleUrl, setBundleUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEmptyProject, setIsEmptyProject] = useState(false);
    const setGlobalError = useErrorStore(s => s.setError);
    const clearGlobalError = useErrorStore(s => s.clear);

    // Receive runtime errors from iframe (injected by bundler)
    useEffect(() => {
        const handler = (e: MessageEvent) => {
            const data: any = e.data;
            if (!data || typeof data !== "object") return;
            if (data.source === "rork-preview" && data.type === "preview-error") {
                const msg = [data.message, data.stack].filter(Boolean).join("\n");
                setError(msg || "Runtime error");
                onError?.(msg || "Runtime error");
            }
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [onError]);

    const extractPre = (html: string) => {
        const m = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
        if (!m) return "";
        const text = m[1]!
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/<[^>]+>/g, "");
        return text.trim();
    };

    const loadBundle = useCallback(async () => {
        if (!projectId) return;
        if (!bundleUrl) setIsLoading(true);

        setError(null);
        setIsEmptyProject(false);
        onError?.(null);

        try {
            const url = `/api/projects/${projectId}/bundle?t=${Date.now()}`;
            
            const res = await fetch(url);
            const html = await res.text();

            // Detect "empty project" landing
            const textOnly = html
                .replace(/<script[\s\S]*?<\/script>/gi, "")
                .replace(/<style[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, "")
                .trim();
            const isEmpty =
                textOnly.includes("Project is Empty") ||
                (textOnly.includes("Project is Empty") && textOnly.includes("No files found"));
            if (isEmpty) {
                setIsEmptyProject(true);
                setBundleUrl(null);
                onError?.(null);
                setIsLoading(false);
                return;
            }

            // Detect Build/Bundle error pages (returned as 200 with error HTML or 500)
            const hasBuildError =
                /<h1>\s*(?:Build Error|❌ Bundle Error)\s*<\/h1>/i.test(html) ||
                /<h2>\s*(?:Build Error|❌ Bundle Error)\s*<\/h2>/i.test(html);
            if (hasBuildError) {
                const detail = extractPre(html) || "Build failed";
                setError(detail);
                onError?.(detail);
                setBundleUrl(null);
                setIsLoading(false);
                return;
            }

            if (!res.ok) {
                const basicMsg = `Bundle failed: ${res.status} ${res.statusText}`;
                setError(basicMsg);
                onError?.(basicMsg);
                setIsLoading(false);
                return;
            }

            setBundleUrl(url);
            onError?.(null);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : "Failed to load preview";
            setError(errorMsg);
            onError?.(errorMsg);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, onError]); // keep bundleUrl out to avoid reload loops

    useEffect(() => {
        loadBundle();

        let timeoutId: NodeJS.Timeout;

        const handleRefresh = () => {
            if (timeoutId) clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                loadBundle();
            }, 1000);
        };

        window.addEventListener("project-files-changed", handleRefresh);
        return () => {
            window.removeEventListener("project-files-changed", handleRefresh);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [loadBundle]);

    // Poll when project appears empty - files may be getting written by the agent
    useEffect(() => {
        if (!isEmptyProject) return;
        const pollInterval = setInterval(() => {
            loadBundle();
        }, 3000);
        return () => clearInterval(pollInterval);
    }, [isEmptyProject, loadBundle]);

    useEffect(() => {
        if (!bundleUrl && code && iframeRef.current) {
            const iframe = iframeRef.current;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

            if (!iframeDoc) return;

            iframeDoc.open();
            iframeDoc.write(code);
            iframeDoc.close();
        }
    }, [code, bundleUrl]);

    // Sync error to global store so chat can show suggestions like "Fix errors"
    useEffect(() => {
        if (error && error.trim().length > 0) {
            setGlobalError(error);
        } else {
            clearGlobalError();
        }
    }, [error, setGlobalError, clearGlobalError]);

    const handleFixWithAI = () => {
        if (!error) return;
        const errorPrompt = `I'm getting this build/runtime error:\n\n${error}\n\nPlease analyze the root cause and fix it.`;
        const event = new CustomEvent("send-to-ai", { detail: { message: errorPrompt } });
        window.dispatchEvent(event);
    };

    if (isLoading && !bundleUrl) {
        return (
            <div className={`flex items-center justify-center bg-background ${className}`}>
                <div className="text-center text-muted-foreground p-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4 opacity-50" />
                    <p className="text-sm">Building preview...</p>
                </div>
            </div>
        );
    }

    if (isEmptyProject) {
        return (
            <div className={`flex items-center justify-center bg-background ${className}`}>
                <div className="text-center text-muted-foreground p-8 max-w-md">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin mb-4 opacity-30" />
                    <p className="text-base font-medium mb-1.5 text-foreground/80">Waiting for AI to generate your app...</p>
                    <p className="text-sm text-muted-foreground/70">
                        Describe what you want in the chat panel
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`flex flex-col items-center justify-center bg-red-950/20 m-3 border border-red-500/30 rounded-xl ${className}`}>
                <div className="text-center p-6 max-w-2xl w-full">
                    <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-4" />
                    <h3 className="text-base font-semibold text-red-400 mb-2">Preview Error</h3>
                    <pre className="text-xs text-red-300/80 mb-4 text-left bg-black/40 p-4 rounded-lg overflow-auto max-h-60 whitespace-pre-wrap font-mono">
                        {error}
                    </pre>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={loadBundle}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors text-sm font-medium"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                        </button>
                        <button
                            onClick={handleFixWithAI}
                            className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-orange-900/20"
                        >
                            <Wand2 className="h-4 w-4" />
                            Fix with AI
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!code && !bundleUrl) {
        return (
            <div className={`flex items-center justify-center bg-background ${className}`}>
                <div className="text-center text-muted-foreground p-8">
                    <Loader2 className="mx-auto h-10 w-10 animate-spin mb-4 opacity-30" />
                    <p className="text-base font-medium mb-1.5 text-foreground/80">Waiting for AI to generate your app...</p>
                    <p className="text-sm text-muted-foreground/70">
                        Describe what you want in the chat panel
                    </p>
                </div>
            </div>
        );
    }

    return (
        <iframe
            id="preview-iframe"
            key={bundleUrl || "inline"}
            ref={iframeRef}
            src={bundleUrl || undefined}
            title="Live Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
            className={className}
            onLoad={() => {
                setIsLoading(false);
                onLoad?.();
            }}
            onError={() => {
                const errorMsg = "Failed to load preview iframe";
                setError(errorMsg);
                onError?.(errorMsg);
            }}
            style={{
                border: "none",
                width: "100%",
                height: "100%",
                backgroundColor: "#0a0a0a"
            }}
        />
    );
}