import { useCallback, useEffect, useRef, useState } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  countCachedAudioClips,
  estimateAudioDownloadMb,
  getAudioIndex,
  planAudioDownload,
  warmAudioClip,
} from "@domain/audioIndex";

const BATCH_SIZE = 6;

interface DownloadState {
  total: number;
  processed: number;
  stored: number;
  failed: number;
}

/**
 * Caches the whole pronunciation library (words and example sentences) for
 * offline use. Clips are fetched a few at a time into the same cache the
 * service worker uses, so later plays hit it. The manifest and cache-put rules
 * come from `audioIndex`.
 */
export function DownloadAllAudio() {
  const [total, setTotal] = useState<number | null>(null);
  const [estimatedMb, setEstimatedMb] = useState<number | null>(null);
  const [cachedCount, setCachedCount] = useState<number | null>(null);
  const [download, setDownload] = useState<DownloadState | null>(null);
  const cancelRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    cancelRef.current = false;
    return () => {
      mountedRef.current = false;
      cancelRef.current = true;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getAudioIndex()
      .then(async index => {
        const urls = planAudioDownload(index);
        const mb = estimateAudioDownloadMb(index);
        if (!active) return;
        setTotal(urls.length);
        setEstimatedMb(mb);
        const cached = await countCachedAudioClips(urls);
        if (active) setCachedCount(cached);
      })
      .catch(() => {
        if (active) {
          setTotal(null);
          setEstimatedMb(null);
          setCachedCount(null);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const start = useCallback(async () => {
    if (!("caches" in window)) {
      toast.error("Offline audio is unavailable", {
        description: "This browser does not support the Cache API.",
      });
      return;
    }

    cancelRef.current = false;
    setDownload({ total: 0, processed: 0, stored: 0, failed: 0 });

    try {
      // The manifest is shared with the size effect, so a run reuses that one
      // request instead of fetching it again.
      const urls = planAudioDownload(await getAudioIndex());
      if (!mountedRef.current || cancelRef.current) return;
      setDownload({ total: urls.length, processed: 0, stored: 0, failed: 0 });

      let processed = 0;
      let stored = 0;
      let failed = 0;
      for (let offset = 0; offset < urls.length; offset += BATCH_SIZE) {
        if (cancelRef.current) break;
        const batch = urls.slice(offset, offset + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(url => warmAudioClip(url))
        );
        for (const result of results) {
          if (result.status === "fulfilled" && result.value) {
            stored += 1;
          } else {
            failed += 1;
          }
        }
        processed = Math.min(processed + batch.length, urls.length);
        if (mountedRef.current) {
          setDownload({
            total: urls.length,
            processed,
            stored,
            failed,
          });
        }
      }

      if (mountedRef.current) {
        const latestCached = await countCachedAudioClips(urls);
        if (mountedRef.current) {
          setCachedCount(latestCached);
          setDownload(null);
        }
      }

      if (cancelRef.current) {
        if (mountedRef.current) {
          toast.info("Audio download cancelled", {
            description: `${stored} of ${urls.length} clips are stored on this device.`,
          });
        } else {
          toast.info("Audio download paused", {
            description: `${stored} of ${urls.length} clips stored so far. Reopen Settings to finish.`,
          });
        }
      } else if (failed > 0) {
        if (stored === 0) {
          toast.error("Audio download failed", {
            description: `None of the ${urls.length} clips could be saved. Check your connection and try again.`,
          });
        } else {
          toast.warning("Offline audio partially saved", {
            description: `${stored} of ${urls.length} clips stored (${failed} failed). Try again when your connection is steady.`,
          });
        }
      } else {
        toast.success("Audio is ready offline", {
          description: `${stored} clips are stored on this device.`,
        });
      }
    } catch (error) {
      console.error("Failed to download audio:", error);
      if (mountedRef.current) setDownload(null);
      toast.error("Audio download failed", {
        description: "Check your connection and try again.",
      });
    }
  }, []);

  const cancel = () => {
    cancelRef.current = true;
  };

  const progress =
    download && download.total > 0
      ? Math.round((download.processed / download.total) * 100)
      : 0;
  const sizeLabel =
    total !== null && estimatedMb !== null
      ? `${total} word and sentence clips (~${estimatedMb} MB)`
      : "the pronunciation library";
  const actionLabel =
    total !== null && cachedCount !== null && total > 0 && cachedCount >= total
      ? "Verify offline audio"
      : total !== null && cachedCount !== null && cachedCount > 0
        ? "Download remaining audio"
        : "Download all audio";

  return (
    <div className="border-t pt-4 space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
        <WifiOff
          size={15}
          className="text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
        Offline audio
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Hangul and number audio is always available offline. Download{" "}
        {sizeLabel} to keep every word and example playable without a
        connection.
      </p>
      {cachedCount !== null && total !== null && !download && (
        <p className="text-xs text-foreground/70">
          {total > 0 && cachedCount >= total
            ? `All ${total} clips are cached on this device.`
            : `${cachedCount} of ${total} clips cached on this device.`}
        </p>
      )}
      {download ? (
        <div className="space-y-2" role="status" aria-live="polite">
          <Progress
            value={progress}
            aria-label="Audio download progress"
            className="h-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {download.processed} / {download.total} clips
              {download.failed > 0 ? ` (${download.failed} failed)` : ""}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 bg-card text-xs"
              onClick={cancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full bg-card"
          onClick={start}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
