const { supabaseAdmin } = require('../../config/supabase');
const { squareClient } = require('../../config/square');

/**
 * EC・注文管理サービス
 * 商品管理、オーダーバンプ、アップセル、注文処理、請求書発行
 */

// ── 商品管理 ──

async function createProduct(userId, data) {
  const { data: product, error } = await supabaseAdmin
    .from('products')
    .insert({
      user_id: userId,
      name: data.name,
      description: data.description,
      price: data.price,
      sale_price: data.salePrice,
      product_type: data.productType || 'digital',
      image_url: data.imageUrl,
      delivery_method: data.deliveryMethod || 'auto',
      download_url: data.downloadUrl,
      course_id: data.courseId,
    })
    .select()
    .single();
  if (error) throw error;
  return product;
}

async function getProducts(userId) {
  const { data } = await supabaseAdmin
    .from('products')
    .select('*, order_bumps(*), courses(name)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data || [];
}

async function updateProduct(userId, productId, updates) {
  const { data, error } = await supabaseAdmin
    .from('products').update(updates).eq('id', productId).eq('user_id', userId).select().single();
  if (error) throw error;
  return data;
}

async function deleteProduct(userId, productId) {
  await supabaseAdmin.from('products').update({ is_active: false }).eq('id', productId).eq('user_id', userId);
}

// ── オーダーバンプ ──

async function setOrderBump(productId, data) {
  const { data: bump, error } = await supabaseAdmin
    .from('order_bumps')
    .insert({
      product_id: productId,
      bump_product_id: data.bumpProductId,
      headline: data.headline,
      description: data.description,
      discount_percent: data.discountPercent || 0,
      sort_order: data.sortOrder || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return bump;
}

async function getOrderBumps(productId) {
  const { data } = await supabaseAdmin
    .from('order_bumps')
    .select('*, products!bump_product_id(name, price, image_url)')
    .eq('product_id', productId)
    .eq('is_active', true)
    .order('sort_order');
  return data || [];
}

// ── アップセル ──

async function setUpsell(userId, data) {
  const { data: upsell, error } = await supabaseAdmin
    .from('upsells')
    .insert({
      user_id: userId,
      trigger_product_id: data.triggerProductId,
      offer_product_id: data.offerProductId,
      headline: data.headline,
      description: data.description,
      page_html: data.pageHtml,
      discount_percent: data.discountPercent || 0,
      upsell_type: data.upsellType || 'upsell',
      sort_order: data.sortOrder || 0,
    })
    .select()
    .single();
  if (error) throw error;
  return upsell;
}

async function getUpsells(userId, triggerProductId) {
  const { data } = await supabaseAdmin
    .from('upsells')
    .select('*, products!offer_product_id(name, price, image_url)')
    .eq('user_id', userId)
    .eq('trigger_product_id', triggerProductId)
    .eq('is_active', true)
    .order('sort_order');
  return data || [];
}

// ── 注文処理 ──

async function createOrder(userId, data) {
  // サーバー側で価格を再計算（クライアント送信金額を信頼しない）
  let subtotal = 0;
  const itemsWithPrice = [];
  if (data.items && data.items.length > 0) {
    for (const item of data.items) {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('price, sale_price')
        .eq('id', item.productId)
        .single();
      if (!product) throw new Error(`商品が見つかりません: ${item.productId}`);
      const unitPrice = product.sale_price || product.price;
      const quantity = item.quantity || 1;
      const discount = item.discount || 0;
      subtotal += unitPrice * quantity - discount;
      itemsWithPrice.push({
        productId: item.productId,
        itemType: item.itemType || 'main',
        price: unitPrice,
        discount,
        quantity,
      });
    }
  }
  const discount = data.discount || 0;
  const total = subtotal - discount;

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .insert({
      user_id: userId,
      customer_email: data.customerEmail,
      customer_name: data.customerName,
      follower_id: data.followerId || null,
      member_id: data.memberId || null,
      affiliate_id: data.affiliateId || null,
      subtotal,
      discount,
      total,
      payment_method: data.paymentMethod || 'square',
      ip_address: data.ipAddress,
    })
    .select()
    .single();
  if (error) throw error;

  // 注文明細を挿入
  if (itemsWithPrice.length > 0) {
    const items = itemsWithPrice.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      item_type: item.itemType,
      price: item.price,
      discount: item.discount,
      quantity: item.quantity,
    }));
    await supabaseAdmin.from('order_items').insert(items);
  }

  return order;
}

