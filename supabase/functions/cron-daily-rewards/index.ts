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
  power_level: number;
  status: string;
  data_center_id: string | null;
}

interface UserProfile {
  user_id: string;
  vip_level: number;
  service_button_last_pressed: string | null;
  maintenance_balance: string;
}

interface VIPLevel {
  level: number;
  maintenance_discount: string;
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

function calculateGrossBTC(hashrateT H: number, networkDifficulty: number): number {
  const blockReward = 3.125;
  const blocksPerDay = 144;
  const totalNetworkHashrate = networkDifficulty * Math.pow(2, 32) / 600 / 1e12;

  const dailyBTC = (hashrateT H / totalNetworkHashrate) * blockReward * blocksPerDay;
  return dailyBTC;
}

function calculateElectricityCost(
  hashrateT H: number,
  efficiencyWTH: number,
  btcPrice: number,
  electricityRateKWh: number = 0.05
): number {
  const powerKW = (hashrateT H * efficiencyWTH) / 1000;
  const dailyKWh = powerKW * 24;
  const dailyCostUSD = dailyKWh * electricityRateKWh;

  return dailyCostUSD / btcPrice;
}

function calculateServiceFee(grossBTC: number, feePercent: number = 15): number {
  return grossBTC * (feePercent / 100);
}

function calculateDiscounts(
  user: UserProfile,
  vipLevel: VIPLevel | null,
  maintenanceCostBTC: number
): {
  vipDiscount: number;
  tokenDiscount: number;
  serviceButtonDiscount: number;
  balanceCoverageDiscount: number;
  totalDiscount: number;
} {
  let vipDiscount = 0;
  let tokenDiscount = 0;
  let serviceButtonDiscount = 0;
  let balanceCoverageDiscount = 0;

  if (vipLevel) {
    vipDiscount = parseFloat(vipLevel.maintenance_discount) / 100;
  }

  const maintenanceBalance = parseFloat(user.maintenance_balance);
  const maintenanceDays = maintenanceCostBTC > 0
    ? maintenanceBalance / maintenanceCostBTC
    : 0;

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

  if (user.service_button_last_pressed) {
    const lastPressed = new Date(user.service_button_last_pressed).getTime();
    const hoursSince = (Date.now() - lastPressed) / (1000 * 60 * 60);
    if (hoursSince < 24) {
      serviceButtonDiscount = 0.03;
    }
  }

  const totalDiscount = Math.min(
    0.50,
    vipDiscount + tokenDiscount + serviceButtonDiscount + balanceCoverageDiscount
  );

  return {
    vipDiscount,
    tokenDiscount,
    serviceButtonDiscount,
    balanceCoverageDiscount,
    totalDiscount,
  };
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

    console.log("Starting daily rewards distribution...");

    const btcPrice = await getBTCPrice();
    const networkDifficulty = 109780000000000;
    const rewardDate = new Date().toISOString().split("T")[0];

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
          message: "No active miners to process",
          processed: 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Processing ${miners.length} active miners...`);

    const userMiners = new Map<string, MinerData[]>();
    for (const miner of miners) {
      const ownerId = miner.owner_id;
      if (!userMiners.has(ownerId)) {
        userMiners.set(ownerId, []);
      }
      userMiners.get(ownerId)!.push(miner as MinerData);
    }

    let totalRewardsDistributed = 0;
    let totalUsersProcessed = 0;

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

        let userTotalGross = 0;
        let userTotalElectricity = 0;
        let userTotalServiceFee = 0;
        let userTotalHashrate = 0;

        for (const miner of userMinersList) {
          const grossBTC = calculateGrossBTC(miner.hashrate_th, networkDifficulty);
          const electricityCostBTC = calculateElectricityCost(
            miner.hashrate_th,
            miner.efficiency_w_per_th,
            btcPrice
          );
          const serviceFee = calculateServiceFee(grossBTC);

          userTotalGross += grossBTC;
          userTotalElectricity += electricityCostBTC;
          userTotalServiceFee += serviceFee;
          userTotalHashrate += miner.hashrate_th;
        }

        const maintenanceCostBTC = userTotalElectricity + userTotalServiceFee;

        const discounts = calculateDiscounts(profile, vipLevel, maintenanceCostBTC);

        const discountAmount = maintenanceCostBTC * discounts.totalDiscount;
        const finalMaintenanceCost = maintenanceCostBTC - discountAmount;

        const netBTC = userTotalGross - finalMaintenanceCost;

        const { data: existingReward } = await supabase
          .from("daily_rewards")
          .select("id")
          .eq("user_id", userId)
          .eq("reward_date", rewardDate)
          .maybeSingle();

        if (!existingReward) {
          const { error: rewardError } = await supabase
            .from("daily_rewards")
            .insert({
              user_id: userId,
              reward_date: rewardDate,
              gross_btc: userTotalGross.toFixed(8),
              electricity_cost_btc: userTotalElectricity.toFixed(8),
              service_fee_btc: userTotalServiceFee.toFixed(8),
              maintenance_cost_btc: finalMaintenanceCost.toFixed(8),
              discount_applied: discountAmount.toFixed(8),
              net_btc: netBTC.toFixed(8),
              btc_price_usd: btcPrice.toString(),
              total_hashrate_th: userTotalHashrate.toFixed(2),
            });

          if (rewardError) {
            console.error(`Error creating reward for user ${userId}:`, rewardError);
            continue;
          }

          const { data: btcWallet } = await supabase
            .from("custodial_wallets")
            .select("balance")
            .eq("user_id", userId)
            .eq("asset", "BTC")
            .maybeSingle();

          const currentBalance = btcWallet ? parseFloat(btcWallet.balance) : 0;
          const newBalance = currentBalance + netBTC;

          await supabase
            .from("custodial_wallets")
            .upsert(
              {
                user_id: userId,
                asset: "BTC",
                balance: newBalance.toFixed(8),
                blockchain: "bitcoin",
              },
              {
                onConflict: "user_id,asset",
              }
            );

          await supabase.from("wallet_transactions").insert({
            wallet_id: btcWallet?.id || null,
            user_id: userId,
            transaction_type: "reward",
            asset: "BTC",
            amount: netBTC.toFixed(8),
            status: "completed",
            description: `Daily mining reward for ${rewardDate}`,
          });

          totalRewardsDistributed += netBTC;
          totalUsersProcessed++;

          console.log(`✓ User ${userId}: ${netBTC.toFixed(8)} BTC`);
        } else {
          console.log(`- User ${userId}: reward already exists for ${rewardDate}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError);
      }
    }

    console.log(
      `Rewards distribution complete: ${totalUsersProcessed} users, ${totalRewardsDistributed.toFixed(8)} BTC total`
    );

    return new Response(
      JSON.stringify({
        success: true,
        date: rewardDate,
        processed_users: totalUsersProcessed,
        total_btc_distributed: totalRewardsDistributed.toFixed(8),
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
