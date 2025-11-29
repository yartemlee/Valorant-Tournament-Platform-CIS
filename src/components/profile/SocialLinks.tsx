import { Profile, SocialLinks } from '@/types/common.types';
import { SiDiscord, SiTwitch, SiYoutube, SiTiktok, SiInstagram, SiX, SiValorant } from "react-icons/si";
import { Button } from "@/components/ui/button";

interface SocialLinksProps {
  profile: Profile;
  isTeamMember?: boolean;
  isOwnProfile?: boolean;
}

export function SocialLinks({ profile, isTeamMember, isOwnProfile }: SocialLinksProps) {
  // If socials are team only, hide if not team member and not owner
  if (profile.socials_team_only && !isTeamMember && !isOwnProfile) {
    return null;
  }

  const socials: {
    name: string;
    username: string | null | undefined;
    icon: React.ComponentType<{ className?: string }> | null;
    url: string | null;
    text?: string;
  }[] = [
      {
        name: "Discord",
        username: (profile.social_links as unknown as SocialLinks)?.discord,
        icon: SiDiscord,
        url: (profile.social_links as unknown as SocialLinks)?.discord ? `https://discord.com/users/${(profile.social_links as unknown as SocialLinks).discord}` : null
      },
      {
        name: "Twitch",
        username: (profile.social_links as unknown as SocialLinks)?.twitch,
        icon: SiTwitch,
        url: (profile.social_links as unknown as SocialLinks)?.twitch ? `https://twitch.tv/${(profile.social_links as unknown as SocialLinks).twitch}` : null
      },
      {
        name: "YouTube",
        username: (profile.social_links as unknown as SocialLinks)?.youtube,
        icon: SiYoutube,
        url: (profile.social_links as unknown as SocialLinks)?.youtube ? `https://youtube.com/@${(profile.social_links as unknown as SocialLinks).youtube}` : null
      },
      {
        name: "TikTok",
        username: (profile.social_links as unknown as SocialLinks)?.tiktok,
        icon: SiTiktok,
        url: (profile.social_links as unknown as SocialLinks)?.tiktok ? `https://tiktok.com/@${(profile.social_links as unknown as SocialLinks).tiktok}` : null
      },
      {
        name: "Instagram",
        username: profile.instagram_username,
        icon: SiInstagram,
        url: profile.instagram_username ? `https://instagram.com/${profile.instagram_username}` : null
      },
      {
        name: "Twitter",
        username: (profile.social_links as unknown as SocialLinks)?.twitter,
        icon: SiX,
        url: (profile.social_links as unknown as SocialLinks)?.twitter ? `https://twitter.com/${(profile.social_links as unknown as SocialLinks).twitter}` : null
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
