'use client'

import { useState, useEffect } from 'react'
import { getFreeModeStatus, setFreeMode } from '@/lib/freeModeService'

export default function FreeModeToggle() {
  const [freeMode, setFreeModeState] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch current free mode status
  const fetchStatus = async () => {
    setLoading(true)
    setError(null)
    
    const result = await getFreeModeStatus()
    
    if (result.success) {
      setFreeModeState(result.freeMode)
    } else {
      setError(result.error)
    }
    
    setLoading(false)
  }

  useEffect(() => {
    // Wrap async call to avoid floating promise warning
    void (async () => {
      await fetchStatus()
    })()
  }, [])

  // Handle toggle button click
  const handleToggle = async (enable: boolean) => {
    setProcessing(true)
    setError(null)
    setSuccessMessage(null)

    const result = await setFreeMode(enable)

    if (result.success) {
      setFreeModeState(result.freeMode || false)
      setSuccessMessage(result.message)
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } else {
      setError(result.error)
    }

    setProcessing(false)
  }

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded mb-4"></div>
          <div className="flex gap-4">
            <div className="h-12 bg-gray-200 rounded flex-1"></div>
            <div className="h-12 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
          🎛️ Free Mode Control
        </h2>
        <button
          onClick={fetchStatus}
          disabled={processing}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors self-start sm:self-auto"
          title="Refresh status"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Status Card */}
      <div className={`rounded-lg p-4 sm:p-6 mb-6 transition-all ${
        freeMode 
          ? 'bg-linear-to-r from-green-50 to-emerald-50 border-2 border-green-300' 
          : 'bg-linear-to-r from-gray-50 to-slate-50 border-2 border-gray-300'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-2">Current Status</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl sm:text-4xl">
                {freeMode ? '🟢' : '🔴'}
              </span>
              <span className={`text-2xl sm:text-3xl font-bold ${
                freeMode ? 'text-green-700' : 'text-gray-700'
              }`}>
                {freeMode ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className={`text-sm font-medium ${
              freeMode ? 'text-green-700' : 'text-gray-600'
            }`}>
              {freeMode ? '✅ All tests are FREE' : '💳 Credit-based mode'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {freeMode ? 'No credits deducted' : 'Normal operation'}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✅</span>
            <p className="text-green-700 font-medium">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-red-600 text-xl">⚠️</span>
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Toggle Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {/* Enable Button */}
        <button
          onClick={() => handleToggle(true)}
          disabled={processing || freeMode}
          className={`py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-white transition-all text-sm sm:text-base ${
            freeMode
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {processing && !freeMode ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              <span className="hidden sm:inline">Enabling...</span>
              <span className="sm:hidden">Enabling</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg sm:text-xl">🟢</span>
              <span className="hidden sm:inline">Enable Free Mode</span>
              <span className="sm:hidden">Enable</span>
            </span>
          )}
        </button>

        {/* Disable Button */}
        <button
          onClick={() => handleToggle(false)}
          disabled={processing || !freeMode}
          className={`py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-white transition-all text-sm sm:text-base ${
            !freeMode
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-linear-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {processing && freeMode ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              <span className="hidden sm:inline">Disabling...</span>
              <span className="sm:hidden">Disabling</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span className="text-lg sm:text-xl">🔴</span>
              <span className="hidden sm:inline">Disable Free Mode</span>
              <span className="sm:hidden">Disable</span>
            </span>
          )}
        </button>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <span>ℹ️</span>
          <span>What happens in IELTS app when enabled:</span>
        </h3>
        <ul className="text-sm text-blue-800 space-y-1.5">
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Green banner shows &quot;🎉 FREE MODE ACTIVE&quot; on home page</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Pricing links hidden in navigation menu</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>Credit balance hidden on user dashboard</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>No credits deducted for evaluations</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 font-bold">•</span>
            <span>All users get unlimited free tests</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
