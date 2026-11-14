# Security Specification — TOLK IMPORTADOS Firestore

## 1. Data Invariants
1. No order can exist outside an authenticated, email-verified user's `/users/{userId}/orders/{orderId}` subcollection, and the parent `/users/{userId}` document must exist on creation.
2. `ownerId` and path `{userId}` must strictly match `request.auth.uid`, and `id` must strictly match `{orderId}`.
3. `id`, `ownerId`, and `createdAt` are immutable after creation; `createdAt` and `updatedAt` must equal `request.time`.
4. All strings enforce strict `.size()` bounds; numeric prices enforce `>= 0 && <= 1000000000`; `estado` is restricted to the 4 valid enum values.
5. `allow list` enforces `resource.data.ownerId == request.auth.uid` directly without `get()`/`exists()` calls.

## 2. The "Dirty Dozen" Attack Payloads (All Must Fail with PERMISSION_DENIED)
1. **Unauthenticated read/write**: `auth = null` attempting `get` or `create` on `/users/u1/orders/o1`.
2. **Unverified email**: `auth.token.email_verified = false` attempting `create` on `/users/u1/orders/o1`.
3. **Cross-tenant read/list**: User `u2` attempting `get` or `list` on `/users/u1/orders`.
4. **Identity spoofing on create**: User `u1` creating `/users/u1/orders/o1` with `ownerId: "u2"`.
5. **Ghost / Shadow field injection**: User `u1` creating/updating an order with extra field `isAdmin: true`.
6. **ID poisoning**: Document ID `"a".repeat(200)` or `"bad/id$"` violating `isValidId()`.
7. **Missing parent user document**: Creating `/users/u1/orders/o1` when `/users/u1` does not exist.
8. **Type poisoning**: Updating `precioVenta: "hacked"` or `estado: "InvalidStatus"`.
9. **String resource exhaustion (Denial of Wallet)**: Creating an order with `notas` of 5,000 characters (`> 500`).
10. **Immutable field mutation**: Updating `createdAt` or `ownerId` or `id` on an existing order.
11. **Client-forged timestamp**: Creating or updating an order with a client `Date` instead of `request.time`.
12. **Blanket list scraping**: Querying `/users/u1/orders` without matching `ownerId == request.auth.uid`.
