import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { TronWeb } from 'npm:tronweb@6.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateAddressRequest {
  network_code: string;
}

interface GenerateAddressResponse {
  success: boolean;
  address?: string;
  network_name?: string;
  explorer_url?: string;
  qr_code?: string;
  derivation_path?: string;
  error?: string;
}

async function generateQRCode(address: string, network: string): Promise<string> {
  try {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(address)}&format=svg`;
    const response = await fetch(url);
    const svgData = await response.text();
    return `data:image/svg+xml;base64,${btoa(svgData)}`;
  } catch (error) {
    console.error('QR code generation failed:', error);
    return '';
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { network_code }: GenerateAddressRequest = await req.json();

    if (!network_code) {
      throw new Error('network_code is required');
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: existingAddress } = await supabaseAdmin
      .from('user_deposit_addresses')
      .select('address, derivation_path, blockchain_networks(network_name, explorer_url)')
      .eq('user_id', user.id)
      .eq('network_code', network_code)
      .single();

    if (existingAddress) {
      const qrCode = await generateQRCode(existingAddress.address, network_code);

      const result: GenerateAddressResponse = {
        success: true,
        address: existingAddress.address,
        network_name: (existingAddress as any).blockchain_networks?.network_name,
        explorer_url: (existingAddress as any).blockchain_networks?.explorer_url,
        qr_code: qrCode,
        derivation_path: existingAddress.derivation_path || '',
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: network } = await supabaseAdmin
      .from('blockchain_networks')
      .select('*')
      .eq('network_code', network_code)
      .eq('is_active', true)
      .single();

    if (!network) {
      throw new Error('Network not supported or inactive');
    }

    const { data: addressCount } = await supabaseAdmin
      .from('user_deposit_addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const accountIndex = (addressCount || 0);

    let newAddress: string;
    let privateKeyEncrypted: string | null = null;
    let derivationPath = '';

    const encryptionKey = Deno.env.get('WALLET_ENCRYPTION_KEY') || 'default-encryption-key-change-in-production';
    const crypto = await import('node:crypto');

    if (network_code === 'BTC') {
      const { payments, networks } = await import('npm:bitcoinjs-lib@6.1.5');
      const { ECPairFactory } = await import('npm:ecpair@2.1.0');
      const ecc = await import('npm:tiny-secp256k1@2.2.3');
      const ECPair = ECPairFactory(ecc);

      const privateKeyBytes = crypto.randomBytes(32);
      const keyPair = ECPair.fromPrivateKey(privateKeyBytes);
      const { address } = payments.p2wpkh({ pubkey: keyPair.publicKey, network: networks.bitcoin });

      newAddress = address!;
      derivationPath = `m/84'/0'/0'/0/${accountIndex}`;
      privateKeyEncrypted = btoa(`${encryptionKey}:${privateKeyBytes.toString('hex')}`);

    } else if (network_code === 'TRON') {
      const tronWeb = new TronWeb({
        fullHost: network.rpc_endpoint || 'https://api.trongrid.io',
      });

      const account = await tronWeb.createAccount();
      newAddress = account.address.base58;
      derivationPath = `m/44'/195'/0'/0/${accountIndex}`;
      privateKeyEncrypted = btoa(`${encryptionKey}:${account.privateKey}`);

    } else if (network_code === 'ETH' || network_code === 'BSC' || network_code === 'POLYGON') {
      const wallet = crypto.randomBytes(32).toString('hex');
      const { keccak256 } = await import('npm:ethereum-cryptography@2.1.2/keccak');
      const { publicKeyCreate } = await import('npm:ethereum-cryptography@2.1.2/secp256k1');

      const privateKeyBytes = new Uint8Array(Buffer.from(wallet, 'hex'));
      const publicKey = publicKeyCreate(privateKeyBytes, false).slice(1);
      const addressHash = keccak256(publicKey);
      newAddress = '0x' + Buffer.from(addressHash.slice(-20)).toString('hex');

      const coinType = network_code === 'ETH' ? '60' : network_code === 'BSC' ? '60' : '60';
      derivationPath = `m/44'/${coinType}'/0'/0/${accountIndex}`;
      privateKeyEncrypted = btoa(`${encryptionKey}:${wallet}`);

    } else if (network_code === 'SOL') {
      const { Keypair } = await import('npm:@solana/web3.js@1.87.6');
      const keypair = Keypair.generate();
      newAddress = keypair.publicKey.toBase58();
      derivationPath = `m/44'/501'/0'/0/${accountIndex}`;
      privateKeyEncrypted = btoa(`${encryptionKey}:${Buffer.from(keypair.secretKey).toString('hex')}`);

    } else if (network_code === 'XRP') {
      const { Wallet } = await import('npm:xrpl@3.0.0');
      const wallet = Wallet.generate();
      newAddress = wallet.address;
      derivationPath = `m/44'/144'/0'/0/${accountIndex}`;
      privateKeyEncrypted = btoa(`${encryptionKey}:${wallet.seed}`);

    } else {
      throw new Error(`Address generation not implemented for ${network_code}`);
    }

    const qrCode = await generateQRCode(newAddress, network_code);

    const { error: insertError } = await supabaseAdmin
      .from('user_deposit_addresses')
      .insert({
        user_id: user.id,
        network_code: network_code,
        address: newAddress,
        private_key_encrypted: privateKeyEncrypted,
        derivation_path: derivationPath,
        is_verified: true,
      });

    if (insertError) {
      throw insertError;
    }

    const result: GenerateAddressResponse = {
      success: true,
      address: newAddress,
      network_name: network.network_name,
      explorer_url: network.explorer_url,
      qr_code: qrCode,
      derivation_path: derivationPath,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error generating deposit address:', error);
    
    const result: GenerateAddressResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});