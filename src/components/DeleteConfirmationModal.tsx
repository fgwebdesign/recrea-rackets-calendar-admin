import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from '@/contexts/TranslationContext';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'elemento'
}: DeleteConfirmationModalProps) {
  const t = useTranslations('sponsors');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {t('confirmDeletion')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            {t('deleteConfirmation')} {itemType} "<span className="font-medium">{itemName}</span>"?
            {t('cannotUndo')}
          </p>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-transparent dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {t('delete')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