async function completeOrder(orderId, paymentId) {
  // べき等性チェック: 既にcompletedなら重複処理しない
  const { data: existing } = await supabaseAdmin
    .from('orders').select('status').eq('id', orderId).single();
  if (existing?.status === 'completed') return existing;

  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'completed', payment_id: paymentId, completed_at: new Date().toISOString() })
    .eq('id', orderId)
    .select('*, order_items(*, products(course_id, delivery_method, download_url))')
    .single();
  if (error) throw error;

  // 自動デリバリー: コース商品の場合は会員サイトアクセス権付与
  for (const item of (order.order_items || [])) {
    if (item.products?.course_id && item.products?.delivery_method === 'course') {
      const { autoProvisionMember } = require('../member/memberSite');
      // コースに紐づくサイトを取得
      const { data: course } = await supabaseAdmin
        .from('courses').select('site_id').eq('id', item.products.course_id).single();
      if (course) {
        await autoProvisionMember(course.site_id, item.products.course_id, order.customer_email, order.customer_name, order.follower_id);
      }
    }
  }

  // アフィリエイト成果記録
  if (order.affiliate_id) {
    const commission = Math.round(order.total * 0.3); // デフォルト30%
    await supabaseAdmin.from('affiliate_conversions').insert({
      affiliate_id: order.affiliate_id,
      order_id: orderId,
      revenue: order.total,
      commission,
      status: 'pending',
    });
    // アフィリエイト集計更新
    await supabaseAdmin.rpc('increment_affiliate_stats', {
      aff_id: order.affiliate_id,
      rev: order.total,
      comm: commission,
    }).catch(async () => {
      const { data: aff } = await supabaseAdmin.from('affiliates').select('total_conversions, total_revenue, total_commission').eq('id', order.affiliate_id).single();
      if (aff) {
        await supabaseAdmin.from('affiliates').update({
          total_conversions: (aff.total_conversions || 0) + 1,
          total_revenue: (aff.total_revenue || 0) + order.total,
          total_commission: (aff.total_commission || 0) + commission,
        }).eq('id', order.affiliate_id);
      }
    });
  }

  return order;
}

async function getOrders(userId, options = {}) {
  let query = supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(name, image_url))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (options.status) query = query.eq('status', options.status);
  if (options.limit) query = query.limit(options.limit);

  const { data } = await query;
  return data || [];
}

async function refundOrder(userId, orderId) {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'refunded' })
    .eq('id', orderId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── 請求書・領収書 ──

async function generateInvoice(userId, orderId, type = 'receipt') {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(name, price))')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();
  if (!order) throw new Error('注文が見つかりません');

  const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', userId).single();

  // 請求書番号生成
  const invoiceNumber = `${type === 'receipt' ? 'R' : 'I'}-${Date.now().toString(36).toUpperCase()}`;

  const items = (order.order_items || []).map(item => ({
    name: item.products?.name || '商品',
    quantity: item.quantity,
    unitPrice: item.price,
    amount: item.price * item.quantity - (item.discount || 0),
  }));

  const tax = Math.round(order.total * 0.1); // 消費税10%

  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      user_id: userId,
      order_id: orderId,
      invoice_number: invoiceNumber,
      invoice_type: type,
      customer_name: order.customer_name || order.customer_email,
      customer_email: order.customer_email,
      items,
      subtotal: order.subtotal,
      tax,
      total: order.total,
    })
    .select()
    .single();
  if (error) throw error;
  return invoice;
}

// ── ファネル管理 ──

async function createFunnel(userId, data) {
  const { data: funnel, error } = await supabaseAdmin
    .from('funnels')
    .insert({ user_id: userId, name: data.name, description: data.description, steps: data.steps || [] })
    .select()
    .single();
  if (error) throw error;
  return funnel;
}

async function getFunnels(userId) {
  const { data } = await supabaseAdmin
    .from('funnels')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data || [];
}

async function updateFunnel(userId, funnelId, updates) {
  const { data, error } = await supabaseAdmin
    .from('funnels').update(updates).eq('id', funnelId).eq('user_id', userId).select().single();
  if (error) throw error;
  return data;
}

// ── 広告コンバージョン送信 ──

async function trackAdConversion(userId, data) {
  const { data: conv, error } = await supabaseAdmin
    .from('ad_conversions')
    .insert({
      user_id: userId,
      platform: data.platform || 'meta',
      event_name: data.eventName,
      event_data: data.eventData,
      pixel_id: data.pixelId,
      order_id: data.orderId,
      follower_id: data.followerId,
      value: data.value,
    })
    .select()
    .single();
  if (error) throw error;

  // Meta Conversions API送信
  if (data.platform === 'meta' && data.pixelId && data.accessToken) {
    await sendMetaConversion(data);
  }

  return conv;
}

async function sendMetaConversion(data) {
  const endpoint = `https://graph.facebook.com/v18.0/${data.pixelId}/events`;
  await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [{
        event_name: data.eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: data.userData || {},
        custom_data: { currency: 'JPY', value: data.value },
      }],
      access_token: data.accessToken,
    }),
  });
}

module.exports = {
  createProduct, getProducts, updateProduct, deleteProduct,
  setOrderBump, getOrderBumps,
  setUpsell, getUpsells,
  createOrder, completeOrder, getOrders, refundOrder,
  generateInvoice,
  createFunnel, getFunnels, updateFunnel,
  trackAdConversion,
};
