import { promises as fs } from 'fs';
import path from 'path';

export interface AnalysisRole {
    address: string;
    category: string;
    type: string;
}

export interface GovernanceDetails {
    address: string;
    type?: string;
    is_gnosis_safe?: boolean;
    governance_details?: {
        multisig_type: string;
        threshold: number;
        total_owners: number;
        owners?: string[];
    };
    is_proxy?: boolean;
    implementation?: string;
    admin?: string;
    roles?: Record<string, AnalysisRole>;
    verified?: boolean;
    network?: string;
    analysis_date?: string;
    function_results?: Record<string, any>;
    discovered_addresses?: string[];
}

export interface WeightedVotingInfo {
    individual_weights: number[];
    total_possible_weight: number;
    threshold_score: number;
    present_weight: number;
    weight_distribution: Array<[string, number]>;
}

export interface SignatureRequirement {
    required_signatures: number;
    total_possible_signers: number;
    signature_type: string;
    present_signatures: number;
    is_fully_signed: boolean;
    threshold_description: string;
    weighted_info?: WeightedVotingInfo;
}

export interface BitcoinTransactionAnalysis {
    txid: string;
    network: string;
    analysis_date: string;
    layer_association?: {
        layer_name: string;
        analysis_type: string;
        integration_target: string;
    };
    transaction_metadata: {
        block_height?: number;
        confirmations: boolean;
        fee: number;
        size: number;
        weight: number;
    };
    signature_analysis: {
        summary: {
            total_signatures_present: number;
            total_signatures_required_to_spend_outputs: number;
            signature_patterns: string[];
            has_multisig: boolean;
            multisig_input_count: number;
            multisig_output_count: number;
        };
        input_analysis: {
            total_inputs: number;
            signature_breakdown: Array<{
                location: string;
                signatures_present: number;
                signature_type: string;
                is_fully_signed: boolean;
            }>;
        };
        output_analysis: {
            total_outputs: number;
            spending_requirements: Array<{
                location: string;
                required_signatures: number;
                total_possible_signers: number;
                signature_type: string;
                threshold_description: string;
            }>;
        };
        threshold_analysis: Array<{
            location: string;
            threshold: string;
            signature_type: string;
        }>;
        signing_complexity: {
            simple_single_sig: number;
            multisig_outputs: number;
            script_hash_outputs: number;
            unknown_outputs: number;
        };
    };
    summary_stats: {
        total_inputs: number;
        total_outputs: number;
        script_types: string[];
        has_segwit: boolean;
        has_multisig: boolean;
        total_value: number;
    };
}

export interface AnalysisReport {
    address: string;
    verified: boolean;
    is_proxy: boolean;
    implementation_address?: string;
    admin_address?: string;
    roles: Record<string, AnalysisRole>;
    governance_analysis?: Record<string, GovernanceDetails>;
}

/**
 * Load Bitcoin transaction analysis for a given transaction ID and layer
 */
export async function loadBitcoinTransactionAnalysis(layerName: string, txid?: string): Promise<BitcoinTransactionAnalysis | null> {
    try {
        // Create layer slug for directory name
        const layerSlug = layerName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        
        const reportsDir = path.join(
            process.cwd(),
            'researchers',
            'token-analyzer',
            'analysis-reports',
            layerSlug
        );
        
        // If txid is provided, try to load specific transaction
        if (txid) {
            const txHash = txid.slice(0, 16); // Use first 16 chars as hash
            const filePath = path.join(reportsDir, `bitcoin_transaction_${txHash}.json`);
            
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const analysis = JSON.parse(fileContent);
            
            return {
                txid: analysis.transaction_metadata.txid,
                network: analysis.transaction_metadata.network,
                analysis_date: analysis.metadata.analysis_date,
                layer_association: analysis.layer_association,
                transaction_metadata: analysis.transaction_metadata,
                signature_analysis: analysis.signature_analysis,
                summary_stats: analysis.summary_stats
            };
        }
        
        // Otherwise, try to find any analysis file for this layer
        const files = await fs.readdir(reportsDir);
        const layerFiles = files.filter(f => 
            f.startsWith('bitcoin_transaction_') && f.endsWith('.json')
        );
        
        if (layerFiles.length > 0) {
            // Load the most recent file (assuming filename sorting)
            const filePath = path.join(reportsDir, layerFiles[layerFiles.length - 1]);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const analysis = JSON.parse(fileContent);
            
            return {
                txid: analysis.transaction_metadata.txid,
                network: analysis.transaction_metadata.network,
                analysis_date: analysis.metadata.analysis_date,
                layer_association: analysis.layer_association,
                transaction_metadata: analysis.transaction_metadata,
                signature_analysis: analysis.signature_analysis,
                summary_stats: analysis.summary_stats
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error loading Bitcoin transaction analysis:', error);
        return null;
    }
}

/**
 * Load analysis report for a given contract address
 */
export async function loadAnalysisReport(contractAddress: string): Promise<AnalysisReport | null> {
    try {
        const reportPath = path.join(
            process.cwd(), 
            'tools', 
            'token-analyzer', 
            'analysis-reports', 
            `${contractAddress.toLowerCase()}.md`
        );
        
        // Check if the file exists
        try {
            await fs.access(reportPath);
        } catch {
            return null; // File doesn't exist
        }

        // For now, we'll return a placeholder since we need to parse markdown
        // In a real implementation, you might want to store analysis as JSON
        // or parse the markdown file
        return null;
    } catch (error) {
        console.error('Error loading analysis report:', error);
        return null;
    }
}

/**
 * Load analysis report from JSON format (if we create JSON exports)
 */
export async function loadAnalysisReportFromJSON(contractAddress: string): Promise<AnalysisReport | null> {
    try {
        const reportPath = path.join(
            process.cwd(), 
            'tools', 
            'token-analyzer', 
            'analysis-reports', 
            `${contractAddress.toLowerCase()}.json`
        );
        
        const fileContent = await fs.readFile(reportPath, 'utf-8');
        const analysis = JSON.parse(fileContent) as AnalysisReport;
        
        return analysis;
    } catch (error) {
        console.error('Error loading JSON analysis report:', error);
        return null;
    }
}

/**
 * Get summary info about governance for display
 */
export function getGovernanceSummary(analysis: AnalysisReport) {
    const summary = {
        totalRoles: Object.keys(analysis.roles || {}).length,
        hasMultisigs: false,
        hasProxies: false,
        keyRoles: [] as Array<{ name: string; address: string; type: string }>,
    };

    // Check for multisigs in governance analysis
    if (analysis.governance_analysis) {
        for (const gov of Object.values(analysis.governance_analysis)) {
            if (gov.is_gnosis_safe) {
                summary.hasMultisigs = true;
            }
            if (gov.is_proxy) {
                summary.hasProxies = true;
            }
        }
    }

    // Extract key roles
    if (analysis.roles) {
        for (const [name, role] of Object.entries(analysis.roles)) {
            if (['owner', 'admin', 'pauser', 'bridge'].some(key => 
                name.toLowerCase().includes(key)
            )) {
                summary.keyRoles.push({
                    name,
                    address: role.address,
                    type: role.type
                });
            }
        }
    }

    return summary;
} 