import { toVideoEmbedUrl } from "@/lib/videoEmbed";

type Props = { videoUrl: string };

export default function VideoEmbedFrame({ videoUrl }: Props) {
  return (
    <iframe
      src={toVideoEmbedUrl(videoUrl)}
      className="h-full w-full"
      title="Lesson video"
      frameBorder={0}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  );
}
