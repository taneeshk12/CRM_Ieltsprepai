import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { username, current_password, new_password } = await request.json()

    if (!username || !current_password || !new_password) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Fetch admin user
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', username)
      .single()

    if (fetchError || !adminUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(current_password, adminUser.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Hash new password
    const saltRounds = 10
    const new_password_hash = await bcrypt.hash(new_password, saltRounds)

    // Update password
    const { error: updateError } = await supabase
      .from('admin_users')
      .update({ 
        password_hash: new_password_hash,
        updated_at: new Date().toISOString()
      })
      .eq('id', adminUser.id)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    })

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    )
  }
}
