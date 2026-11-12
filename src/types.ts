export type EstadoPedido =
  | 'Pendiente de pedir'
  | 'Pedido al proveedor'
  | 'Listo para entregar'
  | 'Entregado';

export interface Pedido {
  id: string;
  cliente: string;
  articulo: string;
  numero?: string;
  color?: string;
  proveedor?: string;
  precioVenta: number;
  sena: number;
  precioCosto: number;
  estado: EstadoPedido;
  notas?: string;
  mesPedido?: string; // Formato YYYY-MM (ej: '2026-11')
  fechaCreacion?: string;
  fechaActualizacion?: string;
}

export type ModoVista = 'lista' | 'mes' | 'proveedor';
export type FiltroPago = 'todos' | 'pendiente' | 'pagado';

export interface ResumenFinanciero {
  totalVentas: number;
  totalSenas: number;
  saldoPendiente: number;
  totalCosto: number;
  gananciaTotal: number;
  margen: number;
  cantPedidos: number;
  pedidosConSaldo: number;
}
