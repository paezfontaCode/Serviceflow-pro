import { formatUSD, formatVES } from '@/utils/currency';

interface ServiceItem {
  id: number;
  description: string;
  amount: number;
}

interface TicketData {
  orderId: string | number;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  services?: ServiceItem[];
  totalUsd: number;
  amountPaid?: number;
  pendingDebt?: number;
  exchangeRate: number;
  paymentMethod: string;
  date: string;
  entryDate?: string;
  warrantyExpiration?: string;
}

export const ticketService = {
  generateThermalTicket: (data: TicketData) => {
    const totalVes = data.totalUsd * data.exchangeRate;
    const amountPaidUsd = data.amountPaid ?? data.totalUsd;
    const amountPaidVes = amountPaidUsd * data.exchangeRate;
    const pendingDebt = data.pendingDebt ?? 0;
    const pendingDebtVes = pendingDebt * data.exchangeRate;

    const html = `
      <html>
        <head>
          <style>
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 80mm; 
              padding: 5mm; 
              margin: 0;
              font-size: 12px;
            }
            .text-center { text-align: center; }
            .header { margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
            .section-title { 
              font-weight: bold; 
              margin-top: 10px; 
              margin-bottom: 5px;
              background: #eee;
              padding: 2px 5px;
            }
            .item { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .footer { margin-top: 15px; font-size: 10px; text-align: center; }
            .bold { font-weight: bold; }
            .pending { color: #c00; font-weight: bold; }
            .separator { border-top: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="text-center header">
            <h2 style="margin: 0;">SERVICEFLOW PRO</h2>
            <p style="margin: 0;">Soluciones Tecnológicas</p>
            <p style="margin: 0;">RIF: J-00000000-0</p>
            <p style="margin: 0;">Telf: +58 414-0000000</p>
          </div>
          
          <div style="margin-bottom: 10px;">
            <p style="margin: 0;">Fecha: ${new Date(data.date).toLocaleString()}</p>
            ${data.entryDate ? `<p style="margin: 0;">Entrada: ${new Date(data.entryDate).toLocaleDateString()}</p>` : ''}
            <p style="margin: 0;">Ticket: #${data.orderId.toString().padStart(6, '0')}</p>
            <p style="margin: 0;">Cliente: ${data.customerName}</p>
          </div>

          ${data.items.length > 0 ? `
            <div class="section-title">PRODUCTOS</div>
            ${data.items.map(item => `
              <div class="item">
                <span>${item.quantity} x ${item.name.substring(0, 15)}</span>
                <span>$${(item.quantity * item.price).toFixed(2)}</span>
              </div>
            `).join('')}
          ` : ''}

          ${data.services && data.services.length > 0 ? `
            <div class="section-title">SERVICIOS</div>
            ${data.services.map(service => `
              <div class="item">
                <span>#${service.id.toString().padStart(5, '0')} ${service.description.substring(0, 12)}</span>
                <span>$${service.amount.toFixed(2)}</span>
              </div>
            `).join('')}
          ` : ''}

          <div class="separator"></div>

          <div class="totals">
            <div class="item bold">
              <span>TOTAL:</span>
              <span>${formatUSD(data.totalUsd)}</span>
            </div>
            <div class="item">
              <span>Tasa (BCV):</span>
              <span>${data.exchangeRate.toFixed(2)} Bs.</span>
            </div>
            <div class="item">
              <span>Equiv. Bs.:</span>
              <span>${formatVES(totalVes)}</span>
            </div>
            
            <div class="separator"></div>
            
            <div class="item bold">
              <span>PAGADO:</span>
              <span>${formatUSD(amountPaidUsd)}</span>
            </div>
            <div class="item">
              <span></span>
              <span>${formatVES(amountPaidVes)}</span>
            </div>

            ${pendingDebt > 0 ? `
              <div class="separator"></div>
              <div class="item pending" style="font-size: 14px; border: 1px solid #000; padding: 4px;">
                <span>SALDO PENDIENTE:</span>
                <span>${formatUSD(pendingDebt)}</span>
              </div>
              <div class="item pending" style="text-align: right; margin-top: 2px;">
                <span></span>
                <span>${formatVES(pendingDebtVes)}</span>
              </div>
            ` : ''}
            
            <div class="item">
              <span>Forma de Pago:</span>
              <span>${data.paymentMethod}</span>
            </div>
          </div>

          <div class="footer">
            <p>¡Gracias por su compra!</p>
            ${data.warrantyExpiration ? `
              <p class="bold">GARANTÍA HASTA: ${new Date(data.warrantyExpiration).toLocaleDateString()}</p>
              <p style="font-size: 8px;">* Cubre solo fallas técnicas de fábrica.</p>
            ` : '<p>Garantía: 30 días software / 90 días hardware.</p>'}
            ${pendingDebt > 0 ? '<p style="color: #c00;">*** CONSERVE ESTE TICKET ***</p>' : ''}
            <p>www.serviceflowpro.com</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    } else {
      alert('Por favor, permite las ventanas emergentes para imprimir el ticket.');
    }
  },

  generateReceptionTicket: (data: { orderId: number | string, customerName: string, device: string, problem: string, estimatedCost: number, exchangeRate: number, date: string }) => {
    const costVes = data.estimatedCost * data.exchangeRate;

    const html = `
      <html>
        <head>
          <style>
            body { font-family: 'Courier New', monospace; width: 80mm; padding: 5mm; font-size: 12px; }
            .text-center { text-align: center; }
            .header { margin-bottom: 10px; border-bottom: 1px dashed #000; }
            .section { margin-bottom: 8px; }
            .bold { font-weight: bold; }
            .border-top { border-top: 1px solid #000; padding-top: 5px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="text-center header">
            <h2 style="margin: 0;">RECOMENS COMPUTRONIC</h2>
            <p style="margin: 0;">COMPROBANTE DE RECEPCIÓN</p>
            <p style="margin: 0;">Orden: #${data.orderId.toString().padStart(5, '0')}</p>
          </div>
          
          <div class="section">
            <p><strong>Fecha:</strong> ${new Date(data.date).toLocaleString()}</p>
            <p><strong>Cliente:</strong> ${data.customerName}</p>
          </div>

          <div class="section" style="background: #f5f5f5; padding: 5px;">
            <p class="bold">EQUIPO:</p>
            <p>${data.device}</p>
            <p class="bold">FALLA REPORTADA:</p>
            <p><em>"${data.problem}"</em></p>
          </div>

          <div class="border-top">
            <div style="display: flex; justify-content: space-between;">
              <span class="bold">COSTO ESTIMADO:</span>
              <span class="bold">$${data.estimatedCost.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>Tasa: ${data.exchangeRate.toFixed(2)} Bs.</span>
              <span>Total: ${formatVES(costVes)}</span>
            </div>
          </div>

          <div style="margin-top: 15px; font-size: 9px; border-top: 1px dashed #000; padding-top: 10px;">
            <p><strong>IMPORTANTE:</strong></p>
            <p>* Los equipos no retirados después de 60 días serán declarados en abandono.</p>
            <p>* No nos hacemos responsables por la pérdida de datos.</p>
            <p>* Conserve este ticket para retirar su equipo.</p>
          </div>

          <div style="margin-top: 30px; text-align: center;">
            <div style="border-top: 1px solid #000; width: 150px; margin: 0 auto;"></div>
            <p style="font-size: 10px;">Firma del Cliente</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
    }
  }
};
