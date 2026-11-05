'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2, Lock, UserRound } from 'lucide-react'

type AccountProfile = {
  full_name: string
  email: string
  role: string
}

export default function AccountSettingsForm({
  profile,
}: {
  profile: AccountProfile
}) {
  const router = useRouter()

  const [fullName, setFullName] = useState(profile.full_name || '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const inputClass =
    'mt-2 w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-gray-600 focus:border-[#E7FF3C]/50'

  const updateProfile = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setError('')

    try {
      const response = await fetch('/api/settings/account', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: fullName,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update account.')
      }

      setMessage('Your account details have been updated.')
      router.refresh()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong.'
      )
    } finally {
      setSaving(false)
    }
  }

  const updatePassword = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setChangingPassword(true)
    setPasswordMessage('')
    setPasswordError('')

    if (password.length < 8) {
      setPasswordError('Your password must contain at least 8 characters.')
      setChangingPassword(false)
      return
    }

    if (password !== confirmPassword) {
      setPasswordError('The passwords do not match.')
      setChangingPassword(false)
      return
    }

    try {
      const response = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to change password.')
      }

      setPassword('')
      setConfirmPassword('')
      setPasswordMessage('Your password has been changed successfully.')
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Something went wrong.'
      )
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={updateProfile}>
        <section className="rounded-2xl border border-white/10 bg-[#181818] p-6">
          <div className="mb-6 flex items-center gap-3">
            <UserRound className="text-[#E7FF3C]" size={22} />
            <div>
              <h2 className="font-semibold">Personal Information</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account details.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Full Name
              </label>
              <input
                required
                maxLength={150}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={inputClass}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className={`${inputClass} cursor-not-allowed text-gray-500`}
              />
              <p className="mt-2 text-xs text-gray-500">
                Your login email is managed through Employee Management.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Account Role
              </label>
              <input
                value={profile.role === 'admin' ? 'Administrator' : 'Employee'}
                readOnly
                className={`${inputClass} cursor-not-allowed text-gray-500`}
              />
            </div>
          </div>

          {message && (
            <p className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E7FF3C] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#d5ed32] disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </section>
      </form>

      <form onSubmit={updatePassword}>
        <section className="rounded-2xl border border-white/10 bg-[#181818] p-6">
          <div className="mb-6 flex items-center gap-3">
            <Lock className="text-[#E7FF3C]" size={22} />
            <div>
              <h2 className="font-semibold">Change Password</h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose a new password for your account.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="Enter your new password"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                placeholder="Confirm your new password"
              />
            </div>
          </div>

          {passwordMessage && (
            <p className="mt-5 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400">
              {passwordMessage}
            </p>
          )}

          {passwordError && (
            <p className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
              {passwordError}
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
    </div>
  )
}
