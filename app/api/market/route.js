import { NextResponse } from "next/server";
import { buildInventoryPayload } from "@/lib/market/inventory";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";
import { MARKET_CATALOG, XP_SOURCES } from "@/lib/economy";

export const dynamic = "force-dynamic";

const MARKET_ERROR_STATUS = {
  market_insufficient_balance: 400,
  market_item_already_owned: 400,
  market_item_required: 400,
  market_invalid_price: 400,
  market_invalid_quantity: 400,
  market_user_not_found: 404,
};

const MARKET_ERROR_MESSAGES = {
  market_insufficient_balance: "Yetersiz LogCoin",
  market_item_already_owned: "Zaten sahipsin",
  market_item_required: "Ürün seçilmedi",
  market_invalid_price: "Ürün fiyatı geçersiz",
  market_invalid_quantity: "Ürün miktarı geçersiz",
  market_user_not_found: "Kullanıcı bulunamadı",
};

function isMissingMarketSchemaError(error) {
  return ["PGRST202", "PGRST204", "PGRST205", "42P01", "42703"].includes(
    error?.code,
  );
}

function getRpcErrorCode(error) {
  return error?.message?.match(/market_[a-z_]+/)?.[0] ?? null;
}

function toItemSnapshot(item) {
  return {
    category: item.category,
    color: item.color ?? null,
    description: item.description,
    id: item.id,
    name: item.name,
    price: item.price,
    sprite: item.sprite ?? null,
  };
}

async function findLegacyInventoryItem(admin, userId, itemId) {
  let result = await admin
    .from("inventory")
    .select("id,quantity")
    .eq("user_id", userId)
    .eq("item_id", itemId)
    .maybeSingle();

  if (result.error && isMissingMarketSchemaError(result.error)) {
    result = await admin
      .from("inventory")
      .select("id")
      .eq("user_id", userId)
      .eq("item_id", itemId)
      .maybeSingle();
  }

  return result;
}

async function incrementLegacyInventory(admin, existing, userId, itemId) {
  if (existing?.quantity != null) {
    const nextQuantity = Math.max(1, Number(existing.quantity)) + 1;
    const updateResult = await admin
      .from("inventory")
      .update({
        last_acquired_at: new Date().toISOString(),
        quantity: nextQuantity,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("quantity")
      .single();

    if (!updateResult.error) {
      return { error: null, quantity: updateResult.data.quantity };
    }
  }

  const insertResult = await admin
    .from("inventory")
    .insert({ item_id: itemId, user_id: userId })
    .select("item_id")
    .single();

  if (insertResult.error) {
    return { error: insertResult.error, quantity: null };
  }

  return { error: null, quantity: (existing?.quantity ?? 0) + 1 };
}

async function insertPurchaseHistoryIfAvailable(admin, payload) {
  const { error } = await admin.from("market_purchases").insert(payload);

  if (error && !isMissingMarketSchemaError(error)) {
    console.warn("Market purchase history insert failed", error);
  }
}

async function purchaseWithLegacySchema(admin, userId, item) {
  const { data: player, error: playerError } = await admin
    .from("users")
    .select("balance,xp,first_purchase_done")
    .eq("id", userId)
    .single();

  if (playerError || !player) {
    return {
      data: null,
      error: playerError ?? { message: "Kullanıcı bulunamadı" },
      status: 404,
    };
  }

  if ((player.balance ?? 0) < item.price) {
    return {
      data: null,
      error: { message: "Yetersiz LogCoin" },
      status: 400,
    };
  }

  const existingResult = await findLegacyInventoryItem(admin, userId, item.id);

  if (existingResult.error) {
    return { data: null, error: existingResult.error, status: 500 };
  }

  if (existingResult.data && item.category !== "consumable") {
    return {
      data: null,
      error: { message: "Zaten sahipsin" },
      status: 400,
    };
  }

  const xpAwarded =
    Math.max(0, Number(item.xp ?? 0) + Number(item.xp_reward ?? 0)) +
    (player.first_purchase_done ? 0 : XP_SOURCES.first_purchase);
  const newBalance = (player.balance ?? 0) - item.price;

  const inventoryResult = await incrementLegacyInventory(
    admin,
    existingResult.data,
    userId,
    item.id,
  );

  if (inventoryResult.error) {
    return { data: null, error: inventoryResult.error, status: 500 };
  }

  const { error: updateError } = await admin
    .from("users")
    .update({
      balance: newBalance,
      first_purchase_done: true,
      xp: (player.xp ?? 0) + xpAwarded,
    })
    .eq("id", userId);

  if (updateError) {
    return { data: null, error: updateError, status: 500 };
  }

  await insertPurchaseHistoryIfAvailable(admin, {
    balance_after: newBalance,
    balance_before: player.balance ?? 0,
    item_category: item.category,
    item_id: item.id,
    item_name: item.name,
    item_snapshot: toItemSnapshot(item),
    price_paid: item.price,
    quantity_delta: 1,
    user_id: userId,
    xp_awarded: xpAwarded,
  });

  return {
    data: {
      balance_after: newBalance,
      purchase_id: null,
      quantity: inventoryResult.quantity,
      xp_awarded: xpAwarded,
    },
    error: null,
    status: 200,
  };
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

  const item = MARKET_CATALOG.find((i) => i.id === itemId);

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
        error: "Market servisi yapılandırılmamış",
      },
      { status: 500 },
    );
  }

  const { data, error } = await admin
    .rpc("purchase_market_item", {
      p_base_xp_reward: Math.max(0, Number(item.xp ?? 0) + Number(item.xp_reward ?? 0)),
      p_first_purchase_xp: XP_SOURCES.first_purchase,
      p_item_category: item.category,
      p_item_id: item.id,
      p_item_name: item.name,
      p_item_price: item.price,
      p_item_snapshot: toItemSnapshot(item),
      p_quantity_delta: 1,
      p_user_id: user.id,
    })
    .single();

  if (error) {
    const code = getRpcErrorCode(error);

    if (isMissingMarketSchemaError(error)) {
      const fallback = await purchaseWithLegacySchema(admin, user.id, item);

      if (!fallback.error) {
        return NextResponse.json({
          inventory: buildInventoryPayload([
            {
              item_id: item.id,
              quantity: fallback.data.quantity,
            },
          ]),
          legacySchema: true,
          newBalance: fallback.data.balance_after,
          purchaseId: fallback.data.purchase_id,
          quantity: fallback.data.quantity,
          success: true,
          xpAwarded: fallback.data.xp_awarded,
        });
      }

      return NextResponse.json(
        {
          details: fallback.error.message,
          error: "Satın alma eski envanter şemasına yazılamadı",
        },
        { status: fallback.status },
      );
    }

    return NextResponse.json(
      {
        details: code ? undefined : error.message,
        error: MARKET_ERROR_MESSAGES[code] ?? "Satın alma tamamlanamadı",
      },
      { status: MARKET_ERROR_STATUS[code] ?? 500 },
    );
  }

  return NextResponse.json({
    inventory: buildInventoryPayload([
      {
        item_id: item.id,
        quantity: data.quantity,
      },
    ]),
    newBalance: data.balance_after,
    purchaseId: data.purchase_id,
    quantity: data.quantity,
    success: true,
    xpAwarded: data.xp_awarded,
  });
}
