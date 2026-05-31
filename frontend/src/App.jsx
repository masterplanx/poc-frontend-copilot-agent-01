import { useEffect, useMemo, useState } from 'react'
import './App.css'

const SESSION_KEY = 'frontend-session'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
const DEMO_CREDENTIALS = {
  username: 'admin',
  password: 'admin123',
}

function readSession() {
  const storedSession = sessionStorage.getItem(SESSION_KEY)

  if (!storedSession) {
    return null
  }

  try {
    return JSON.parse(storedSession)
  } catch {
    sessionStorage.removeItem(SESSION_KEY)
    return null
  }
}

function normalizeUsername(username) {
  return String(username ?? '').trim().replace(/[<>]/g, '').slice(0, 64)
}

function writeSession(payload, username) {
  const session = {
    token: payload.access_token,
    tokenType: payload.token_type,
    expiresIn: payload.expires_in,
    username: normalizeUsername(username),
    createdAt: new Date().toISOString(),
  }

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  return session
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY)
}

function getInitialPath() {
  return window.location.pathname || '/'
}

function getPreviewToken(token) {
  if (!token) {
    return 'No token'
  }

  if (token.length <= 20) {
    return token
  }

  return `${token.slice(0, 12)}…${token.slice(-8)}`
}

function App() {
  const [path, setPath] = useState(getInitialPath)
  const [session, setSession] = useState(readSession)
  const [formData, setFormData] = useState(DEMO_CREDENTIALS)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handlePopState = () => {
      setPath(getInitialPath())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    const isKnownRoute = path === '/login' || path === '/welcome'

    if (!isKnownRoute) {
      navigateTo(session ? '/welcome' : '/login', true)
      return
    }

    if (!session && path === '/welcome') {
      navigateTo('/login', true)
      return
    }

    if (session && path === '/login') {
      navigateTo('/welcome', true)
    }
  }, [path, session])

  const welcomeMessage = useMemo(() => {
    if (!session) {
      return ''
    }

    return `Bienvenido, ${session.username}. Tu sesión está activa en este navegador.`
  }, [session])

  function navigateTo(nextPath, replace = false) {
    const currentPath = window.location.pathname || '/'

    if (currentPath === nextPath) {
      setPath(nextPath)
      return
    }

    if (replace) {
      window.history.replaceState({}, '', nextPath)
    } else {
      window.history.pushState({}, '', nextPath)
    }

    setPath(nextPath)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch(`${API_BASE_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(payload?.detail ?? 'No fue posible iniciar sesión.')
        return
      }

      const nextSession = writeSession(payload, formData.username)
      setSession(nextSession)
      navigateTo('/welcome')
    } catch {
      setErrorMessage(
        'No se pudo conectar con el backend. Verifica que la API esté disponible en la URL configurada.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleLogout() {
    clearSession()
    setSession(null)
    setFormData(DEMO_CREDENTIALS)
    setErrorMessage('')
    navigateTo('/login', true)
  }

  return (
    <div className="page-shell">
      <header className="top-nav">
        <a className="brand" href={session ? '/welcome' : '/login'}>
          Stay Portal
        </a>
        <nav className="product-tabs" aria-label="Primary">
          <span className="product-tab product-tab-active">Homes</span>
          <span className="product-tab">Experiences</span>
          <span className="product-tab">Services</span>
        </nav>
        <div className="nav-actions">
          <span className="nav-link">Español (CL)</span>
          {session ? (
            <button type="button" className="secondary-button" onClick={handleLogout}>
              Cerrar sesión
            </button>
          ) : (
            <span className="account-pill">Acceso seguro</span>
          )}
        </div>
      </header>

      <main className="content">
        <section className="hero-copy">
          <span className="eyebrow">Portal autenticado</span>
          <h1>Accede con el backend y entra solo si tu sesión es válida.</h1>
          <p>
            Esta interfaz React consume <code>POST /token</code>, guarda el access token en
            <code> sessionStorage </code> y protege la página de bienvenida.
          </p>
        </section>

        {path === '/welcome' && session ? (
          <section className="card-grid">
            <article className="panel welcome-panel">
              <span className="badge">Sesión activa</span>
              <h2>Bienvenido</h2>
              <p>{welcomeMessage}</p>

              <dl className="session-meta">
                <div>
                  <dt>Usuario</dt>
                  <dd>{session.username}</dd>
                </div>
                <div>
                  <dt>Tipo</dt>
                  <dd>{session.tokenType}</dd>
                </div>
                <div>
                  <dt>Expira en</dt>
                  <dd>{session.expiresIn} segundos</dd>
                </div>
              </dl>

              <div className="token-card">
                <span className="token-label">Token en sesión</span>
                <strong>{getPreviewToken(session.token)}</strong>
              </div>
            </article>

            <aside className="panel side-panel">
              <h2>Guard de navegación</h2>
              <ul className="feature-list">
                <li>Si no hay token en sesión, la ruta /welcome redirige a /login.</li>
                <li>La sesión vive solo mientras dura la pestaña o ventana del navegador.</li>
                <li>El cierre de sesión limpia el token y bloquea el acceso protegido.</li>
              </ul>
              <button type="button" className="primary-button" onClick={handleLogout}>
                Salir de la sesión
              </button>
            </aside>
          </section>
        ) : (
          <section className="card-grid">
            <article className="panel login-panel">
              <div className="search-pill" aria-hidden="true">
                <span>
                  <strong>Where</strong>
                  <small>Backend login</small>
                </span>
                <span>
                  <strong>When</strong>
                  <small>Ahora</small>
                </span>
                <span className="search-pill-action">→</span>
              </div>

              <h2>Iniciar sesión</h2>
              <p>
                Usa el servicio del backend para autenticarte y continuar hacia la vista protegida.
              </p>

              <form className="login-form" onSubmit={handleSubmit}>
                <label className="field">
                  <span>Usuario</span>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        username: event.target.value,
                      }))
                    }
                    autoComplete="username"
                    required
                  />
                </label>

                <label className="field">
                  <span>Contraseña</span>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={(event) =>
                      setFormData((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    autoComplete="current-password"
                    required
                  />
                </label>

                {errorMessage ? (
                  <p className="error-message" role="alert">
                    {errorMessage}
                  </p>
                ) : null}

                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? 'Conectando...' : 'Continuar'}
                </button>
              </form>
            </article>

            <aside className="panel side-panel">
              <span className="badge">Demo backend</span>
              <h2>Credenciales de prueba</h2>
              <ul className="feature-list">
                <li>Usuario: admin</li>
                <li>Contraseña: admin123</li>
                <li>URL por defecto: {API_BASE_URL}</li>
              </ul>
              <p className="helper-copy">
                Puedes cambiar la URL del backend definiendo <code>VITE_API_BASE_URL</code>.
              </p>
            </aside>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
