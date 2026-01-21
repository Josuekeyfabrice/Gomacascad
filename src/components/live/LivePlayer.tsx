import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Badge } from '@/components/ui/badge';
import { Users, Loader2, Volume2, VolumeX, Maximize } from 'lucide-react';

interface LivePlayerProps {
    url?: string;
    stream?: MediaStream | null;
    isLive?: boolean;
    viewers?: number;
}

export const LivePlayer = ({ url, stream, isLive = true, viewers = 0 }: LivePlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [loading, setLoading] = useState(true);
    const [isMuted, setIsMuted] = useState(true);

    useEffect(() => {
        let hls: Hls;

        const video = videoRef.current;
        if (!video) return;

        if (stream) {
            video.srcObject = stream;
            setLoading(false);
            video.play().catch(() => console.log("Autoplay blocked"));
            return;
        }

        if (url) {
            if (Hls.isSupported()) {
                hls = new Hls();
                hls.loadSource(url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, () => {
                    setLoading(false);
                    video.play().catch(() => {
                        console.log("Autoplay blocked, waiting for user");
                    });
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = url;
                video.addEventListener('loadedmetadata', () => {
                    setLoading(false);
                    video.play();
                });
            }
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [url, stream]);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    return (
        <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl group">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/50">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            )}

            <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted={isMuted}
            />

            {/* Overlays */}
            <div className="absolute top-4 left-4 flex gap-2">
                {isLive && (
                    <Badge className="bg-red-500 hover:bg-red-600 animate-pulse border-none px-3 py-1 font-bold">
                        LIVE
                    </Badge>
                )}
                <Badge variant="secondary" className="bg-black/40 backdrop-blur-md border-white/20 text-white gap-1">
                    <Users className="h-3 w-3" /> {viewers}
                </Badge>
            </div>

            <div className="absolute bottom-6 right-6 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={toggleMute}
                    className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors"
                >
                    {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
                <button className="p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60 transition-colors">
                    <Maximize className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};
