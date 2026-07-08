import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Server, Terminal, Play, Lock, Code, ChevronRight, 
  ChevronDown, BookOpen, AlertCircle, Check, Copy, ArrowLeft,
  Settings, User, Key, Globe
} from 'lucide-react';

const API_SECTIONS = [
  {
    title: 'Authentication & Profiles',
    id: 'auth',
    endpoints: [
      {
        method: 'POST',
        path: '/api/signup',
        description: 'Register a new user account profile in the database.',
        bodyParams: [
          { name: 'username', type: 'string', required: true, desc: 'Login email address.' },
          { name: 'password', type: 'string', required: true, desc: 'Secure password (min 8 chars).' },
          { name: 'name', type: 'string', required: true, desc: 'Username (display/screen name).' },
          { name: 'securityQuestion', type: 'string', required: true, desc: 'Security question for password resets.' },
          { name: 'securityAnswer', type: 'string', required: true, desc: 'Answer to security question.' },
        ],
        defaultPayload: {
          username: 'developer@example.com',
          password: 'supersecurepassword123',
          name: 'dev_user',
          securityQuestion: 'What is your favorite coding language?',
          securityAnswer: 'JavaScript'
        },
        responses: [
          { code: 201, msg: 'Account registered successfully.' },
          { code: 400, msg: 'Invalid payload or username already taken.' }
        ]
      },
      {
        method: 'POST',
        path: '/api/login',
        description: 'Authenticate and receive a JWT access token.',
        bodyParams: [
          { name: 'username', type: 'string', required: true, desc: 'Email address or username.' },
          { name: 'password', type: 'string', required: true, desc: 'User password.' }
        ],
        defaultPayload: {
          username: 'developer@example.com',
          password: 'supersecurepassword123'
        },
        responses: [
          { code: 200, msg: 'Login successful. Returns authorization token.' },
          { code: 401, msg: 'Invalid credentials.' }
        ]
      },
      {
        method: 'GET',
        path: '/api/profile',
        description: 'Fetch the active authenticated user profile details.',
        requiresAuth: true,
        responses: [
          { code: 200, msg: 'Returns profile details: name, email, plan.' },
          { code: 401, msg: 'Unauthorized session.' }
        ]
      }
    ]
  },
  {
    title: 'Encrypted Backups',
    id: 'backups',
    endpoints: [
      {
        method: 'GET',
        path: '/api/backups',
        description: 'Retrieve a list of all encrypted backups stored in the user vault.',
        requiresAuth: true,
        responses: [
          { code: 200, msg: 'Returns list of backups (metadata only).' },
          { code: 401, msg: 'Unauthorized session.' }
        ]
      },
      {
        method: 'POST',
        path: '/api/backups',
        description: 'Upload a new encrypted backup vault slot.',
        requiresAuth: true,
        bodyParams: [
          { name: 'label', type: 'string', required: true, desc: 'Descriptive title for this backup slot.' },
          { name: 'payload', type: 'string', required: true, desc: 'Encrypted payload string.' }
        ],
        defaultPayload: {
          label: 'My Secure Backup 1',
          payload: 'U2FsdGVkX18...[ENCRYPTED_VAULT_STRING]'
        },
        responses: [
          { code: 200, msg: 'Backup saved successfully.' },
          { code: 401, msg: 'Unauthorized session.' }
        ]
      }
    ]
  },
  {
    title: 'Licensing & Plans',
    id: 'licensing',
    endpoints: [
      {
        method: 'POST',
        path: '/api/license/purchase',
        description: 'Register a purchase for a self-hosted plan key.',
        requiresAuth: true,
        bodyParams: [
          { name: 'licensee', type: 'string', required: true, desc: 'Email address of the licensee.' },
          { name: 'durationDays', type: 'number', required: false, desc: 'Duration in days (default: 365).' }
        ],
        defaultPayload: {
          licensee: 'developer@example.com',
          durationDays: 365
        },
        responses: [
          { code: 201, msg: 'License generated.' },
          { code: 401, msg: 'Unauthorized session.' }
        ]
      },
      {
        method: 'GET',
        path: '/api/licenses/check',
        description: 'Verify active self-hosted licenses matching the logged-in profile.',
        requiresAuth: true,
        responses: [
          { code: 200, msg: 'Returns verification status and key if valid.' }
        ]
      }
    ]
  }
];

