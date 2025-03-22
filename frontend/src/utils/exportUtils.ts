import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export chart or component as an image
 * @param elementId ID of the DOM element to export
 * @param fileName Name of the exported file without extension
 * @param format Image format (png or jpeg)
 */
export const exportAsImage = async (
  elementId: string, 
  fileName: string, 
  format: 'png' | 'jpeg' = 'png'
): Promise<string> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: null,
      logging: false
    });

    const imageData = canvas.toDataURL(`image/${format}`);
    
    // Create download link
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `${fileName}.${format}`;
    link.click();
    
    return imageData;
  } catch (error) {
    console.error('Error exporting image:', error);
    throw error;
  }
};

/**
 * Export dashboard or report as PDF
 * @param elementId ID of the DOM element to export
 * @param fileName Name of the exported file without extension
 * @param title Optional title for the PDF
 * @param orientation PDF orientation (portrait or landscape)
 */
export const exportAsPDF = async (
  elementId: string,
  fileName: string,
  title?: string,
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#FFFFFF',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });
    
    // PDF dimensions
    const pdfWidth = orientation === 'portrait' ? 210 : 297;
    const pdfHeight = orientation === 'portrait' ? 297 : 210;
    
    // Calculate image dimensions to fit in PDF
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.9;
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = title ? 30 : 10;
    
    // Add title if provided
    if (title) {
      pdf.setFontSize(18);
      pdf.text(title, pdfWidth / 2, 20, { align: 'center' });
    }
    
    // Add image
    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    
    // Add footer with date
    const date = new Date().toLocaleString();
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Generated on ${date}`, pdfWidth - 15, pdfHeight - 10, { align: 'right' });
    
    // Save PDF
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error exporting PDF:', error);
    throw error;
  }
};

/**
 * Export data as CSV
 * @param data Array of objects to export
 * @param fileName Name of the exported file without extension
 * @param columns Optional column definitions for header customization
 */
export const exportAsCSV = (
  data: any[],
  fileName: string,
  columns?: Array<{ key: string; header: string }>
): void => {
  try {
    if (!data || !data.length) {
      throw new Error('No data to export');
    }

    // Prepare columns
    const headers = columns 
      ? columns.map(col => col.header) 
      : Object.keys(data[0]);
    
    const keys = columns 
      ? columns.map(col => col.key) 
      : Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(item => {
      const row = keys.map(key => {
        const value = item[key];
        // Handle values with commas by wrapping in quotes
        return value !== null && value !== undefined 
          ? typeof value === 'string' && value.includes(',') 
            ? `"${value.replace(/"/g, '""')}"` 
            : String(value)
          : '';
      });
      csvContent += row.join(',') + '\n';
    });
    
    // Create Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${fileName}.csv`);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw error;
  }
};

/**
 * Export data as Excel
 * @param data Array of objects to export
 * @param fileName Name of the exported file without extension
 * @param sheetName Name of the worksheet
 * @param columns Optional column definitions for header customization
 */
export const exportAsExcel = (
  data: any[],
  fileName: string,
  sheetName: string = 'Data',
  columns?: Array<{ key: string; header: string }>
): void => {
  try {
    if (!data || !data.length) {
      throw new Error('No data to export');
    }

    // Prepare data for XLSX
    let excelData: any[];
    
    if (columns) {
      // Add header row
      const headerRow = columns.reduce((obj, col) => {
        obj[col.key] = col.header;
        return obj;
      }, {} as any);
      
      // Map data to specified columns
      const mappedData = data.map(item => {
        return columns.reduce((obj, col) => {
          obj[col.key] = item[col.key];
          return obj;
        }, {} as any);
      });
      
      excelData = [headerRow, ...mappedData];
    } else {
      excelData = data;
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData, { skipHeader: !!columns });
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Generate and save Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
  } catch (error) {
    console.error('Error exporting Excel:', error);
    throw error;
  }
};

/**
 * Export multiple charts as a report in PDF format
 * @param elementIds Array of element IDs to include in the report
 * @param fileName Name of the exported file without extension
 * @param title Report title
 * @param subtitle Optional report subtitle
 * @param orientation PDF orientation
 */
