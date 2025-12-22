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
  const t = useTranslations('common');
  
  // Mapeo de tipos de items a traducciones
  const getItemTypeTranslation = (type: string): string => {
    const typeMap: Record<string, string> = {
      'producto': t('product'),
      'categoría': t('category'),
      'categoria': t('category'),
      'elemento': t('item'),
      'sponsor': t('sponsor'),
      'patrocinador': t('sponsor'),
      'profesor': t('professor'),
      'professor': t('professor'),
      'sede': t('venue'),
      'cancha': t('court'),
      'el': t('item') // Fallback para casos donde se use "el"
    };
    return typeMap[type.toLowerCase()] || type;
  };
  
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
            {t('deleteConfirmation')} {getItemTypeTranslation(itemType)} &quot;<span className="font-medium">{itemName}</span>&quot;?
            {' '}{t('cannotUndo')}
          </p>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="bg-transparent dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-700 font-bold"
            >
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 font-bold"
            >
              {t('delete')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
