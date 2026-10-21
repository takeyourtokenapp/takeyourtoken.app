import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SupabaseTest() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [details, setDetails] = useState<any>({});

  useEffect(() => {
    async function testConnection() {
      try {
        const url = import.meta.env.VITE_SUPABASE_URL;
        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

        setDetails({
          url_present: !!url,
          url_value: url,
          key_present: !!key,
          key_length: key?.length || 0
        });

        const { data, error } = await supabase.from('profiles').select('count').limit(1);

        if (error) {
          setStatus('error');
          setDetails((prev: any) => ({ ...prev, error: error.message }));
        } else {
          setStatus('success');
          setDetails((prev: any) => ({ ...prev, query_result: 'OK' }));
        }
      } catch (err) {
        setStatus('error');
        setDetails((prev: any) => ({
          ...prev,
          exception: err instanceof Error ? err.message : 'Unknown error'
        }));
      }
    }

    testConnection();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Supabase Connection Test</h1>

        <div className={`p-6 rounded-lg ${
          status === 'loading' ? 'bg-blue-900/20' :
          status === 'success' ? 'bg-green-900/20' :
          'bg-red-900/20'
        }`}>
          <div className="mb-4">
            <span className="font-semibold">Status: </span>
            <span className={`${
              status === 'loading' ? 'text-blue-400' :
              status === 'success' ? 'text-green-400' :
              'text-red-400'
            }`}>
              {status.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold mb-2">Details:</h2>
            <pre className="bg-black/30 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(details, null, 2)}
            </pre>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <h2 className="text-xl font-semibold">Instructions:</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-300">
            <li>Check that VITE_SUPABASE_URL is present</li>
            <li>Check that VITE_SUPABASE_ANON_KEY is present and has proper length</li>
            <li>If values are missing, restart the dev server</li>
            <li>If error persists, check browser console for details</li>
            <li>
              <strong>If signup fails:</strong> Check Supabase Dashboard → Authentication → Settings
              <br />
              Ensure "Confirm Email" is DISABLED for development
            </li>
          </ol>

          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h3 className="font-semibold text-blue-300 mb-2">Common Issues:</h3>
            <ul className="space-y-1 text-sm text-gray-300">
              <li>• "Database error" → Disable email confirmation in Supabase Dashboard</li>
              <li>• "Network error" → Check environment variables above</li>
              <li>• "Invalid credentials" → User doesn't exist, try signup first</li>
            </ul>
          </div>

          <div className="flex gap-4 mt-6">
            <a
              href="/signup"
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition"
            >
              Go to Signup
            </a>
            <a
              href="/login"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
