import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface NewsCardProps {
  image: string;
  title: string;
  date: string;
  description: string;
}

const NewsCard = ({ image, title, date, description }: NewsCardProps) => {
  return (
    <Card className="overflow-hidden bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-glow-primary group">
      <div className="aspect-video relative overflow-hidden">
        <img 
          src={image} 
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Calendar className="h-4 w-4" />
          <span>{date}</span>
        </div>
        <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
          {description}
        </p>
        <Button variant="outline" size="sm" className="w-full">
          Подробнее
        </Button>
      </div>
    </Card>
  );
};

export default NewsCard;
