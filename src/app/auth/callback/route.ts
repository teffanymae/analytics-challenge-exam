import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=invalid_code', url.origin));
  }

  const supabase = await createClient();

  try {
    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error('exchangeCodeForSession error:', exchangeError);
      return NextResponse.redirect(new URL('/auth/login?error=verification_failed', url.origin));
    }

    // Get the authenticated user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      console.error('getUser error after code exchange:', userErr);
      return NextResponse.redirect(new URL('/auth/login?error=user_not_found', url.origin));
    }

    // Activate pending invitations for this user's email
    if (user.email) {
      try {
        const adminClient = createAdminClient();
        
        // Run the SQL update to activate pending invitations
        const { error: updateError } = await adminClient
          .from('team_members')
          .update({
            member_user_id: user.id,
            invited_email: null,
            status: 'active',
          })
          .eq('invited_email', user.email)
          .is('member_user_id', null);

        if (updateError) {
          console.error('Error activating pending invitations:', updateError);
        }
      } catch (cbErr) {
        console.error('Post-confirm callback error:', cbErr);
      }
    }

    // Redirect to the next page
    const redirectUrl = new URL(next, url.origin);
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('Unexpected error confirming token:', err);
    return NextResponse.redirect(new URL('/auth/login?error=unexpected_error', url.origin));
  }
}
