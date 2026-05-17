import { MARKET_CATALOG } from "@/lib/economy";

const catalogById = new Map(MARKET_CATALOG.map((item) => [item.id, item]));

function isMissingSchemaError(error) {
  return ["PGRST202", "PGRST204", "PGRST205", "42P01", "42703"].includes(
    error?.code,
  );
}

function normalizeInventoryRow(row) {
  if (typeof row === "string") {
    return {
      is_equipped: false,
      item_id: row,
      quantity: 1,
    };
  }

  const itemId = row?.item_id ?? row?.id;
  if (!itemId) return null;

  return {
    ...row,
    is_equipped: Boolean(row?.is_equipped),
    item_id: itemId,
    quantity: Math.max(1, Number(row?.quantity ?? 1)),
  };
}

function buildFallbackItem(row) {
  return {
    category: "unknown",
    description: "",
    id: row.item_id,
    name: row.item_id,
    price: 0,
  };
}

export function buildInventoryPayload(inventoryRows = [], purchaseRows = []) {
  const normalizedRows = inventoryRows.map(normalizeInventoryRow).filter(Boolean);
  const rowsByItemId = new Map();

  normalizedRows.forEach((row) => {
    const current = rowsByItemId.get(row.item_id);

    if (!current) {
      rowsByItemId.set(row.item_id, row);
      return;
    }

    rowsByItemId.set(row.item_id, {
      ...current,
      quantity: current.quantity + row.quantity,
      first_acquired_at:
        current.first_acquired_at ?? current.acquired_at ?? row.first_acquired_at ?? row.acquired_at,
      is_equipped: current.is_equipped || row.is_equipped,
      last_acquired_at:
        row.last_acquired_at ?? row.acquired_at ?? current.last_acquired_at ?? current.acquired_at,
      updated_at: row.updated_at ?? current.updated_at ?? null,
    });
  });

  const aggregatedRows = [...rowsByItemId.values()];
  const equippedById = {};
  const equippedIds = [];
  const quantityById = {};
  const ownedIds = [];

  const items = aggregatedRows.map((row) => {
    const catalogItem = catalogById.get(row.item_id) ?? buildFallbackItem(row);
    quantityById[row.item_id] = row.quantity;
    ownedIds.push(row.item_id);

    if (row.is_equipped) {
      equippedById[row.item_id] = true;
      equippedIds.push(row.item_id);
    }

    return {
      ...catalogItem,
      inventory_id: row.id ?? null,
      item_id: row.item_id,
      quantity: row.quantity,
      acquired_at: row.acquired_at ?? row.first_acquired_at ?? null,
      first_acquired_at: row.first_acquired_at ?? row.acquired_at ?? null,
      is_equipped: row.is_equipped,
      last_acquired_at: row.last_acquired_at ?? row.acquired_at ?? null,
      updated_at: row.updated_at ?? null,
    };
  });

  const purchases = purchaseRows.map((purchase) => {
    const catalogItem = catalogById.get(purchase.item_id);

    return {
      ...purchase,
      item: catalogItem ?? {
        ...(purchase.item_snapshot ?? {}),
        id: purchase.item_id,
        category: purchase.item_category,
        name: purchase.item_name,
        price: purchase.price_paid,
      },
    };
  });

  return {
    equippedById,
    equippedIds,
    equippedItemId: equippedIds[0] ?? null,
    items,
    ownedIds,
    purchases,
    quantityById,
  };
}

export async function fetchUserInventory(
  supabase,
  userId,
  { includePurchases = true, purchaseLimit = 50 } = {},
) {
  const inventoryQuery = supabase
    .from("inventory")
    .select(
      "id,item_id,quantity,is_equipped,acquired_at,first_acquired_at,last_acquired_at,updated_at",
    )
    .eq("user_id", userId)
    .order("last_acquired_at", { ascending: false });

  let inventoryResult = await inventoryQuery;

  if (inventoryResult.error && isMissingSchemaError(inventoryResult.error)) {
    inventoryResult = await supabase
      .from("inventory")
      .select("id,item_id,acquired_at")
      .eq("user_id", userId)
      .order("acquired_at", { ascending: false });
  }

  if (inventoryResult.error) {
    return { data: null, error: inventoryResult.error };
  }

  let purchaseRows = [];

  if (includePurchases) {
    const { data, error } = await supabase
      .from("market_purchases")
      .select(
        "id,item_id,item_name,item_category,item_snapshot,price_paid,quantity_delta,balance_before,balance_after,xp_awarded,purchased_at",
      )
      .eq("user_id", userId)
      .order("purchased_at", { ascending: false })
      .limit(purchaseLimit);

    if (error && !isMissingSchemaError(error)) {
      return { data: null, error };
    }

    purchaseRows = data ?? [];
  }

  return {
    data: buildInventoryPayload(inventoryResult.data ?? [], purchaseRows),
    error: null,
  };
}