export const exportMultiChartReport = async (
  elementIds: string[],
  fileName: string,
  title: string,
  subtitle?: string,
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<void> => {
  try {
    if (!elementIds.length) {
      throw new Error('No elements specified for export');
    }
    
    // Create PDF with specified orientation
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4'
    });
    
    // PDF dimensions
    const pdfWidth = orientation === 'portrait' ? 210 : 297;
    const pdfHeight = orientation === 'portrait' ? 297 : 210;
    
    // Add title and subtitle
    pdf.setFontSize(20);
    pdf.text(title, pdfWidth / 2, 20, { align: 'center' });
    
    if (subtitle) {
      pdf.setFontSize(14);
      pdf.text(subtitle, pdfWidth / 2, 30, { align: 'center' });
    }
    
    // Current Y position for adding content
    let currentY = subtitle ? 45 : 35;
    
    // Process each element
    for (let i = 0; i < elementIds.length; i++) {
      const elementId = elementIds[i];
      const element = document.getElementById(elementId);
      
      if (!element) {
        console.warn(`Element with ID ${elementId} not found, skipping`);
        continue;
      }
      
      // Get element title if available
      const elementTitle = element.getAttribute('data-title') || '';
      
      // Capture element as canvas
      const canvas = await html2canvas(element, {
        scale: 1.5,
        backgroundColor: null,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate image dimensions to fit in PDF width
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = (pdfWidth * 0.8) / imgWidth;
      const scaledWidth = imgWidth * ratio;
      const scaledHeight = imgHeight * ratio;
      
      // Check if we need to add a new page
      if (currentY + scaledHeight + 10 > pdfHeight && i > 0) {
        pdf.addPage();
        currentY = 20;
      }
      
      // Add element title if available
      if (elementTitle) {
        pdf.setFontSize(12);
        pdf.text(elementTitle, pdfWidth / 2, currentY, { align: 'center' });
        currentY += 10;
      }
      
      // Add image
      const imgX = (pdfWidth - scaledWidth) / 2;
      pdf.addImage(imgData, 'PNG', imgX, currentY, scaledWidth, scaledHeight);
      
      // Update Y position for next element
      currentY += scaledHeight + 20;
    }
    
    // Add footer with date and page numbers
    const totalPages = pdf.getNumberOfPages();
    const date = new Date().toLocaleDateString();
    
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on ${date} | Page ${i} of ${totalPages}`, pdfWidth - 15, pdfHeight - 10, { align: 'right' });
    }
    
    // Save PDF
    pdf.save(`${fileName}.pdf`);
  } catch (error) {
    console.error('Error exporting multi-chart report:', error);
    throw error;
  }
};

/**
 * Export dashboard as a presentation in PowerPoint format (PPTX)
 * Note: This is a simplified implementation that creates a PPTX with images
 * For more advanced PPTX generation, use a library like PptxGenJS
 * @param elementIds Array of element IDs to include in the presentation
 * @param fileName Name of the exported file without extension
 * @param title Presentation title
 */
export const exportAsPowerPoint = async (
  elementIds: string[],
  fileName: string,
  title: string
): Promise<void> => {
  try {
    // This is a placeholder for PPTX export functionality
    // In a real implementation, you would use a library like PptxGenJS
    
    // Capture all elements as images and provide them to the user
    const images = [];
    
    for (const elementId of elementIds) {
      const element = document.getElementById(elementId);
      if (!element) continue;
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      images.push(imgData);
    }
    
    // Create a ZIP file with all images
    // This is a simplified approach - a real implementation would create a PPTX file
    alert('Exporting as PowerPoint is not fully implemented. Images will be exported as PNG files instead.');
    
    // Export each image individually
    images.forEach((imgData, index) => {
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${fileName}_slide_${index + 1}.png`;
      link.click();
    });
  } catch (error) {
    console.error('Error exporting PowerPoint:', error);
    throw error;
  }
};

/**
 * Utility to create a print-friendly version of a dashboard
 * @param elementId ID of the element to print
 * @param title Optional title for the printed page
 */
export const printDashboard = async (
  elementId: string,
  title?: string
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with ID ${elementId} not found`);
    }
    
    // Create a cloned version of the element
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Could not open print window. Please check your popup blocker settings.');
    }
    
    // Add print-friendly styles
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'Dashboard Print'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .dashboard-title {
              text-align: center;
              margin-bottom: 20px;
            }
            @media print {
              @page {
                size: landscape;
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          ${title ? `<h1 class="dashboard-title">${title}</h1>` : ''}
          <div id="print-content"></div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    // Append the cloned element to the print window
    printWindow.document.getElementById('print-content')!.appendChild(clone);
  } catch (error) {
    console.error('Error printing dashboard:', error);
    throw error;
  }
};