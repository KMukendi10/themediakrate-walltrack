
'use client'

import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { login } from './actions'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    await login(formData)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111111] px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E7FF3C] text-2xl font-black text-black">
            MK
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white">
            MEDIA KRATE
          </h1>

          <p className="mt-2 text-sm tracking-[0.25em] text-[#E7FF3C]">
            WALLTRACK
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1B1B1B] p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white">
            Welcome back
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Sign in to access your wall management workspace.
          </p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-300">
                Work email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@mediakrate.co.za"
                className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-[#E7FF3C]"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter your password"
                className="w-full rounded-lg border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-[#E7FF3C]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#E7FF3C] py-3 font-bold text-black transition hover:bg-[#d6ed28] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-gray-500">
            Internal workspace · Authorised employees only
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-600">
          © 2026 The Media Krate. All rights reserved.
        </p>
      </div>
    </main>
  )
}
