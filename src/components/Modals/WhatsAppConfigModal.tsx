import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Image from 'next/image';
import { Dialog } from '@headlessui/react';

interface WhatsAppConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (phoneNumber: string) => void;
  initialPhoneNumber?: string;
}

export default function WhatsAppConfigModal({ isOpen, onClose, onSave, initialPhoneNumber = '' }: WhatsAppConfigModalProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(phoneNumber);
  };

  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-0 sm:p-4 z-50">
        <Dialog.Panel className="w-full h-full sm:h-auto sm:max-w-2xl bg-white dark:bg-gray-800 rounded-none sm:rounded-xl shadow-lg flex flex-col max-h-screen sm:max-h-[90vh] overflow-y-auto">
          <div className="relative flex-shrink-0">
            {/* Banner superior con imagen de WhatsApp */}
            <div className="h-24 sm:h-32 bg-gradient-to-r from-green-400 to-green-600 dark:from-green-600 dark:to-green-800 rounded-t-none sm:rounded-t-xl overflow-hidden relative">
              <Image
                src="/assets/whatsapp_logo.png"
                alt="WhatsApp Business Banner"
                fill
                className="object-cover opacity-20"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  src="/assets/whatsapp_logo.png"
                  alt="WhatsApp Business"
                  width={70}
                  height={47}
                  className="sm:w-[90px] sm:h-[60px] dark:brightness-100"
                />
              </div>
            </div>

            {/* Botón de cerrar */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/20 transition-colors z-10"
            >
              <FaTimes className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </button>
          </div>

          <div className="p-4 sm:p-5 lg:p-6 flex-1 overflow-y-auto">
            <Dialog.Title className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Configurar WhatsApp Business
            </Dialog.Title>
            <Dialog.Description className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">
              Conecta tu número de WhatsApp Business para enviar notificaciones automáticas a tus clientes sobre inscripciones, recordatorios y actualizaciones de torneos.
            </Dialog.Description>

            <div className="mt-4 sm:mt-5 lg:mt-6 bg-green-50 dark:bg-green-900/30 rounded-lg p-3 sm:p-4 border border-green-100 dark:border-green-800">
              <div className="flex gap-2 sm:gap-3">
                <div className="flex-shrink-0">
                  <Image
                    src="/assets/whatsapp_logo.png"
                    alt="WhatsApp Features"
                    width={40}
                    height={40}
                    className="sm:w-12 sm:h-12 dark:brightness-50"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-300 mb-1.5 sm:mb-2">
                    Beneficios de WhatsApp Business
                  </h4>
                  <ul className="text-xs sm:text-sm text-green-700 dark:text-green-400 space-y-1 sm:space-y-1.5">
                    <li className="break-words">• Notificaciones automáticas de inscripción</li>
                    <li className="break-words">• Recordatorios de partidos y eventos</li>
                    <li className="break-words">• Comunicación directa con participantes</li>
                    <li className="break-words">• Mensajes personalizados y masivos</li>
                  </ul>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 lg:mt-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Número de WhatsApp Business
                </label>
                <div className="flex items-stretch">
                  <span className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs sm:text-sm whitespace-nowrap">
                    +598
                  </span>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 dark:border-gray-600 rounded-r-lg 
                             text-sm sm:text-base text-gray-900 dark:text-white bg-white dark:bg-gray-700
                             focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent
                             placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    placeholder="91234567"
                  />
                </div>
                <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 break-words">
                  Ingresa el número que utilizas en WhatsApp Business
                </p>
              </div>

              <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-gray-700 dark:text-gray-300 
                           hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 
                           text-white rounded-lg transition-colors text-sm font-medium"
                >
                  Guardar configuración
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 