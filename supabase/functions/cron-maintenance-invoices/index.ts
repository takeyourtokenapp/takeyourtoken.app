import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MinerData {
  id: string;
  owner_id: string;
  hashrate_th: number;
  efficiency_w_per_th: number;
  status: string;
}

async function getBTCPrice(): Promise<number> {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
    const data = await response.json();
    return data.bitcoin?.usd || 95000;
  } catch (error) {
    console.error("BTC price fetch error:", error);
    return 95000;
  }
}

function calculateMaintenanceCost(
  hashrateT H: number,
  efficiencyWTH: number,
  btcPrice: number,
  electricityRate: number = 0.05
): number {
  const powerKW = (hashrateT H * efficiencyWTH) / 1000;
  const dailyKWh = powerKW * 24;
  const electricityCostUSD = dailyKWh * electricityRate;

  const serviceFeePercent = 0.15;
  const serviceFeeUSD = (hashrateT H * 10) * serviceFeePercent;

  const totalCostUSD = electricityCostUSD + serviceFeeUSD;
  return totalCostUSD / btcPrice;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - invalid cron secret" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Starting maintenance invoice generation...");

    const btcPrice = await getBTCPrice();
    const invoiceDate = new Date().toISOString().split("T")[0];

    const { data: miners, error: minersError } = await supabase
      .from("nft_miners")
      .select("*")
      .eq("status", "active");

    if (minersError) throw minersError;

    if (!miners || miners.length === 0) {
      console.log("No active miners found");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active miners to invoice",
          processed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing invoices for ${miners.length} miners...`);

    const userMiners = new Map<string, MinerData[]>();
    for (const miner of miners) {
      const ownerId = miner.owner_id;
      if (!userMiners.has(ownerId)) {
        userMiners.set(ownerId, []);
      }
      userMiners.get(ownerId)!.push(miner as MinerData);
    }

    let totalInvoicesCreated = 0;
    let totalAmountBTC = 0;

    for (const [userId, userMinersList] of userMiners.entries()) {
      try {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (!profile) continue;

        const { data: vipLevel } = await supabase
          .from("vip_levels")
          .select("*")
          .eq("level", profile.vip_level)
          .maybeSingle();

        let totalCostBTC = 0;

        for (const miner of userMinersList) {
          const minerCost = calculateMaintenanceCost(
            miner.hashrate_th,
            miner.efficiency_w_per_th,
            btcPrice
          );
          totalCostBTC += minerCost;
        }

        let vipDiscount = 0;
        if (vipLevel) {
          vipDiscount = parseFloat(vipLevel.maintenance_discount) / 100;
        }

        const maintenanceBalance = parseFloat(profile.maintenance_balance);
        const maintenanceDays = totalCostBTC > 0 ? maintenanceBalance / totalCostBTC : 0;

        let balanceCoverageDiscount = 0;
        if (maintenanceDays >= 360) {
          balanceCoverageDiscount = 0.18;
        } else if (maintenanceDays >= 180) {
          balanceCoverageDiscount = 0.13;
        } else if (maintenanceDays >= 90) {
          balanceCoverageDiscount = 0.09;
        } else if (maintenanceDays >= 30) {
          balanceCoverageDiscount = 0.05;
        } else if (maintenanceDays >= 20) {
          balanceCoverageDiscount = 0.02;
        }

        let serviceButtonDiscount = 0;
        if (profile.service_button_last_pressed) {
          const lastPressed = new Date(profile.service_button_last_pressed).getTime();
          const hoursSince = (Date.now() - lastPressed) / (1000 * 60 * 60);
          if (hoursSince < 24) {
            serviceButtonDiscount = 0.03;
          }
        }

        const totalDiscount = Math.min(
          0.50,
          vipDiscount + serviceButtonDiscount + balanceCoverageDiscount
        );

        const discountAmount = totalCostBTC * totalDiscount;
        const finalCost = totalCostBTC - discountAmount;

        const { data: existingInvoice } = await supabase
          .from("maintenance_invoices")
          .select("id")
          .eq("user_id", userId)
          .eq("invoice_date", invoiceDate)
          .maybeSingle();

        if (!existingInvoice) {
          const status = maintenanceBalance >= finalCost ? "paid" : "unpaid";

          const { error: invoiceError } = await supabase
            .from("maintenance_invoices")
            .insert({
              user_id: userId,
              invoice_date: invoiceDate,
              base_cost: totalCostBTC.toFixed(8),
              discount_applied: discountAmount.toFixed(8),
              final_cost: finalCost.toFixed(8),
              status: status,
              payment_method: status === "paid" ? "balance" : null,
            });

          if (invoiceError) {
            console.error(`Error creating invoice for user ${userId}:`, invoiceError);
            continue;
          }

          if (status === "paid") {
            const newBalance = maintenanceBalance - finalCost;

            await supabase
              .from("user_profiles")
              .update({ maintenance_balance: newBalance.toFixed(8) })
              .eq("user_id", userId);

            console.log(`✓ User ${userId}: Invoice paid (${finalCost.toFixed(8)} BTC)`);
          } else {
            console.log(`! User ${userId}: Invoice unpaid (${finalCost.toFixed(8)} BTC)`);
          }

          totalInvoicesCreated++;
          totalAmountBTC += finalCost;
        } else {
          console.log(`- User ${userId}: invoice already exists for ${invoiceDate}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError);
      }
    }

    console.log(
      `Invoice generation complete: ${totalInvoicesCreated} invoices, ${totalAmountBTC.toFixed(8)} BTC total`
    );

    return new Response(
      JSON.stringify({
        success: true,
        date: invoiceDate,
        invoices_created: totalInvoicesCreated,
        total_amount_btc: totalAmountBTC.toFixed(8),
        btc_price: btcPrice,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Cron job error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
