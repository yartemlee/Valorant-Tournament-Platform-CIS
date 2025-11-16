import { SiDiscord, SiTwitch, SiYoutube, SiTiktok, SiX } from "react-icons/si";
import { Button } from "@/components/ui/button";

interface SocialLinksProps {
  profile: any;
}

export function SocialLinks({ profile }: SocialLinksProps) {
  const socials = [
    { 
      name: "Discord", 
      username: profile.discord_username, 
      icon: SiDiscord,
      url: profile.discord_username ? `https://discord.com/users/${profile.discord_username}` : null
    },
    { 
      name: "Twitch", 
      username: profile.twitch_username, 
      icon: SiTwitch,
      url: profile.twitch_username ? `https://twitch.tv/${profile.twitch_username}` : null
    },
    { 
      name: "YouTube", 
      username: profile.youtube_username, 
      icon: SiYoutube,
      url: profile.youtube_username ? `https://youtube.com/@${profile.youtube_username}` : null
    },
    { 
      name: "TikTok", 
      username: profile.tiktok_username, 
      icon: SiTiktok,
      url: profile.tiktok_username ? `https://tiktok.com/@${profile.tiktok_username}` : null
    },
    { 
      name: "Twitter", 
      username: profile.twitter_username, 
      icon: SiX,
      url: profile.twitter_username ? `https://twitter.com/${profile.twitter_username}` : null
    },
    { 
      name: "Tracker.gg", 
      username: profile.tracker_gg_username, 
      icon: null,
      url: profile.tracker_gg_username ? `https://tracker.gg/valorant/profile/riot/${profile.tracker_gg_username}` : null,
      text: "TRN"
    },
  ];

  const activeSocials = socials.filter(s => s.username);

  if (activeSocials.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {activeSocials.map(social => (
        <Button
          key={social.name}
          variant="outline"
          size="icon"
          asChild
          className="h-8 w-8"
        >
          <a href={social.url || "#"} target="_blank" rel="noopener noreferrer">
            {social.icon ? (
              <social.icon className="h-4 w-4" />
            ) : (
              <span className="text-xs font-bold">{social.text}</span>
            )}
          </a>
        </Button>
      ))}
    </div>
  );
}