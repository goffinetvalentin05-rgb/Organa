import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // Si Supabase n'est pas configuré, on laisse passer (pour le développement)
    // mais on log un avertissement
    console.warn('⚠️ Supabase non configuré - le middleware de protection est désactivé')
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.warn("[AUTH][middleware] Erreur lors de la récupération du user", {
      error,
      path: request.nextUrl.pathname,
    })
  }

  console.log("[AUTH][middleware] État de la session", {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    path: request.nextUrl.pathname,
  })

  // Ignorer les routes API - elles gèrent leur propre authentification
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // Routes protégées
  if (
    !user &&
    request.nextUrl.pathname.startsWith('/tableau-de-bord')
  ) {
    // Pas d'utilisateur, rediriger vers la page de connexion
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    return NextResponse.redirect(url)
  }

  // Si l'utilisateur est connecté et essaie d'accéder à connexion/inscription, rediriger vers le tableau de bord
  if (
    user &&
    (request.nextUrl.pathname === '/connexion' || request.nextUrl.pathname === '/inscription')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/tableau-de-bord'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object instead of the supabaseResponse object

  return supabaseResponse
}

