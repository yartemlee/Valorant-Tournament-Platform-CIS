import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import RegisterForm from './RegisterForm';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegisterModal = ({ isOpen, onClose }: RegisterModalProps) => {
  const handleSuccess = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">Регистрация</DialogTitle>
        </DialogHeader>
        <RegisterForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
};

export default RegisterModal;

