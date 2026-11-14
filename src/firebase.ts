import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Pedido, EstadoPedido } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

const VALID_ESTADOS: EstadoPedido[] = [
  'Pendiente de pedir',
  'Pedido al proveedor',
  'Listo para entregar',
  'Entregado',
];

export function sanitizeOrderId(id: string): string {
  const cleaned = String(id || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!cleaned) {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }
  return cleaned.slice(0, 128);
}

function clampString(val: unknown, maxLen: number): string {
  return String(val ?? '').trim().slice(0, maxLen);
}

function safeNumber(val: unknown): number {
  const n = Number(val);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, 1000000000);
}

function safeEstado(val: unknown): EstadoPedido {
  if (typeof val === 'string' && VALID_ESTADOS.includes(val as EstadoPedido)) {
    return val as EstadoPedido;
  }
  return 'Pendiente de pedir';
}

function buildOrderPayload(uid: string, orderId: string, p: Pedido, isCreate: boolean) {
  const cliente = clampString(p.cliente, 150) || 'Sin cliente';
  const articulo = clampString(p.articulo, 200) || 'Artículo';
  const nowIso = new Date().toISOString();

  const base: Record<string, unknown> = {
    cliente,
    articulo,
    numero: clampString(p.numero, 60),
    color: clampString(p.color, 60),
    proveedor: clampString(p.proveedor, 120),
    precioVenta: safeNumber(p.precioVenta),
    sena: safeNumber(p.sena),
    precioCosto: safeNumber(p.precioCosto),
    estado: safeEstado(p.estado),
    notas: clampString(p.notas, 500),
    mesPedido: clampString(p.mesPedido, 20),
    fechaCreacion: clampString(p.fechaCreacion || nowIso, 40),
    fechaActualizacion: clampString(nowIso, 40),
    updatedAt: serverTimestamp(),
  };

  if (isCreate) {
    base.id = orderId;
    base.ownerId = uid;
    base.createdAt = serverTimestamp();
  }

  return base;
}

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}

export async function ensureUserProfile(user: User): Promise<void> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const displayName = clampString(user.displayName || 'Usuario TOLK', 120);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        displayName,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function subscribeToOrders(
  uid: string,
  onData: (orders: Pedido[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const ordersPath = `users/${uid}/orders`;
  const q = query(collection(db, 'users', uid, 'orders'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Pedido[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: String(d.id || docSnap.id),
          cliente: String(d.cliente || ''),
          articulo: String(d.articulo || ''),
          numero: d.numero ? String(d.numero) : undefined,
          color: d.color ? String(d.color) : undefined,
          proveedor: d.proveedor ? String(d.proveedor) : undefined,
          precioVenta: Number(d.precioVenta) || 0,
          sena: Number(d.sena) || 0,
          precioCosto: Number(d.precioCosto) || 0,
          estado: safeEstado(d.estado),
          notas: d.notas ? String(d.notas) : undefined,
          mesPedido: d.mesPedido ? String(d.mesPedido) : undefined,
          fechaCreacion: d.fechaCreacion ? String(d.fechaCreacion) : undefined,
          fechaActualizacion: d.fechaActualizacion ? String(d.fechaActualizacion) : undefined,
        };
      });

      list.sort((a, b) => {
        const fa = a.fechaCreacion || '';
        const fb = b.fechaCreacion || '';
        return fb.localeCompare(fa);
      });

      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, ordersPath);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function createOrderInCloud(uid: string, pedido: Pedido): Promise<void> {
  const orderId = sanitizeOrderId(pedido.id);
  const path = `users/${uid}/orders/${orderId}`;
  try {
    const payload = buildOrderPayload(uid, orderId, pedido, true);
    await setDoc(doc(db, 'users', uid, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateOrderInCloud(uid: string, pedido: Pedido): Promise<void> {
  const orderId = sanitizeOrderId(pedido.id);
  const path = `users/${uid}/orders/${orderId}`;
  try {
    const payload = buildOrderPayload(uid, orderId, pedido, false);
    await updateDoc(doc(db, 'users', uid, 'orders', orderId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderStatusInCloud(
  uid: string,
  orderId: string,
  estado: EstadoPedido
): Promise<void> {
  const safeId = sanitizeOrderId(orderId);
  const path = `users/${uid}/orders/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'orders', safeId), {
      estado: safeEstado(estado),
      fechaActualizacion: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateOrderPaymentInCloud(
  uid: string,
  orderId: string,
  sena: number
): Promise<void> {
  const safeId = sanitizeOrderId(orderId);
  const path = `users/${uid}/orders/${safeId}`;
  try {
    await updateDoc(doc(db, 'users', uid, 'orders', safeId), {
      sena: safeNumber(sena),
      fechaActualizacion: new Date().toISOString(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteOrderInCloud(uid: string, orderId: string): Promise<void> {
  const safeId = sanitizeOrderId(orderId);
  const path = `users/${uid}/orders/${safeId}`;
  try {
    await deleteDoc(doc(db, 'users', uid, 'orders', safeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function syncLocalOrdersToCloud(
  uid: string,
  localOrders: Pedido[]
): Promise<number> {
  if (localOrders.length === 0) return 0;

  const CHUNK_SIZE = 400;
  let uploaded = 0;
  const basePath = `users/${uid}/orders`;

  try {
    for (let i = 0; i < localOrders.length; i += CHUNK_SIZE) {
      const chunk = localOrders.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);

      chunk.forEach((pedido) => {
        const orderId = sanitizeOrderId(pedido.id);
        const docRef = doc(db, 'users', uid, 'orders', orderId);
        const payload = buildOrderPayload(uid, orderId, pedido, true);
        batch.set(docRef, payload);
      });

      await batch.commit();
      uploaded += chunk.length;
    }
    return uploaded;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, basePath);
  }
}