export default function DevPortalView({ onNavigate }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  // Active document section on scrolling or sidebar select
  const [activeSection, setActiveSection] = useState('auth');
  const [expandedCard, setExpandedCard] = useState(null); // method+path ID

  // Dynamic Runner states
  const [authTokenInput, setAuthTokenInput] = useState('');
  const [runnerPayloads, setRunnerPayloads] = useState({});
  const [runnerResults, setRunnerResults] = useState({});
  const [runnerLoading, setRunnerLoading] = useState({});
  const [copiedText, setCopiedText] = useState('');

  // Code Tab styles
  const [codeTabs, setCodeTabs] = useState({}); // path -> 'js' | 'dart'

  // Sync token from localStorage if master already logged in
  useEffect(() => {
    const checkMasterSession = async () => {
      const token = localStorage.getItem('masterToken');
      if (!token) return;
      try {
        const res = await fetch('/api/master/stats', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) {
          setIsAuthenticated(true);
          setAuthTokenInput(token);
        } else {
          localStorage.removeItem('masterToken');
        }
      } catch {
        localStorage.removeItem('masterToken');
      }
    };
    checkMasterSession();
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);

    try {
      const res = await fetch('/api/master/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem('masterToken', data.token);
          setAuthTokenInput(data.token);
        }
        setIsAuthenticated(true);
      } else {
        setAuthError(data.error || 'Invalid credentials');
      }
    } catch {
      setAuthError('Connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRunRequest = async (endpoint) => {
    const key = `${endpoint.method}:${endpoint.path}`;
    setRunnerLoading(prev => ({ ...prev, [key]: true }));
    setRunnerResults(prev => ({ ...prev, [key]: null }));

    const payload = runnerPayloads[key] !== undefined 
      ? runnerPayloads[key] 
      : JSON.stringify(endpoint.defaultPayload || {}, null, 2);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (endpoint.requiresAuth || authTokenInput) {
        headers['Authorization'] = `Bearer ${authTokenInput}`;
      }

      const fetchOptions = {
        method: endpoint.method,
        headers
      };

      if (endpoint.method !== 'GET' && endpoint.method !== 'DELETE') {
        fetchOptions.body = payload;
      }

      const startTime = Date.now();
      const res = await fetch(endpoint.path, fetchOptions);
      const duration = Date.now() - startTime;

      let bodyData;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        bodyData = await res.json();
      } else {
        bodyData = await res.text();
      }

      setRunnerResults(prev => ({
        ...prev,
        [key]: {
          status: res.status,
          statusText: res.statusText,
          durationMs: duration,
          body: bodyData
        }
      }));
    } catch (err) {
      setRunnerResults(prev => ({
        ...prev,
        [key]: {
          status: 'Error',
          statusText: 'Fetch Failure',
          durationMs: 0,
          body: { error: err.message }
        }
      }));
    } finally {
      setRunnerLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handlePayloadChange = (key, val) => {
    setRunnerPayloads(prev => ({ ...prev, [key]: val }));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const generateDartSnippet = (endpoint) => {
    return `// Flutter + http package
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> runRequest() async {
  final res = await http.${endpoint.method.toLowerCase()}(
    Uri.parse('http://localhost:8080${endpoint.path}'),
    headers: {
      'Content-Type': 'application/json',
      ${endpoint.requiresAuth ? "'Authorization': 'Bearer YOUR_TOKEN_HERE'" : ''}
    },
    ${endpoint.method !== 'GET' ? `body: jsonEncode(${JSON.stringify(endpoint.defaultPayload || {})}),` : ''}
  );
  print(res.statusCode);
}`;
  };

  const generateJsSnippet = (endpoint) => {
    return `// JavaScript Fetch API
const res = await fetch('${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    ${endpoint.requiresAuth ? "'Authorization': 'Bearer ' + token" : ''}
  },
  ${endpoint.method !== 'GET' ? `body: JSON.stringify(${JSON.stringify(endpoint.defaultPayload || {})}),` : ''}
});
const data = await res.json();
console.log(res.status, data);`;
  };

  // --- RENDER PORTAL LOCK SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 min-h-fit">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-unified space-y-6 relative overflow-hidden bg-zinc-950"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-accent-purple border border-purple-500/20">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Developer Portal Lock</h2>
              <p className="text-sm text-zinc-500 mt-1">Authenticate administrative credentials to view</p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-semibold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">Master Username</label>
              <input
                type="text"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="admin"
                className="input-unified"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-500 uppercase block pl-1">Master Password</label>
              <input
                type="password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="input-unified"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-unified"
            >
              {loading ? 'Verifying...' : 'Unlock Developer Portal'}
            </button>
          </form>

          <div className="text-center pt-2">
            <a
              href={window.location.hostname.startsWith('master.') ? window.location.protocol + '//' + window.location.host.replace('master.', '') : '/'}
              className="text-xs text-zinc-500 hover:text-white transition-colors cursor-pointer"
            >
              ← Back to main site
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- RENDER DEVELOPER PLAYGROUND ---
  return (
    <div className="py-12 md:py-20 max-w-auto mx-auto px-20 relative flex flex-col md:flex-row gap-8">
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
        <div className="card-unified bg-zinc-950 p-4 space-y-4 border border-white/5">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Globe className="w-6 h-6 text-accent-purple" />
            <div className="text-left">
              <h3 className="font-bold text-white text-sm">Developer API</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest">v1.0.0 Playground</p>
            </div>
          </div>

          <nav className="space-y-1 flex flex-col">
            {API_SECTIONS.map(sec => {
              const isActive = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setActiveSection(sec.id);
                    const el = document.getElementById(sec.id);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer ${
                    isActive 
                      ? 'bg-gradient-to-r from-accent-blue/15 to-accent-purple/15 border border-accent-purple/30 text-white' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-500" />
                    {sec.title}
                  </span>
                  <ChevronRight className="w-3 h-3 text-zinc-500" />
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/5 pt-4 text-left">
            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block pl-1">
              Active Authorization Header
            </label>
            <div className="mt-2 flex gap-1">
              <input
                type="text"
                value={authTokenInput}
                onChange={(e) => setAuthTokenInput(e.target.value)}
                placeholder="Bearer JWT token..."
                className="input-unified py-1.5 px-2.5 text-[10px] font-mono flex-grow border-white/5"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* CORE DOCUMENTATION LIST */}
      <main className="flex-grow space-y-8 text-left">
        {API_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wider">
              {section.title}
            </h2>

            <div className="space-y-4">
              {section.endpoints.map((ep) => {
                const key = `${ep.method}:${ep.path}`;
                const isExpanded = expandedCard === key;
                const tab = codeTabs[key] || 'dart';

                const result = runnerResults[key];
                const isRunning = runnerLoading[key];

                return (
                  <div 
                    key={key} 
                    className={`card-unified border transition-all ${
                      isExpanded ? 'border-white/10 bg-zinc-950' : 'border-white/5 bg-zinc-950/30 hover:border-white/10'
                    }`}
                  >
                    {/* Header trigger */}
                    <div 
                      onClick={() => setExpandedCard(isExpanded ? null : key)}
                      className="p-4 flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 flex-grow truncate mr-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-extrabold font-mono tracking-wider ${
                          ep.method === 'POST' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          ep.method === 'DELETE' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}>
                          {ep.method}
                        </span>
                        <span className="font-mono text-xs font-bold text-white truncate">{ep.path}</span>
                        <span className="hidden sm:inline text-xs text-zinc-500 truncate">— {ep.description}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {ep.requiresAuth && <Shield className="w-3.5 h-3.5 text-accent-purple" title="Requires Token" />}
                        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expandable details & runner */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-white/5 overflow-hidden"
                        >
                          <div className="p-4 space-y-6">
                            {/* Endpoint Description */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Description</span>
                              <p className="text-xs text-zinc-300 leading-relaxed">{ep.description}</p>
                            </div>

                            {/* Request Parameters Table */}
                            {ep.bodyParams && (
                              <div className="space-y-2">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Request Body Parameters</span>
                                <div className="overflow-x-auto rounded-xl border border-white/5 bg-zinc-900/50">
                                  <table className="w-full text-xs text-left">
                                    <thead>
                                      <tr className="bg-zinc-950 text-zinc-500 border-b border-white/5">
                                        <th className="p-2.5 font-bold">Field</th>
                                        <th className="p-2.5 font-bold">Type</th>
                                        <th className="p-2.5 font-bold">Required</th>
                                        <th className="p-2.5 font-bold">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {ep.bodyParams.map(param => (
                                        <tr key={param.name} className="border-b border-white/2 hover:bg-white/2 transition">
                                          <td className="p-2.5 font-mono font-bold text-white">{param.name}</td>
                                          <td className="p-2.5 font-mono text-zinc-400">{param.type}</td>
                                          <td className="p-2.5">
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                              param.required ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-zinc-800 text-zinc-500 border border-white/5'
                                            }`}>
                                              {param.required ? 'REQUIRED' : 'OPTIONAL'}
                                            </span>
                                          </td>
                                          <td className="p-2.5 text-zinc-400">{param.desc}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Mobile Examples Tab Box */}
                            <div className="space-y-2.5">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Integration Snippets</span>
                              
                              <div className="flex gap-1.5 border-b border-white/5 pb-1">
                                <button
                                  onClick={() => setCodeTabs({ ...codeTabs, [key]: 'dart' })}
                                  className={`px-3 py-1 text-xs font-semibold rounded-t-lg border-b-2 cursor-pointer ${
                                    tab === 'dart' ? 'border-accent-purple text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  Dart (Flutter)
                                </button>
                                <button
                                  onClick={() => setCodeTabs({ ...codeTabs, [key]: 'js' })}
                                  className={`px-3 py-1 text-xs font-semibold rounded-t-lg border-b-2 cursor-pointer ${
                                    tab === 'js' ? 'border-accent-purple text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                                  }`}
                                >
                                  JS Fetch
                                </button>
                              </div>

                              <div className="relative group">
                                <pre className="bg-black/90 p-4 rounded-xl font-mono text-[10px] leading-relaxed text-emerald-400 overflow-x-auto border border-white/5">
                                  {tab === 'dart' ? generateDartSnippet(ep) : generateJsSnippet(ep)}
                                </pre>
                                <button
                                  onClick={() => copyToClipboard(tab === 'dart' ? generateDartSnippet(ep) : generateJsSnippet(ep))}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-800 border border-white/10 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs"
                                >
                                  {copiedText === (tab === 'dart' ? generateDartSnippet(ep) : generateJsSnippet(ep)) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            {/* Try It Out Runner */}
                            <div className="space-y-4 border-t border-white/5 pt-4">
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Interactive Request Runner</span>
                              
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Left: Payload input */}
                                <div className="space-y-2 text-left">
                                  <span className="text-[10px] text-zinc-500 font-semibold block">JSON Request Body Payload</span>
                                  {ep.method !== 'GET' ? (
                                    <textarea
                                      value={runnerPayloads[key] !== undefined ? runnerPayloads[key] : JSON.stringify(ep.defaultPayload || {}, null, 2)}
                                      onChange={(e) => handlePayloadChange(key, e.target.value)}
                                      className="textarea-unified font-mono text-[10px] h-36 bg-black"
                                    />
                                  ) : (
                                    <div className="h-36 rounded-xl border border-white/5 bg-zinc-950 flex items-center justify-center text-xs text-zinc-500 font-medium">
                                      GET Requests do not support request bodies.
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleRunRequest(ep)}
                                    disabled={isRunning}
                                    className="w-full btn-primary-unified py-2 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <Play className="w-3.5 h-3.5" />
                                    {isRunning ? 'Sending Request...' : 'Send Live Request'}
                                  </button>
                                </div>

                                {/* Right: Response output */}
                                <div className="space-y-2 text-left">
                                  <span className="text-[10px] text-zinc-500 font-semibold block">Server HTTP Response</span>
                                  <div className="h-[188px] bg-black rounded-xl border border-white/5 p-3 overflow-y-auto font-mono text-[10px] leading-relaxed text-zinc-300">
                                    {result ? (
                                      <div className="space-y-2">
                                        <div className="flex justify-between border-b border-white/5 pb-1 text-[9px] text-zinc-500">
                                          <span>Status: <b className={result.status < 400 ? 'text-emerald-400' : 'text-red-400'}>{result.status} {result.statusText}</b></span>
                                          <span>Time: <b>{result.durationMs}ms</b></span>
                                        </div>
                                        <pre className="text-zinc-200">
                                          {typeof result.body === 'object' ? JSON.stringify(result.body, null, 2) : result.body}
                                        </pre>
                                      </div>
                                    ) : (
                                      <div className="h-full flex items-center justify-center text-xs text-zinc-500 font-medium">
                                        {isRunning ? 'Waiting for response...' : 'Run request to inspect live server response.'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
