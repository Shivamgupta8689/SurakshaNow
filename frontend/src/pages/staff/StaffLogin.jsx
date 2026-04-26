import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail, getStaffProfile } from '../../services/firebase';
import toast from 'react-hot-toast';

const StaffLogin = () => {
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const normalizedId = employeeId.replace(/[^a-zA-Z0-9]/g, '');
      const emails = [
        `${normalizedId}@asap.app`,
        `${normalizedId}@surakshanow.app`,
      ];
      let userCred = null;
      let lastError = null;

      for (const email of emails) {
        try {
          userCred = await loginWithEmail(email, password);
          break;
        } catch (error) {
          lastError = error;
        }
      }

      if (!userCred) throw lastError;

      const profile = await getStaffProfile(userCred.user.uid);
      if (profile) {
        toast.success('Login successful');
        navigate('/staff/dashboard');
      } else {
        toast.success('Login successful');
        navigate('/staff/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-navy-950 grid-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* logo */}
<div className="flex justify-center mb-12">
  <img
    src="/asap.png"
    alt="ASAP Logo"
    className="h-28 sm:h-32 lg:h-36 w-auto object-contain drop-shadow-xl"
  />
</div>

        <h1 className="text-white text-xl font-bold uppercase tracking-wide text-center mb-2">
          Staff Login
        </h1>
        <p className="text-text-secondary text-xs text-center mb-8">
          Emergency Response Personnel Access
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="ASAP-XXXX-XXXX"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="text-text-muted text-[10px] uppercase tracking-wider font-medium block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input-field"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full py-3.5 ${loading ? 'opacity-50' : ''}`}
          >
            {loading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <p className="text-text-muted text-xs text-center mt-6">
          Contact your manager if you have trouble logging in
        </p>

        <div className="flex items-center justify-center gap-4 mt-8 text-text-muted text-[10px]">
          <span>Encryption: AES-256</span>
          <span className="text-border">|</span>
          <span>System v2.4.1</span>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
