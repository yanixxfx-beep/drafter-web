'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useEffect } from 'react'

export default function TestSignIn() {
  const { data: session, status } = useSession()

  useEffect(() => {
    console.log('Session status:', status)
    console.log('Session data:', session)
  }, [session, status])

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (session) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Signed In</h1>
        <p>Email: {session.user?.email}</p>
        <p>Access Token: {session.accessToken ? 'Present' : 'Missing'}</p>
        <p>Refresh Token: {session.refreshToken ? 'Present' : 'Missing'}</p>
        <button
          onClick={() => signOut()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
        >
          Sign Out
        </button>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Not Signed In</h1>
      <button
        onClick={() => signIn('google')}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Sign In with Google
      </button>
    </div>
  )
}
