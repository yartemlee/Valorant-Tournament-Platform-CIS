import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface JoinRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    lobbyTitle: string;
    onSubmit: (message: string) => Promise<void>;
}

export function JoinRequestDialog({
    open,
    onOpenChange,
    lobbyTitle,
    onSubmit,
}: JoinRequestDialogProps) {
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit(message);
            setMessage('');
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Подать заявку</DialogTitle>
                    <DialogDescription>
                        Вы подаёте заявку на вступление в лобби "{lobbyTitle}"
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="message">Сопроводительное сообщение (опционально)</Label>
                        <Textarea
                            id="message"
                            placeholder="Расскажите о себе: ваш опыт, предпочитаемые агенты..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={100}
                            rows={2}
                            className="resize-none"
                        />
                        <div className="flex justify-end">
                            <span className="text-xs text-muted-foreground">{message.length}/100</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={isSubmitting}
                    >
                        Отмена
                    </Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Отправить заявку
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
