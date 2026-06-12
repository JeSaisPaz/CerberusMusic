import React, { useState } from 'react';
import { subsonic } from '../subsonic';
import { Music, AlertCircle, Loader } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formattedUrl = window.location.origin;

      // Temporarily set credentials
      subsonic.saveCredentials(formattedUrl, username.trim(), password);

      // Validate connection
      const success = await subsonic.ping();
      if (success) {
        onLoginSuccess();
      } else {
        subsonic.clearCredentials();
        setError('Could not connect to Navidrome backend. Please check your username and password.');
      }
    } catch (err: any) {
      subsonic.clearCredentials();
      setError(err?.message || 'Connection failed. Please check your username and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <Music size={40} color="#fff" />
          </div>
          <h1 style={styles.title}>Cerberus Music</h1>
          <p style={styles.subtitle}>A Spotify-like experience for your Navidrome library</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              required
              disabled={loading}
              className="input-field"
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
              className="input-field"
              style={styles.input}
            />
          </div>

          {error && (
            <div style={styles.errorContainer}>
              <AlertCircle size={20} color="#e05e36" />
              <span style={styles.errorText}>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={styles.submitBtn}
          >
            {loading ? (
              <span style={styles.loaderText}>
                <Loader size={18} className="spin" style={{ marginRight: 8 }} />
                Connecting...
              </span>
            ) : (
              'Connect Library'
            )}
          </button>

          <div style={styles.setupContainer}>
            <a href="/app" style={styles.setupLink} target="_self">
              First-time Setup / Server Admin Panel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: '#0e0d0c', // Deep warm gray
    padding: '24px',
  },
  card: {
    backgroundColor: '#171513', // Sidebar dark clay
    border: '1px solid #2b2623',
    borderRadius: '16px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '32px',
    textAlign: 'center',
  },
  logoIcon: {
    width: '72px',
    height: '72px',
    borderRadius: '20px',
    backgroundColor: '#e05e36', // Anthropic Orange
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '16px',
    boxShadow: '0 8px 16px rgba(224, 94, 54, 0.3)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    color: '#f9f6f0',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#a69f95',
    maxWidth: '300px',
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#a69f95',
  },
  input: {
    width: '100%',
  },
  hint: {
    fontSize: '0.75rem',
    color: '#706a62',
    marginTop: '2px',
  },
  errorContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'rgba(224, 94, 54, 0.1)',
    border: '1px solid rgba(224, 94, 54, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    marginTop: '8px',
  },
  errorText: {
    fontSize: '0.85rem',
    color: '#f9f6f0',
    lineHeight: '1.4',
  },
  submitBtn: {
    marginTop: '12px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupContainer: {
    marginTop: '16px',
    textAlign: 'center',
  },
  setupLink: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'var(--color-orange)',
    textDecoration: 'none',
  }
};
