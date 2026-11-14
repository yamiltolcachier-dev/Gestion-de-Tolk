import { Pedido, EstadoPedido } from '../types';

export const STORAGE_KEY = 'emprendedor_pedidos_v1';

export function formatearPlata(valor: number | undefined | null): string {
  const num = typeof valor === 'number' ? valor : parseFloat(String(valor)) || 0;
  return '$' + num.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function generarId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
}

export function obtenerBadgeEstado(estado: EstadoPedido): {
  clase: string;
  punto: string;
  etiqueta: string;
} {
  switch (estado) {
    case 'Pendiente de pedir':
      return {
        clase: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        punto: 'bg-amber-400',
        etiqueta: 'Pendiente de pedir',
      };
    case 'Pedido al proveedor':
      return {
        clase: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
        punto: 'bg-sky-400',
        etiqueta: 'Pedido al proveedor',
      };
    case 'Listo para entregar':
      return {
        clase: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
        punto: 'bg-purple-400',
        etiqueta: 'Listo para entregar',
      };
    case 'Entregado':
      return {
        clase: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        punto: 'bg-emerald-400',
        etiqueta: 'Entregado',
      };
    default:
      return {
        clase: 'bg-slate-700/30 text-slate-300 border-slate-600',
        punto: 'bg-slate-400',
        etiqueta: estado,
      };
  }
}

export async function copiarAlPortapapeles(texto: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const exito = document.execCommand('copy');
    document.body.removeChild(textarea);
    return exito;
  } catch {
    return false;
  }
}

