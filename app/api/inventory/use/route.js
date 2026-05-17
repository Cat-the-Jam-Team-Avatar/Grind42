import { NextResponse } from "next/server";
import { MARKET_CATALOG } from "@/lib/economy";
import { fetchUserInventory } from "@/lib/market/inventory";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const EQUIPPABLE_ITEM_IDS = MARKET_CATALOG
  .filter((item) => item.category !== "consumable")
  .map((item) => item.id);

const USE_ERROR_STATUS = {
  inventory_category_required: 400,
  inventory_item_not_owned: 400,
  inventory_item_required: 400,
  inventory_user_required: 400,
};

const USE_ERROR_MESSAGES = {
  inventory_category_required: "Ürün kategorisi eksik",
  inventory_item_not_owned: "Bu ürün envanterinde yok",
  inventory_item_required: "Ürün seçilmedi",
  inventory_user_required: "Kullanıcı bulunamadı",
};

function isMissingInventoryUseSchemaError(error) {
  return ["PGRST202", "PGRST204", "PGRST205", "42P01", "42703"].includes(
    error?.code,
  );
}

function getRpcErrorCode(error) {
  return error?.message?.match(/inventory_[a-z_]+/)?.[0] ?? null;
}

function isCosmeticLike(item) {
  return item.category !== "consumable";
}

function migrationRequiredResponse() {
  return NextResponse.json(
    {
      error: "Kozmetik kullanım durumunu kaydetmek için envanter migration'ı gerekli",
    },
    { status: 409 },
  );
}

async function findInventoryRecord(admin, userId, itemId) {
  const selectors = [
    "id,item_id,quantity,is_equipped",
    "id,item_id,quantity",
    "id,item_id",
  ];

  for (const selector of selectors) {
    const result = await admin
      .from("inventory")
      .select(selector)
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .limit(1);

    if (result.error && isMissingInventoryUseSchemaError(result.error)) {
      continue;
    }

    if (result.error) {
      return { data: null, error: result.error };
    }

    return { data: result.data?.[0] ?? null, error: null };
  }

  return {
    data: null,
    error: {
      code: "42703",
      message: "inventory use columns are missing",
    },
  };
}

async function consumeInventoryItem(admin, row) {
  const quantity = Math.max(1, Number(row.quantity ?? 1));

  if (row.quantity != null && quantity > 1) {
    const nextQuantity = quantity - 1;
    const { error } = await admin
      .from("inventory")
      .update({
        quantity: nextQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (error) return { data: null, error };

    return {
      data: {
        consumed: true,
        equipped: false,
        quantity: nextQuantity,
      },
      error: null,
    };
  }

  const { error } = await admin.from("inventory").delete().eq("id", row.id);

  if (error) return { data: null, error };

  return {
    data: {
      consumed: true,
      equipped: false,
      quantity: 0,
    },
    error: null,
  };
}

async function equipInventoryItem(admin, userId, row) {
  if (row.is_equipped == null) {
    return {
      data: null,
      error: {
        code: "42703",
        message: "inventory.is_equipped is missing",
      },
    };
  }

  const now = new Date().toISOString();
  const unequipResult = await admin
    .from("inventory")
    .update({
      is_equipped: false,
      updated_at: now,
    })
    .eq("user_id", userId)
    .in("item_id", EQUIPPABLE_ITEM_IDS);

  if (unequipResult.error) {
    return { data: null, error: unequipResult.error };
  }

  const equipResult = await admin
    .from("inventory")
    .update({
      is_equipped: true,
      updated_at: now,
    })
    .eq("id", row.id);

  if (equipResult.error) {
    return { data: null, error: equipResult.error };
  }

  return {
    data: {
      consumed: false,
      equipped: true,
      quantity: Math.max(1, Number(row.quantity ?? 1)),
    },
    error: null,
  };
}

async function applyWithDirectSchema(admin, userId, item) {
  const recordResult = await findInventoryRecord(admin, userId, item.id);

  if (recordResult.error) {
    return { data: null, error: recordResult.error, status: 500 };
  }

  if (!recordResult.data) {
    return {
      data: null,
      error: { message: "Bu ürün envanterinde yok" },
      status: 400,
    };
  }

  const actionResult =
    item.category === "consumable"
      ? await consumeInventoryItem(admin, recordResult.data)
      : await equipInventoryItem(admin, userId, recordResult.data);

  if (actionResult.error) {
    const status =
      isCosmeticLike(item) && isMissingInventoryUseSchemaError(actionResult.error)
        ? 409
        : 500;

    return { data: null, error: actionResult.error, status };
  }

  return {
    data: actionResult.data,
    error: null,
    status: 200,
  };
}

async function fetchInventoryPayload(admin, userId) {
  const { data, error } = await fetchUserInventory(admin, userId);

  if (error) {
    console.warn("Inventory refresh after use failed", error);
    return null;
  }

  return data;
}

export async function POST(request) {
  let body;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { itemId } = body;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (typeof itemId !== "string" || itemId.trim() === "") {
    return NextResponse.json({ error: "Ürün seçilmedi" }, { status: 400 });
  }

  const item = MARKET_CATALOG.find((catalogItem) => catalogItem.id === itemId);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  let admin;

  try {
    admin = createAdminClient();
  } catch (error) {
    return NextResponse.json(
      {
        details: error instanceof Error ? error.message : undefined,
        error: "Envanter servisi yapılandırılmamış",
      },
      { status: 500 },
    );
  }

  const rpcResult = await admin
    .rpc("use_market_item", {
      p_equippable_item_ids: EQUIPPABLE_ITEM_IDS,
      p_item_category: item.category,
      p_item_id: item.id,
      p_user_id: user.id,
    })
    .single();

  let result = {
    data: rpcResult.data,
    error: rpcResult.error,
    status: 200,
  };
  let legacySchema = false;

  if (rpcResult.error && isMissingInventoryUseSchemaError(rpcResult.error)) {
    legacySchema = true;
    result = await applyWithDirectSchema(admin, user.id, item);
  }

  if (result.error) {
    if (
      legacySchema &&
      isCosmeticLike(item) &&
      isMissingInventoryUseSchemaError(result.error)
    ) {
      return migrationRequiredResponse();
    }

    const code = getRpcErrorCode(result.error);

    return NextResponse.json(
      {
        details: code ? undefined : result.error.message,
        error: USE_ERROR_MESSAGES[code] ?? "Ürün kullanılamadı",
      },
      { status: USE_ERROR_STATUS[code] ?? result.status ?? 500 },
    );
  }

  const inventory = await fetchInventoryPayload(admin, user.id);

  return NextResponse.json({
    inventory,
    itemId: item.id,
    legacySchema,
    quantity: result.data.quantity,
    success: true,
    used: {
      consumed: result.data.consumed,
      equipped: result.data.equipped,
      itemId: item.id,
    },
  });
}
