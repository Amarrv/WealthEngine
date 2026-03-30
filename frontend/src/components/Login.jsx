import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Fingerprint, KeyRound, Loader2, SignalHigh } from 'lucide-react';

const Login = () => {
  const { loginWithPassword, loginWithBiometrics, registerUser } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBiometricLogin = async (e) => {
    e.preventDefault();
    if (!phoneNumber) {
      setStatus('Phone number required for Passkey logic.');
      return;
    }
    try {
      setLoading(true);
      setStatus('Waiting for FaceID/TouchID...');
      await loginWithBiometrics(phoneNumber);
    } catch (err) {
      console.error(err);
      const exactFault = err.response?.data?.message || err.message;
      setStatus(`Biometric Error: ${exactFault}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordAuth = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setStatus('Authenticating...');
      if (isRegistering) {
        await registerUser(username, phoneNumber, password);
      } else {
        await loginWithPassword(phoneNumber, password);
      }
    } catch (err) {
      console.error(err);
      setStatus('Authentication failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4">
      {/* Dynamic Background identical to Dashboard */}
      <div className="absolute inset-0 z-[-1] bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800/20 via-zinc-950 to-zinc-950" />

      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 mb-4 shadow-2xl">
            <SignalHigh className="w-6 h-6 text-zinc-100" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-zinc-100 tracking-tight">Wealth Engine</h1>
          <p className="text-sm text-zinc-500 font-mono mt-2">v1.0 Institutional Access</p>
        </div>

        {/* Frosted Glass Login Container */}
        <div className="bg-zinc-900/40 backdrop-blur-xl backdrop-saturate-150 border border-white/10 border-b-white/5 shadow-2xl shadow-black/80 rounded-2xl p-6 sm:p-8">

          <form className="space-y-5" onSubmit={handlePasswordAuth}>
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Display Name</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Bruce Wayne"
                  className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-700"
                  required={isRegistering}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Phone Identity</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 555 019 2831"
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-700"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">PIN / Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950/50 border border-white/10 rounded-xl px-4 py-3 text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-all placeholder:text-zinc-700"
                required
              />
            </div>

            {status && (
              <div className="text-xs text-rose-400 font-mono text-center p-2 bg-rose-950/20 rounded-lg border border-rose-900/30">
                {status}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group overflow-hidden bg-zinc-100 text-zinc-950 font-bold py-3.5 rounded-xl transition-all duration-300 hover:bg-white active:scale-[0.98] mt-2 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <KeyRound className="w-5 h-5" />}
              <span>{isRegistering ? "Initialize Vault" : "Authenticate"}</span>
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/5" />
            <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">or Secure Node</span>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={loading}
            className="w-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold py-3.5 rounded-xl transition-all duration-300 hover:bg-indigo-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Fingerprint className="w-5 h-5" />
            <span>Biometric Passkey</span>
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-4"
            >
              {isRegistering ? "Return to Login" : "First time? Initialize node here."}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
