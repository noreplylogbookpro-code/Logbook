import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Server, Terminal, Play, Lock, Code, ChevronRight,
  ChevronDown, BookOpen, AlertCircle, Check, Copy, ArrowLeft,
  Settings, User, Key, Globe, Menu, X, Sun, Moon, LogOut,
  Users, CreditCard, ScrollText
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
          { name: 'username', type: 'string', required: true, desc: 'Unique account username / handle.' },
          { name: 'email', type: 'string', required: true, desc: 'Valid user email address.' },
          { name: 'password', type: 'string', required: true, desc: 'Secure password (minimum 8 characters).' },
          { name: 'securityQuestion', type: 'string', required: false, desc: 'Security question (e.g., "What was the name of your first pet?").' },
          { name: 'securityAnswer', type: 'string', required: false, desc: 'Answer to chosen security question.' },
        ],
        defaultPayload: {
          username: 'dev_user',
          email: 'developer@example.com',
          password: 'supersecurepassword123',
          securityQuestion: 'What was the name of your first pet?',
          securityAnswer: 'Fluffy'
        },
        responses: [
          { code: 201, msg: 'Account registered successfully. Returns JWT token.' },
          { code: 400, msg: 'Missing required fields, short password, or user already exists.' }
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

export default function DevPortalView({ onNavigate, theme, toggleTheme }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleToggleTheme = () => {
    if (typeof toggleTheme === 'function') {
      toggleTheme();
    } else {
      const root = document.documentElement;
      const isDark = root.classList.contains('dark');
      if (isDark) {
        root.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      } else {
        root.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('masterToken');
    setIsAuthenticated(false);
  };

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

  const generateKotlinSnippet = (endpoint) => {
    const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE';
    return `// Kotlin Multiplatform (Ktor Client)
import io.ktor.client.*
import io.ktor.client.engine.cio.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*

val client = HttpClient(CIO)

suspend fun makeApiRequest(): HttpResponse {
    return client.request("https://api.logbookplus.co.in${endpoint.path}") {
        method = HttpMethod.parse("${endpoint.method}")
        contentType(ContentType.Application.Json)
        ${endpoint.requiresAuth ? 'bearerAuth("YOUR_JWT_ACCESS_TOKEN")\n        ' : ''}${hasBody ? `setBody("""\n${JSON.stringify(endpoint.defaultPayload || {}, null, 4)}\n        """)` : ''}
    }
}`;
  };

  const generateJavaSnippet = (endpoint) => {
    const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE';
    return `// Java 11+ (java.net.http.HttpClient)
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class LogbookApiClient {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create("https://api.logbookplus.co.in${endpoint.path}"))
            .header("Content-Type", "application/json")${endpoint.requiresAuth ? '\n            .header("Authorization", "Bearer YOUR_JWT_ACCESS_TOKEN")' : ''};

        ${endpoint.method === 'GET'
          ? 'HttpRequest request = builder.GET().build();'
          : endpoint.method === 'DELETE'
          ? 'HttpRequest request = builder.DELETE().build();'
          : `String jsonPayload = """\n${JSON.stringify(endpoint.defaultPayload || {}, null, 4)}\n""";\n        HttpRequest request = builder.method("${endpoint.method}", HttpRequest.BodyPublishers.ofString(jsonPayload)).build();`
        }

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("Status: " + response.statusCode());
        System.out.println("Body: " + response.body());
    }
}`;
  };

  const generateSwiftSnippet = (endpoint) => {
    const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE';
    return `// Swift 5.5+ (URLSession async/await)
import Foundation

func executeLogbookRequest() async throws -> String {
    guard let url = URL(string: "https://api.logbookplus.co.in${endpoint.path}") else {
        throw URLError(.badURL)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "${endpoint.method}"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    ${endpoint.requiresAuth ? 'request.setValue("Bearer YOUR_JWT_ACCESS_TOKEN", forHTTPHeaderField: "Authorization")\n    ' : ''}${hasBody ? `let jsonString = """\n${JSON.stringify(endpoint.defaultPayload || {}, null, 4)}\n"""\n    request.httpBody = jsonString.data(using: .utf8)\n    ` : ''}
    let (data, response) = try await URLSession.shared.data(for: request)
    return String(decoding: data, as: UTF8.self)
}`;
  };

  const generateDartSnippet = (endpoint) => {
    const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE';
    return `// Flutter / Dart (http package)
import 'dart:convert';
import 'package:http/http.dart' as http;

Future<void> runRequest() async {
  final res = await http.${endpoint.method.toLowerCase()}(
    Uri.parse('https://api.logbookplus.co.in${endpoint.path}'),
    headers: {
      'Content-Type': 'application/json',
      ${endpoint.requiresAuth ? "'Authorization': 'Bearer YOUR_JWT_ACCESS_TOKEN'," : ''}
    },
    ${hasBody ? `body: jsonEncode(${JSON.stringify(endpoint.defaultPayload || {})}),` : ''}
  );
  print('Status: \${res.statusCode}');
  print('Body: \${res.body}');
}`;
  };

  const generateJsSnippet = (endpoint) => {
    const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE';
    return `// JavaScript / TypeScript Fetch API
const res = await fetch('${endpoint.path}', {
  method: '${endpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    ${endpoint.requiresAuth ? "'Authorization': 'Bearer ' + token," : ''}
  },
  ${hasBody ? `body: JSON.stringify(${JSON.stringify(endpoint.defaultPayload || {})}),` : ''}
});
const data = await res.json();
console.log(res.status, data);`;
  };

  const generateCurlSnippet = (endpoint) => {
    const hasBody = endpoint.method !== 'GET' && endpoint.method !== 'DELETE';
    return `# cURL CLI
curl -X ${endpoint.method} "https://api.logbookplus.co.in${endpoint.path}" \\
  -H "Content-Type: application/json" ${endpoint.requiresAuth ? '\\\n  -H "Authorization: Bearer YOUR_JWT_ACCESS_TOKEN" ' : ''}${hasBody ? `\\\n  -d '${JSON.stringify(endpoint.defaultPayload || {})}'` : ''}`;
  };

  const generateSnippetForLang = (lang, endpoint) => {
    switch (lang) {
      case 'kotlin':
        return generateKotlinSnippet(endpoint);
      case 'java':
        return generateJavaSnippet(endpoint);
      case 'swift':
        return generateSwiftSnippet(endpoint);
      case 'dart':
        return generateDartSnippet(endpoint);
      case 'js':
        return generateJsSnippet(endpoint);
      case 'curl':
        return generateCurlSnippet(endpoint);
      default:
        return generateKotlinSnippet(endpoint);
    }
  };

  // --- RENDER PORTAL LOCK SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="py-24 max-w-md mx-auto px-4 min-h-fit">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-unified space-y-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/5 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col items-center text-center space-y-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-accent-purple border border-purple-500/20">
              <Lock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight">Developer Portal Lock</h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Authenticate administrative credentials to view</p>
            </div>
          </div>

          {authError && (
            <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 dark:text-red-400 text-sm font-semibold text-center">
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase block pl-1">Master Username</label>
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
              <label className="text-sm font-bold text-zinc-600 dark:text-zinc-400 uppercase block pl-1">Master Password</label>
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
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
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
    <div className="py-6 md:py-12 lg:py-20 w-full max-w-[95%] xl:max-w-[1600px] 2xl:max-w-[1800px] mx-auto px-4 md:px-8 lg:px-12 relative flex flex-col md:flex-row gap-6 md:gap-8">
      {/* MOBILE HEADER (TOP BAR) */}
      <div className="flex md:hidden items-center justify-between p-4 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 rounded-2xl w-full">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-accent-purple" />
          <div className="text-left">
            <h3 className="font-bold text-zinc-800 dark:text-white text-md">Master Control</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Admin • Dev Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleTheme}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
            title="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5 text-amber-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5 transition-all cursor-pointer"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Drawer Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-white/10 p-6 z-50 flex flex-col justify-between shadow-[10px_0_40px_rgba(0,0,0,0.08)] dark:shadow-[10px_0_40px_rgba(0,0,0,0.5)] overflow-y-auto"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Shield className="w-6 h-6 text-accent-purple" />
                    <div className="text-left">
                      <h3 className="font-bold text-zinc-800 dark:text-white text-lg">Master Control</h3>
                      <p className="text-[13px] text-zinc-500 uppercase tracking-widest">Administrator</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-1.5 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="space-y-1.5 flex flex-col">
                  {[
                    { name: 'Overview', icon: Server },
                    { name: 'Users', icon: Users },
                    { name: 'Licenses', icon: Key },
                    { name: 'Subscriptions', icon: CreditCard },
                    { name: 'Blogs', icon: BookOpen },
                    { name: 'Changelogs', icon: ScrollText },
                    { name: 'Logs', icon: Terminal },
                    { name: 'Settings', icon: Settings },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.name}
                        onClick={() => {
                          sessionStorage.setItem('masterTab', tab.name);
                          onNavigate('/');
                          setSidebarOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer text-zinc-650 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
                      >
                        <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                        {tab.name}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer bg-gradient-to-r from-accent-blue/15 to-accent-purple/15 border border-accent-purple/30 text-zinc-900 dark:text-white"
                  >
                    <Code className="w-4 h-4 text-accent-purple" />
                    Dev Portal
                  </button>
                </nav>

                {/* API Sections Quick Jump */}
                <div className="border-t border-zinc-200 dark:border-white/5 pt-4 space-y-2">
                  <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider px-1">API Sections</p>
                  {API_SECTIONS.map(sec => (
                    <button
                      key={sec.id}
                      onClick={() => {
                        setActiveSection(sec.id);
                        setSidebarOpen(false);
                        const el = document.getElementById(sec.id);
                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${activeSection === sec.id
                        ? 'bg-zinc-100 dark:bg-white/10 text-accent-purple font-semibold'
                        : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                        }`}
                    >
                      <span>{sec.title}</span>
                      <ChevronRight className="w-3 h-3 text-zinc-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-white/5 pt-4 mt-6">
                <button
                  onClick={() => {
                    handleLogout();
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION - DESKTOP */}
      <aside className="hidden md:block w-64 flex-shrink-0 space-y-6">
        <div className="card-unified bg-white dark:bg-zinc-950 p-4 space-y-4 border border-zinc-200 dark:border-white/5">
          <div className="flex items-center gap-3 border-b border-zinc-200 dark:border-white/5 pb-4">
            <Shield className="w-6 h-6 text-accent-purple" />
            <div className="text-left">
              <h3 className="font-bold text-zinc-800 dark:text-white text-lg">Master Control</h3>
              <p className="text-[13px] text-zinc-500 uppercase tracking-widest">Administrator</p>
            </div>
          </div>

          <nav className="space-y-1 flex flex-col">
            {[
              { name: 'Overview', icon: Server },
              { name: 'Users', icon: Users },
              { name: 'Licenses', icon: Key },
              { name: 'Subscriptions', icon: CreditCard },
              { name: 'Blogs', icon: BookOpen },
              { name: 'Changelogs', icon: ScrollText },
              { name: 'Logs', icon: Terminal },
              { name: 'Settings', icon: Settings },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.name}
                  onClick={() => {
                    sessionStorage.setItem('masterTab', tab.name);
                    onNavigate('/');
                  }}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer hover:scale-[1.02] text-zinc-650 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 border border-transparent"
                >
                  <Icon className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  {tab.name}
                </button>
              );
            })}
            <button
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer bg-gradient-to-r from-accent-blue/15 to-accent-purple/15 border border-accent-purple/30 text-zinc-900 dark:text-white"
            >
              <Code className="w-4 h-4 text-accent-purple" />
              Dev Portal
            </button>
          </nav>

          {/* Section shortcuts */}
          <div className="border-t border-zinc-200 dark:border-white/5 pt-4">
            <label className="text-[12px] font-bold text-zinc-500 uppercase tracking-wider block pl-1 mb-2">
              API Sections
            </label>
            <div className="space-y-1">
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
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-semibold transition-all text-left cursor-pointer ${isActive
                      ? 'bg-zinc-100 dark:bg-white/10 text-accent-purple font-bold'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5'
                      }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{sec.title}</span>
                    </span>
                    <ChevronRight className="w-3 h-3 flex-shrink-0 text-zinc-400" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Authorization Header Input */}
          <div className="border-t border-zinc-200 dark:border-white/5 pt-4 text-left">
            <label className="text-[12px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider block pl-1">
              Active Authorization Header
            </label>
            <div className="mt-2 flex gap-1">
              <input
                type="text"
                value={authTokenInput}
                onChange={(e) => setAuthTokenInput(e.target.value)}
                placeholder="Bearer JWT token..."
                className="input-unified py-1.5 px-2.5 text-[12px] font-mono flex-grow border-zinc-200 dark:border-white/5"
              />
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-white/5 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* CORE DOCUMENTATION LIST */}
      <main className="flex-grow space-y-8 min-w-0 w-full text-left">
        {API_SECTIONS.map((section) => (
          <section key={section.id} id={section.id} className="space-y-5">
            <h2 className="text-xl md:text-2xl font-extrabold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-white/10 pb-3 uppercase tracking-wider flex items-center gap-2.5">
              <span className="w-2 h-6 bg-gradient-to-b from-accent-blue to-accent-purple rounded-full inline-block"></span>
              {section.title}
            </h2>

            <div className="space-y-4">
              {section.endpoints.map((ep) => {
                const key = `${ep.method}:${ep.path}`;
                const isExpanded = expandedCard === key;
                const tab = codeTabs[key] || 'kotlin';

                const result = runnerResults[key];
                const isRunning = runnerLoading[key];

                return (
                  <div
                    key={key}
                    className={`card-unified border transition-all w-full ${isExpanded
                      ? 'border-zinc-300 dark:border-white/15 shadow-md bg-white/90 dark:bg-zinc-950'
                      : 'border-zinc-200/90 dark:border-white/5 hover:border-zinc-300 dark:hover:border-white/15 bg-white/60 dark:bg-zinc-950/40'
                      }`}
                  >
                    {/* Header trigger */}
                    <div
                      onClick={() => setExpandedCard(isExpanded ? null : key)}
                      className="p-4 md:p-5 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3 md:gap-4 flex-grow truncate mr-3">
                        <span className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-black font-mono tracking-wider shadow-sm ${ep.method === 'POST' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' :
                          ep.method === 'DELETE' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/25' :
                            'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25'
                          }`}>
                          {ep.method}
                        </span>
                        <span className="font-mono text-sm md:text-base font-bold text-zinc-900 dark:text-white tracking-tight truncate">{ep.path}</span>
                        <span className="hidden sm:inline text-xs md:text-sm text-zinc-500 dark:text-zinc-400 truncate">— {ep.description}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {ep.requiresAuth && <Shield className="w-4 h-4 md:w-5 md:h-5 text-accent-purple flex-shrink-0" title="Requires Token" />}
                        <ChevronDown className={`w-5 h-5 text-zinc-400 dark:text-zinc-500 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {/* Expandable details & runner */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-zinc-200 dark:border-white/10 overflow-hidden"
                        >
                          <div className="p-4 md:p-6 space-y-7">
                            {/* Endpoint Description */}
                            <div className="space-y-2">
                              <span className="text-xs md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Description</span>
                              <p className="text-sm md:text-base text-zinc-700 dark:text-zinc-300 leading-relaxed font-normal">{ep.description}</p>
                            </div>

                            {/* Request Parameters Table */}
                            {ep.bodyParams && (
                              <div className="space-y-3">
                                <span className="text-xs md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Request Body Parameters</span>
                                <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/50 shadow-inner">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="bg-zinc-100/90 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 text-xs md:text-sm">
                                        <th className="p-3 md:p-3.5 font-bold">Field</th>
                                        <th className="p-3 md:p-3.5 font-bold">Type</th>
                                        <th className="p-3 md:p-3.5 font-bold">Required</th>
                                        <th className="p-3 md:p-3.5 font-bold">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody className="text-xs md:text-sm divide-y divide-zinc-200/60 dark:divide-white/5">
                                      {ep.bodyParams.map(param => (
                                        <tr key={param.name} className="hover:bg-zinc-100/50 dark:hover:bg-white/5 transition">
                                          <td className="p-3 md:p-3.5 font-mono font-bold text-zinc-900 dark:text-white text-xs md:text-sm">{param.name}</td>
                                          <td className="p-3 md:p-3.5 font-mono text-zinc-600 dark:text-zinc-400 text-xs md:text-sm">{param.type}</td>
                                          <td className="p-3 md:p-3.5">
                                            <span className={`px-2 py-0.5 md:py-1 rounded text-[10px] md:text-xs font-bold inline-block ${param.required ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-white/5'
                                              }`}>
                                              {param.required ? 'REQUIRED' : 'OPTIONAL'}
                                            </span>
                                          </td>
                                          <td className="p-3 md:p-3.5 text-zinc-700 dark:text-zinc-300 leading-normal text-xs md:text-sm">{param.desc}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Multiplatform Examples Tab Box */}
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Integration Snippets</span>
                                <span className="text-[11px] text-zinc-400 font-mono hidden sm:inline">Kotlin (KMP) • Java • Swift • Dart • JS • cURL</span>
                              </div>

                              <div className="flex gap-1.5 md:gap-2 border-b border-zinc-200 dark:border-white/10 pb-1 overflow-x-auto scrollbar-none">
                                {[
                                  { id: 'kotlin', label: 'Kotlin (KMP)' },
                                  { id: 'java', label: 'Java' },
                                  { id: 'swift', label: 'Swift' },
                                  { id: 'dart', label: 'Dart (Flutter)' },
                                  { id: 'js', label: 'JavaScript' },
                                  { id: 'curl', label: 'cURL' }
                                ].map(langTab => (
                                  <button
                                    key={langTab.id}
                                    onClick={() => setCodeTabs({ ...codeTabs, [key]: langTab.id })}
                                    className={`px-3.5 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-bold rounded-t-lg border-b-2 whitespace-nowrap cursor-pointer transition-colors ${
                                      tab === langTab.id 
                                        ? 'border-accent-purple text-zinc-900 dark:text-white bg-zinc-100/50 dark:bg-white/5' 
                                        : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
                                    }`}
                                  >
                                    {langTab.label}
                                  </button>
                                ))}
                              </div>

                              <div className="relative group">
                                <pre className="bg-zinc-900 dark:bg-black/90 p-4 md:p-5 rounded-xl font-mono text-xs md:text-sm leading-relaxed text-emerald-400 overflow-x-auto border border-zinc-800 dark:border-white/10 shadow-inner">
                                  {generateSnippetForLang(tab, ep)}
                                </pre>
                                <button
                                  onClick={() => copyToClipboard(generateSnippetForLang(tab, ep))}
                                  className="absolute top-3 right-3 p-2 rounded-lg bg-zinc-800 border border-white/10 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer text-xs md:text-sm flex items-center gap-1.5"
                                  title="Copy snippet"
                                >
                                  {copiedText === generateSnippetForLang(tab, ep) ? (
                                    <>
                                      <Check className="w-4 h-4 text-emerald-400" />
                                      <span className="text-emerald-400 font-bold text-xs">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-4 h-4" />
                                      <span className="font-semibold text-xs">Copy</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Try It Out Runner */}
                            <div className="space-y-5 border-t border-zinc-200 dark:border-white/10 pt-5">
                              <span className="text-xs md:text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Interactive Request Runner</span>

                              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                                {/* Left: Payload input */}
                                <div className="space-y-2.5 text-left">
                                  <span className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 font-bold block">JSON Request Body Payload</span>
                                  {ep.method !== 'GET' ? (
                                    <textarea
                                      value={runnerPayloads[key] !== undefined ? runnerPayloads[key] : JSON.stringify(ep.defaultPayload || {}, null, 2)}
                                      onChange={(e) => handlePayloadChange(key, e.target.value)}
                                      className="textarea-unified font-mono text-xs md:text-sm h-48 border border-zinc-200 dark:border-white/10 w-full leading-relaxed p-3.5"
                                      placeholder="{\n  ...\n}"
                                    />
                                  ) : (
                                    <div className="h-48 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-100/60 dark:bg-zinc-950 flex items-center justify-center text-sm md:text-base text-zinc-500 dark:text-zinc-400 font-medium">
                                      GET Requests do not support request bodies.
                                    </div>
                                  )}
                                  <button
                                    onClick={() => handleRunRequest(ep)}
                                    disabled={isRunning}
                                    className="w-full btn-primary-unified py-2.5 md:py-3 text-sm md:text-base font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md"
                                  >
                                    <Play className="w-4 h-4 md:w-5 md:h-5" />
                                    {isRunning ? 'Sending Request...' : 'Send Live Request'}
                                  </button>
                                </div>

                                {/* Right: Response output */}
                                <div className="space-y-2.5 text-left">
                                  <span className="text-xs md:text-sm text-zinc-700 dark:text-zinc-300 font-bold block">Server HTTP Response</span>
                                  <div className="h-[238px] bg-zinc-900 dark:bg-black rounded-xl border border-zinc-800 dark:border-white/10 p-4 overflow-y-auto font-mono text-xs md:text-sm leading-relaxed text-zinc-300 shadow-inner">
                                    {result ? (
                                      <div className="space-y-3">
                                        <div className="flex justify-between border-b border-white/10 pb-2 text-xs md:text-sm text-zinc-400 font-medium">
                                          <span>Status: <b className={`font-bold ${result.status < 400 ? 'text-emerald-400' : 'text-red-400'}`}>{result.status} {result.statusText}</b></span>
                                          <span>Time: <b>{result.durationMs}ms</b></span>
                                        </div>
                                        <pre className="text-zinc-200 whitespace-pre-wrap break-all leading-relaxed">
                                          {typeof result.body === 'object' ? JSON.stringify(result.body, null, 2) : result.body}
                                        </pre>
                                      </div>
                                    ) : (
                                      <div className="h-full flex items-center justify-center text-sm md:text-base text-zinc-500 font-medium text-center px-4">
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
