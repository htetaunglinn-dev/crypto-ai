import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/connection';
import { User } from '@/lib/db/models';
import type { ApiResponse } from '@/types';

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id).select('+anthropicApiKey');

    if (!user) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'User not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json<ApiResponse<{ hasKey: boolean; keyPreview?: string }>>({
      success: true,
      data: {
        hasKey: !!user.anthropicApiKey,
        keyPreview: user.anthropicApiKey
          ? `sk-...${user.anthropicApiKey.slice(-4)}`
          : undefined,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/user/api-key:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Failed to fetch API key status',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    const { apiKey } = await request.json();

    if (!apiKey || !apiKey.startsWith('sk-')) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Invalid API key format',
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    await User.findByIdAndUpdate(session.user.id, {
      anthropicApiKey: apiKey,
    });

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: 'API key updated successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/user/api-key:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Failed to update API key',
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json<ApiResponse<null>>(
        {
          success: false,
          error: 'Unauthorized',
        },
        { status: 401 }
      );
    }

    await connectToDatabase();

    await User.findByIdAndUpdate(session.user.id, {
      $unset: { anthropicApiKey: 1 },
    });

    return NextResponse.json<ApiResponse<null>>({
      success: true,
      message: 'API key removed successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/user/api-key:', error);
    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error: 'Failed to remove API key',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
