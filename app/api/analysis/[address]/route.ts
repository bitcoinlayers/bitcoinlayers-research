import { promises as fs } from 'fs';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ address: string }> }
) {
    try {
        const { address } = await params;
        const { searchParams } = new URL(request.url);
        const layer = searchParams.get('layer');
        
        if (!address) {
            return NextResponse.json(
                { error: 'Address parameter is required' },
                { status: 400 }
            );
        }

        // Construct the path to the analysis report
        let reportPath: string;
        if (layer) {
            // Try layer-specific directory first
            const layerSlug = layer.toLowerCase().replace(/[^a-z0-9]/g, '_');
            reportPath = path.join(
                process.cwd(),
                'researchers',
                'token-analyzer',
                'analysis-reports',
                layerSlug,
                `${address.toLowerCase()}.json`
            );
        } else {
            // Fall back to root analysis-reports directory
            reportPath = path.join(
                process.cwd(),
                'researchers',
                'token-analyzer',
                'analysis-reports',
                `${address.toLowerCase()}.json`
            );
        }

        // Check if the file exists
        try {
            await fs.access(reportPath);
        } catch {
            // If layer-specific file doesn't exist, try fallback to root directory
            if (layer) {
                const fallbackPath = path.join(
                    process.cwd(),
                    'researchers',
                    'token-analyzer',
                    'analysis-reports',
                    `${address.toLowerCase()}.json`
                );
                try {
                    await fs.access(fallbackPath);
                    reportPath = fallbackPath;
                } catch {
                    return NextResponse.json(
                        { error: 'Analysis report not found for this address' },
                        { status: 404 }
                    );
                }
            } else {
                return NextResponse.json(
                    { error: 'Analysis report not found for this address' },
                    { status: 404 }
                );
            }
        }

        // Read and parse the JSON file
        const fileContent = await fs.readFile(reportPath, 'utf-8');
        const analysisData = JSON.parse(fileContent);

        return NextResponse.json(analysisData);
    } catch (error) {
        console.error('Error loading analysis report:', error);
        return NextResponse.json(
            { error: 'Internal server error while loading analysis report' },
            { status: 500 }
        );
    }
} 