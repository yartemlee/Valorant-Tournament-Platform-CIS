import { Profile } from '@/types/common.types';
import { SiDiscord, SiTwitch, SiYoutube, SiTiktok, SiInstagram, SiX } from "react-icons/si";
import { Button } from "@/components/ui/button";

interface SocialLinksProps {
  profile: Profile;
}

export function SocialLinks({ profile }: SocialLinksProps) {
  const socials: {
    name: string;
    username: string | null | undefined;
    icon: any;
    url: string | null;
    text?: string;
  }[] = [
      {
        name: "Discord",
        username: profile.social_links?.discord,
        icon: SiDiscord,
        url: profile.social_links?.discord ? `https://discord.com/users/${profile.social_links.discord}` : null
      },
      {
        name: "Twitch",
        username: profile.social_links?.twitch,
        icon: SiTwitch,
        url: profile.social_links?.twitch ? `https://twitch.tv/${profile.social_links.twitch}` : null
      },
      {
        name: "YouTube",
        username: profile.social_links?.youtube,
        icon: SiYoutube,
        url: profile.social_links?.youtube ? `https://youtube.com/${profile.social_links.youtube}` : null
      },
      {
        name: "TikTok",
        username: profile.social_links?.tiktok,
        icon: SiTiktok,
        url: profile.social_links?.tiktok ? `https://tiktok.com/${profile.social_links.tiktok}` : null
      },
      {
        name: "Instagram",
        username: profile.instagram_username,
        icon: SiInstagram,
        url: profile.instagram_username ? `https://instagram.com/${profile.instagram_username}` : null
      },
      {
        name: "Twitter",
        username: profile.social_links?.twitter,
        icon: SiX,
        url: profile.social_links?.twitter ? `https://twitter.com/${profile.social_links.twitter}` : null
      },
    ];

  // Add Tracker.gg if enabled and Riot ID is present
  if (profile.show_tracker && (profile.riot_id_name || profile.riot_id)) {
    const riotIdName = profile.riot_id_name || profile.riot_id?.split('#')[0];
    const riotIdTag = profile.riot_id_tag || profile.riot_id?.split('#')[1];

    if (riotIdName && riotIdTag) {
      socials.push({
        name: "Tracker.gg",
        username: `${riotIdName}#${riotIdTag}`,
        icon: null,
        url: `https://tracker.gg/valorant/profile/riot/${riotIdName}%23${riotIdTag}`,
        text: "TRN"
      } as any);
    }
  }

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
