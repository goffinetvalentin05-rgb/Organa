import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )

          response = NextResponse.next({
            request,
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // API toujours libre
  if (path.startsWith('/api')) {
    return response
  }

  // PROTÉGER LE DASHBOARD
  if (!user && path.startsWith('/tableau-de-bord')) {
    const url = request.nextUrl.clone()
    url.pathname = '/connexion'
    return NextResponse.redirect(url)
  }

  // ÉVITER CONNEXION / INSCRIPTION SI DÉJÀ CONNECTÉ
  if (
    user &&
    (path === '/connexion' || path === '/inscription')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/tableau-de-bord'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/tableau-de-bord/:path*',
    '/connexion',
    '/inscription',
  ],
}