export function obtenerMesActual(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export function formatearMes(mesStr?: string): string {
  if (!mesStr) return 'Sin mes asignado';
  const match = mesStr.match(/^(\d{4})-(\d{2})$/);
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${NOMBRES_MESES[monthIdx]} ${year}`;
    }
  }
  return mesStr;
}

export function exportarCSV(pedidos: Pedido[]) {
  if (pedidos.length === 0) return false;

  const cabeceras = [
    'Mes del Pedido',
    'Cliente',
    'Articulo',
    'Numero/Talle',
    'Color',
    'Proveedor',
    'Precio Venta',
    'Seña o Entrega',
    'Saldo Pendiente Cliente',
    'Precio Costo',
    'Balance (Ganancia Neta)',
    'Estado',
    'Observaciones',
    'Fecha Creacion',
  ];

  const filas = pedidos.map((p) => {
    const venta = Number(p.precioVenta) || 0;
    const sena = Number(p.sena) || 0;
    const costo = Number(p.precioCosto) || 0;
    const saldo = Math.max(0, venta - sena);
    const ganancia = venta - costo;

    return [
      escaparCSV(p.mesPedido ? formatearMes(p.mesPedido) : 'Sin mes'),
      escaparCSV(p.cliente),
      escaparCSV(p.articulo),
      escaparCSV(p.numero || ''),
      escaparCSV(p.color || ''),
      escaparCSV(p.proveedor || ''),
      venta,
      sena,
      saldo,
      costo,
      ganancia,
      escaparCSV(p.estado),
      escaparCSV(p.notas || ''),
      escaparCSV(p.fechaCreacion || ''),
    ].join(';');
  });

  const contenidoCSV = '\uFEFF' + [cabeceras.join(';'), ...filas].join('\n');
  const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const fechaHoy = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `TOLK_IMPORTADOS_Pedidos_${fechaHoy}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

function escaparCSV(texto: string): string {
  if (!texto) return '""';
  const str = String(texto).replace(/"/g, '""');
  return `"${str}"`;
}

export function exportarJSON(pedidos: Pedido[]) {
  if (pedidos.length === 0) return false;
  const dataStr = JSON.stringify(pedidos, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const fechaHoy = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `Respaldo_TOLK_IMPORTADOS_${fechaHoy}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function exportarCopiaSeguridadLocalStorage(): {
  ok: boolean;
  count: number;
  reason?: 'empty' | 'error';
} {
  try {
    // Lectura directa y de solo lectura desde LocalStorage (sin modificar ni borrar datos)
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ok: false, count: 0, reason: 'empty' };
    }

    let dataStr = raw;
    let count = 0;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) {
          return { ok: false, count: 0, reason: 'empty' };
        }
        count = parsed.length;
      } else if (parsed && typeof parsed === 'object') {
        count = 1;
      }
      // Se serializa preservando absolutamente todos los campos y valores existentes
      dataStr = JSON.stringify(parsed, null, 2);
    } catch {
      // Si por algún motivo no fuera JSON válido, se exporta el contenido crudo sin alterarlo
      dataStr = raw;
    }

    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const ahora = new Date();
    const fecha = ahora.toISOString().slice(0, 10);
    const hora = `${String(ahora.getHours()).padStart(2, '0')}-${String(ahora.getMinutes()).padStart(2, '0')}`;

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `COPIA_SEGURIDAD_TOLK_${fecha}_${hora}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpieza diferida del ObjectURL para compatibilidad con navegadores móviles (iOS/Android)
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    return { ok: true, count };
  } catch (err) {
    console.error('Error al exportar copia de seguridad desde LocalStorage:', err);
    return { ok: false, count: 0, reason: 'error' };
  }
}

export function generarMensajeWhatsAppCliente(p: Pedido): string {
  const venta = Number(p.precioVenta) || 0;
  const sena = Number(p.sena) || 0;
  const saldo = Math.max(0, venta - sena);

  let texto = `✨ *TOLK IMPORTADOS - Detalle de tu Pedido*\n\n`;
  if (p.mesPedido) texto += `🗓️ *Mes de Pedido:* ${formatearMes(p.mesPedido)}\n`;
  texto += `👤 *Cliente:* ${p.cliente}\n`;
  texto += `📦 *Artículo:* ${p.articulo}\n`;
  if (p.numero) texto += `📏 *Talle / N°:* ${p.numero}\n`;
  if (p.color) texto += `🎨 *Color:* ${p.color}\n`;
  texto += `💰 *Total:* ${formatearPlata(venta)}\n`;
  texto += `💵 *Seña / Cobrado:* ${formatearPlata(sena)}\n`;
  if (saldo > 0) {
    texto += `⏳ *Saldo a abonar:* ${formatearPlata(saldo)}\n`;
  } else {
    texto += `✅ *Estado de pago:* Pagado 100%\n`;
  }
  texto += `📌 *Estado del pedido:* ${p.estado}\n`;
  if (p.notas) texto += `📝 *Observaciones:* ${p.notas}\n`;
  texto += `\n¡Gracias por confiar en TOLK IMPORTADOS! 🤝`;
  return texto;
}

export function generarMensajeWhatsAppProveedor(proveedor: string, pedidos: Pedido[], mes?: string): string {
  let texto = `📋 *PEDIDO TOLK IMPORTADOS - ${proveedor.toUpperCase()}*\n`;
  if (mes) texto += `🗓️ Campaña / Mes: *${formatearMes(mes)}*\n`;
  texto += `📅 Fecha de emisión: ${new Date().toLocaleDateString('es-AR')}\n\n`;

  pedidos.forEach((p, idx) => {
    texto += `${idx + 1}. *${p.articulo}*`;
    if (p.numero) texto += ` | Talle: ${p.numero}`;
    if (p.color) texto += ` | Color: ${p.color}`;
    if (p.notas) texto += ` (${p.notas})`;
    texto += `\n`;
  });

  texto += `\nTotal unidades: ${pedidos.length}\n`;
  texto += `Aguardamos confirmación de stock y monto. Saludos!`;
  return texto;
}

export const PEDIDOS_EJEMPLO: Pedido[] = [
  {
    id: 'demo-1',
    cliente: 'Laura Fernández',
    articulo: 'Zapatillas Importadas Urban Retro',
    numero: '38',
    color: 'Blanco / Dorado',
    proveedor: 'Importadora Global',
    notas: 'Retira por showroom el sábado',
    precioVenta: 75000,
    sena: 35000,
    precioCosto: 44000,
    estado: 'Pedido al proveedor',
    mesPedido: '2026-11',
    fechaCreacion: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'demo-2',
    cliente: 'Carlos Méndez',
    articulo: 'Reloj Cronógrafo Acero Luxury',
    numero: 'Único',
    color: 'Negro / Oro',
    proveedor: 'Importadora Global',
    notas: 'Incluye caja original y manual',
    precioVenta: 92000,
    sena: 92000,
    precioCosto: 51000,
    estado: 'Listo para entregar',
    mesPedido: '2026-11',
    fechaCreacion: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'demo-3',
    cliente: 'Sofía Martínez',
    articulo: 'Campera Importada Impermeable Térmica',
    numero: 'M',
    color: 'Negro Mate',
    proveedor: 'Textil Premium Mayorista',
    notas: 'Envío prioritario por correo',
    precioVenta: 64000,
    sena: 20000,
    precioCosto: 36000,
    estado: 'Pendiente de pedir',
    mesPedido: '2026-11',
    fechaCreacion: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'demo-4',
    cliente: 'Martín Rodríguez',
    articulo: 'Billetera Cuero Genuino Slim',
    numero: 'Estándar',
    color: 'Café Vintage',
    proveedor: 'Accesorios Baires',
    notas: 'Cliente habitual',
    precioVenta: 32000,
    sena: 32000,
    precioCosto: 17500,
    estado: 'Entregado',
    mesPedido: '2026-10',
    fechaCreacion: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
];
