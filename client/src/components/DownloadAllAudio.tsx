import { useCallback, useEffect, useRef, useState } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { AUDIO_CACHE_NAME } from "@/lib/audioCache";

const BATCH_SIZE = 6;

interface DownloadState {
  total: number;
  done: number;
  cancelled: boolean;
}

function audioManifestUrls(index: unknown): string[] {
  if (typeof index !== "object" || index === null) return [];
  const manifest = index as {
    vocabulary?: Record<string, string>;
    female?: { vocabulary?: Record<string, string> };
  };
  const files = new Set<string>();
  for (const file of Object.values(manifest.vocabulary ?? {})) files.add(file);
  for (const file of Object.values(manifest.female?.vocabulary ?? {})) files.add(file);
  return Array.from(files, (file) => `/audio/${file}`);
}

/**
 * Caches the whole pronunciation library for offline use. Clips are fetched a few
 * at a time into the same cache the service worker uses, so later plays hit it.
 */
export function DownloadAllAudio() {
  const [total, setTotal] = useState<number | null>(null);
  const [download, setDownload] = useState<DownloadState | null>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    let active = true;
    fetch("/audio/index.json")
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((index) => {
        if (active) setTotal(audioManifestUrls(index).length);
      })
      .catch(() => {
        if (active) setTotal(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const start = useCallback(async () => {
    if (!("caches" in window)) {
      toast.error("Offline audio is unavailable", { description: "This browser does not support the Cache API." });
      return;
    }

    cancelRef.current = false;
    setDownload({ total: 0, done: 0, cancelled: false });

    try {
      const response = await fetch("/audio/index.json");
      const urls = audioManifestUrls(await response.json());
      const cache = await caches.open(AUDIO_CACHE_NAME);
      setDownload({ total: urls.length, done: 0, cancelled: false });

      let done = 0;
      for (let start = 0; start < urls.length; start += BATCH_SIZE) {
        if (cancelRef.current) break;
        const batch = urls.slice(start, start + BATCH_SIZE);
        await Promise.all(
          batch.map(async (url) => {
            if (await cache.match(url)) return;
            const clip = await fetch(`${url}?warm=1`);
            const type = clip.headers.get("content-type") ?? "";
            if (clip.status === 200 && type.startsWith("audio/")) await cache.put(url, clip);
          }),
        );
        done += batch.length;
        setDownload({ total: urls.length, done: Math.min(done, urls.length), cancelled: cancelRef.current });
      }

      if (cancelRef.current) {
        toast.info("Audio download cancelled", { description: `Saved ${done} of ${urls.length} clips.` });
      } else {
        toast.success("Audio is ready offline", { description: `${urls.length} clips are stored on this device.` });
      }
      setDownload(null);
    } catch (error) {
      console.error("Failed to download audio:", error);
      setDownload(null);
      toast.error("Audio download failed", { description: "Check your connection and try again." });
    }
  }, []);

  const cancel = () => {
    cancelRef.current = true;
  };

  const progress = download && download.total > 0 ? Math.round((download.done / download.total) * 100) : 0;
  const sizeLabel = total === null ? "the pronunciation library" : `${total} clips`;

  return (
    <div className="border-t pt-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <WifiOff size={15} className="text-emerald-600" aria-hidden="true" />
        Offline audio
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Hangul and number audio is always available offline. Download {sizeLabel} to keep every word playable without a connection.
      </p>
      {download ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              {download.done} / {download.total} clips
            </span>
            <Button type="button" variant="outline" size="sm" className="h-7 bg-white text-xs" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full bg-white" onClick={start}>
          Download all audio
        </Button>
      )}
    </div>
  );
}
