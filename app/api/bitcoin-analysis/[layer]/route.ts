import { NextRequest, NextResponse } from 'next/server';
import { loadBitcoinTransactionAnalysis } from '@/util/load-analysis-report';

export async function GET(
    request: NextRequest,
    { params }: { params: { layer: string } }
) {
    try {
        const { layer } = params;
        const { searchParams } = new URL(request.url);
        const txid = searchParams.get('txid');

        if (!layer) {
            return NextResponse.json(
                { error: 'Layer name is required' },
                { status: 400 }
            );
        }

        // Load Bitcoin transaction analysis for the layer
        const analysis = await loadBitcoinTransactionAnalysis(layer, txid || undefined);

        if (!analysis) {
            return NextResponse.json(
                { error: 'Bitcoin transaction analysis not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(analysis, {
            headers: {
                'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
            },
        });
    } catch (error) {
        console.error('Error loading Bitcoin transaction analysis:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}