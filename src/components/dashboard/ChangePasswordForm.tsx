'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#E7FF3C]/50'

export default function ChangePasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setChangingPassword(true)
    setMessage('')
    setError('')

    if (password.length < 8) {
      setError('Your password must contain at least 8 characters.')
      setChangingPassword(false)
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      setChangingPassword(false)
      return
    }

    try {
      const response = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password.')
      }

      setPassword('')
      setConfirmPassword('')
      setMessage('Your password has been changed successfully.')
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Something went wrong.'
      )
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <form onSubmit={updatePassword}>
      <section className="rounded-2xl border border-white/10 bg-[#181818] p-6">
        <div className="mb-6 flex items-center gap-3">
          <Lock className="text-[#E7FF3C]" size={22} />
          <div>
            <h2 className="font-semibold">Change Password</h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a new password for your account. Use at least 8 characters.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label
              htmlFor="new-password"
              className="text-sm font-medium text-gray-300"
            >
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass}
              placeholder="Enter your new password"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="text-sm font-medium text-gray-300"
            >
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClass}
              placeholder="Confirm your new password"
            />
          </div>
        </div>

        {message && (
          <p
            role="status"
            className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400"
          >
            {message}
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={changingPassword}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d5ed32] disabled:opacity-60"
          >
            {changingPassword ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Lock size={17} />
            )}
            {changingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </section>
    </form>
  )
}
