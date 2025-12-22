'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Button } from '@/components/ui/button';
import { Download, Loader2, FileText } from 'lucide-react';
import { Tournament } from '@/types/tournament';

interface PdfBracketGeneratorProps {
  bracketRef: React.RefObject<HTMLDivElement>;
  tournament: Tournament | null;
  className?: string;
}

export const PdfBracketGenerator: React.FC<PdfBracketGeneratorProps> = ({
  bracketRef,
  tournament,
  className = ''
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePDF = async () => {
    if (!tournament) {
      console.error('❌ No se puede generar PDF: tournament no está disponible');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('📸 Iniciando captura del bracket...');
      
      // Buscar el elemento específico por ID (el contenedor completo del bracket)
      const bracketElement = document.getElementById('elimination-bracket-content');
      if (!bracketElement) {
        console.error('❌ No se encontró el elemento elimination-bracket-content');
        alert('Error: No se pudo encontrar el bracket para capturar');
        return;
      }
      
      console.log('✅ Elemento elimination-bracket-content encontrado');
      
      // Configuración optimizada para captura completa del bracket
      const canvas = await html2canvas(bracketElement, {
        scale: 1.2, // Reducir escala para que quepa completo
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        width: bracketElement.scrollWidth,
        height: bracketElement.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });

      console.log('✅ Canvas capturado exitosamente');
      console.log('🔍 Dimensiones del canvas:', canvas.width, 'x', canvas.height);
      
      // Verificar que el canvas tenga contenido
      const ctx = canvas.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
      const hasContent = imageData && Array.from(imageData.data).some(pixel => pixel !== 255); // No todo blanco
      console.log('🔍 Canvas tiene contenido:', hasContent ? 'SÍ' : 'NO');

      // Crear PDF con orientación landscape para el bracket
      console.log('📄 Creando documento PDF...');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      // Dimensiones del PDF en landscape
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      console.log(`📏 Dimensiones PDF: ${pdfWidth}mm x ${pdfHeight}mm`);

      // Convertir canvas a imagen con máxima calidad
      console.log('🔄 Convirtiendo canvas a imagen...');
      const imgData = canvas.toDataURL('image/png', 1.0); // Máxima calidad para PDF profesional

      // === DISEÑO PROFESIONAL CON GRADIENTE SIMULADO ===
      
      // Crear fondo degradado azul (simulado con rectángulos)
      const gradientSteps = 25;
      const stepHeight = pdfHeight / gradientSteps;
      
      for (let i = 0; i < gradientSteps; i++) {
        const intensity = 1 - (i / gradientSteps) * 0.4; // Degradado más suave
        const r = Math.floor(30 * intensity);
        const g = Math.floor(64 * intensity);
        const b = Math.floor(175 * intensity);
        
        pdf.setFillColor(r, g, b);
        pdf.rect(0, i * stepHeight, pdfWidth, stepHeight, 'F');
      }

      // === HEADER SIMPLE Y LEGIBLE ===
      
      // Fondo del header limpio
      pdf.setFillColor('#ffffff');
      pdf.rect(20, 15, pdfWidth - 40, 35, 'F');
      
      // Título principal del torneo
      pdf.setTextColor('#1f2937');
      pdf.setFontSize(22);
      pdf.setFont('helvetica', 'bold');
      pdf.text(tournament.name, 25, 30);

      // Subtítulo "Cuadro Eliminatorio"
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor('#6b7280');
      pdf.text('Cuadro Eliminatorio', 25, 38);

      // Información de fecha
      if (tournament.start_date) {
        const startDate = new Date(tournament.start_date).toLocaleDateString('es-ES');
        pdf.setFontSize(10);
        pdf.setTextColor('#9ca3af');
        pdf.text(`Fecha del torneo: ${startDate}`, 25, 44);
      }
      
      // Logo/Marca en el header (derecha)
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor('#3b82f6');
      pdf.text('BayPadel San Francisco', pdfWidth - 70, 30);
      
      // Fecha de generación
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor('#9ca3af');
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pdfWidth - 70, 38);

      // === BRACKET MÁS GRANDE Y SIN FOOTER ===
      
      // Calcular dimensiones para que el bracket sea MÁS GRANDE
      const bracketY = 60; // Menos espacio después del header
      const availableHeight = pdfHeight - 70; // Sin espacio para footer
      
      // Calcular dimensiones para que el bracket sea MÁS GRANDE
      const maxImgWidth = pdfWidth - 40; // Menos margen para más espacio
      const maxImgHeight = availableHeight;
      
      // Calcular proporciones para mantener aspecto y que sea GRANDE
      let finalImgWidth = maxImgWidth;
      let finalImgHeight = (canvas.height * maxImgWidth) / canvas.width;
      
      // Si es muy alto, ajustar por altura para que quepa completo
      if (finalImgHeight > maxImgHeight) {
        finalImgHeight = maxImgHeight;
        finalImgWidth = (canvas.width * maxImgHeight) / canvas.height;
      }
      
      // Centrar horizontalmente
      const centeredX = (pdfWidth - finalImgWidth) / 2;
      
      // Contenedor del bracket simple
      pdf.setFillColor('#ffffff');
      pdf.setDrawColor('#d1d5db');
      pdf.setLineWidth(1);
      pdf.rect(centeredX, bracketY, finalImgWidth, finalImgHeight, 'FD');

      // Agregar la imagen del bracket MÁS GRANDE
      console.log('🖼️ Agregando bracket GRANDE al PDF...');
      pdf.addImage(imgData, 'PNG', centeredX, bracketY, finalImgWidth, finalImgHeight);

      // Descargar el PDF
      console.log('💾 Descargando PDF...');
      const fileName = `bracket-torneo-${tournament.id}.pdf`;
      pdf.save(fileName);
      
      console.log('✅ PDF generado y descargado exitosamente');

    } catch (error) {
      console.error('❌ Error generando PDF:', error);
      
      // Mostrar error más específico
      let errorMessage = 'Error al generar el PDF. Por favor, inténtalo de nuevo.';
      
      if (error instanceof Error) {
        if (error.message.includes('canvas')) {
          errorMessage = 'Error al capturar el bracket. Verifica que el bracket esté completamente cargado.';
        } else if (error.message.includes('PDF')) {
          errorMessage = 'Error al crear el documento PDF.';
        } else if (error.message.includes('image')) {
          errorMessage = 'Error al procesar la imagen del bracket.';
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generatePDF}
      disabled={isGenerating || !tournament}
      className={`flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white ${className}`}
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando PDF...
        </>
      ) : (
        <>
          <FileText className="h-4 w-4" />
          Descargar PDF
        </>
      )}
    </Button>
  );
};
