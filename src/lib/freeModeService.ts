// lib/freeModeService.ts

import { supabase } from './supabase'

interface FreeModeStatusResult {
  success: boolean
  freeMode: boolean
  error: string | null
}

interface SetFreeModeResult {
  success: boolean
  freeMode: boolean | null
  message: string | null
  error: string | null
}

/**
 * Get current free mode status from database
 * @returns {Promise<FreeModeStatusResult>}
 */
export async function getFreeModeStatus(): Promise<FreeModeStatusResult> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'free_mode')
      .single()

    if (error) {
      console.error('Error fetching free mode status:', error)
      throw error
    }

    return {
      success: true,
      freeMode: data?.setting_value || false,
      error: null
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch free mode status'
    return {
      success: false,
      freeMode: false,
      error: errorMessage
    }
  }
}

/**
 * Toggle free mode on/off
 * @param {boolean} enable - true to enable, false to disable
 * @returns {Promise<SetFreeModeResult>}
 */
export async function setFreeMode(enable: boolean): Promise<SetFreeModeResult> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .update({ 
        setting_value: enable,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'free_mode')
      .select()
      .single()

    if (error) {
      console.error('Error setting free mode:', error)
      throw error
    }

    return {
      success: true,
      freeMode: data.setting_value,
      message: `Free mode ${enable ? 'enabled' : 'disabled'} successfully`,
      error: null
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update free mode'
    return {
      success: false,
      freeMode: null,
      message: null,
      error: errorMessage
    }
  }
}
