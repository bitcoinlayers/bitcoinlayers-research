"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLinkIcon, Users, Hash, Shield, Bitcoin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { BitcoinTransactionAnalysis } from "@/util/load-analysis-report";

interface Props {
    analysis: BitcoinTransactionAnalysis | null;
    layerName: string;
}

const truncateTxid = (txid: string) => {
    return `${txid.slice(0, 8)}...${txid.slice(-8)}`;
};

const formatSatoshis = (satoshis: number) => {
    return (satoshis / 100000000).toFixed(8);
};

const BitcoinScriptAnalysisDropdown = ({ analysis, layerName }: Props) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!analysis) {
        return (
            <div className="border rounded-lg p-4 bg-muted/10">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Bitcoin className="h-4 w-4" />
                    <span className="text-sm">No Bitcoin script analysis available for {layerName}</span>
                </div>
            </div>
        );
    }

    const { signature_analysis, transaction_metadata, summary_stats, layer_association } = analysis;

    return (
        <div className="border rounded-lg bg-muted/10">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <Button
                        variant="ghost"
                        className="flex h-auto w-full justify-between p-4 text-left font-normal"
                    >
                        <div className="flex items-center gap-2">
                            <Bitcoin className="h-4 w-4 text-orange-500" />
                            <div>
                                <h3 className="font-medium">Bitcoin Script Analysis</h3>
                                <p className="text-sm text-muted-foreground">
                                    {layer_association?.layer_name || layerName} custody analysis
                                </p>
                            </div>
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="px-4 pb-4">
                    <div className="space-y-4">
                        {/* Transaction Overview */}
                        <div className="border rounded-lg p-3 bg-background/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Hash className="h-4 w-4 text-blue-500" />
                                <h4 className="font-medium text-sm">Transaction Overview</h4>
                            </div>
                            
                            <div className="space-y-2 text-xs">
                                <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">Transaction ID:</span>
                                    <Link
                                        href={`https://blockstream.info/tx/${analysis.txid}`}
                                        target="_blank"
                                        className="flex items-center gap-1 hover:underline text-blue-600"
                                    >
                                        {truncateTxid(analysis.txid)}
                                        <ExternalLinkIcon className="h-3 w-3" />
                                    </Link>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-muted-foreground">Network:</span>
                                        <span className="ml-1 capitalize">{analysis.network}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Block:</span>
                                        <span className="ml-1">{transaction_metadata.block_height || 'Unconfirmed'}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Fee:</span>
                                        <span className="ml-1">{transaction_metadata.fee} sats</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Size:</span>
                                        <span className="ml-1">{transaction_metadata.size} bytes</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Signature Analysis */}
                        <div className="border rounded-lg p-3 bg-background/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="h-4 w-4 text-green-500" />
                                <h4 className="font-medium text-sm">Custody Pattern</h4>
                            </div>
                            
                            <div className="space-y-2 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-muted-foreground">Signatures Present:</span>
                                        <span className="ml-1 font-medium">{signature_analysis.summary.total_signatures_present}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Has Multisig:</span>
                                        <span className="ml-1">
                                            {signature_analysis.summary.has_multisig ? '✅ Yes' : '❌ No'}
                                        </span>
                                    </div>
                                    {signature_analysis.summary.signature_patterns.includes('weighted_multisig') && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">Voting System:</span>
                                            <span className="ml-1 text-orange-600 font-medium">🗳️ Weighted Multisig</span>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-muted-foreground">SegWit:</span>
                                        <span className="ml-1">
                                            {summary_stats.has_segwit ? '✅ Yes' : '❌ No'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Total Value:</span>
                                        <span className="ml-1">{formatSatoshis(summary_stats.total_value)} BTC</span>
                                    </div>
                                </div>

                                {signature_analysis.summary.has_multisig && (
                                    <>
                                        <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                                            <div className="font-medium text-green-700 dark:text-green-300 mb-1">
                                                Multisig Configuration
                                            </div>
                                            {signature_analysis.threshold_analysis.map((threshold, index) => {
                                                // Check if this is a weighted multisig
                                                const isWeighted = threshold.signature_type === 'weighted_multisig';
                                                
                                                return (
                                                    <div key={index} className="text-green-600 dark:text-green-400">
                                                        <span className="font-mono">{threshold.location}:</span>
                                                        <span className="ml-1 font-medium">{threshold.threshold}</span>
                                                        <span className="ml-1">({threshold.signature_type})</span>
                                                        
                                                        {isWeighted && (
                                                            <div className="mt-2 p-2 bg-orange-50 dark:bg-orange-900/20 rounded border-l-2 border-orange-400">
                                                                <div className="font-medium text-orange-700 dark:text-orange-300 mb-1 text-xs">
                                                                    🗳️ Weighted Voting System
                                                                </div>
                                                                <div className="space-y-1 text-xs text-orange-600 dark:text-orange-400">
                                                                    <div className="text-xs text-muted-foreground mb-2">
                                                                        Custom voting system where each signer has different voting power,
                                                                        requiring a cumulative weight threshold instead of simple signature count.
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Voting Mechanism:</span>
                                                                        <span className="ml-1">Weight-based threshold (not m-of-n)</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Governance Model:</span>
                                                                        <span className="ml-1">Stake-weighted or role-based voting</span>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium">Security Level:</span>
                                                                        <span className="ml-1">≈66% weight threshold required</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Script Types */}
                        <div className="border rounded-lg p-3 bg-background/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="h-4 w-4 text-purple-500" />
                                <h4 className="font-medium text-sm">Script Types Used</h4>
                            </div>
                            
                            <div className="flex flex-wrap gap-1">
                                {summary_stats.script_types.map((scriptType, index) => (
                                    <span key={index} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                                        {scriptType}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Inputs and Outputs Breakdown */}
                        {signature_analysis.input_analysis.signature_breakdown.length > 0 && (
                            <div className="border rounded-lg p-3 bg-background/50">
                                <h4 className="font-medium text-sm mb-2">Input Signatures</h4>
                                <div className="space-y-1">
                                    {signature_analysis.input_analysis.signature_breakdown.map((input, index) => (
                                        <div key={index} className="text-xs flex justify-between">
                                            <span className="text-muted-foreground">{input.location}:</span>
                                            <span>
                                                {input.signatures_present} sig(s) - {input.signature_type}
                                                {input.is_fully_signed ? ' ✅' : ' ❌'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Analysis Metadata */}
                        <div className="text-xs text-muted-foreground border-t pt-2">
                            <div>Analysis Date: {new Date(analysis.analysis_date).toLocaleDateString()}</div>
                            {layer_association?.analysis_type && (
                                <div>Analysis Type: {layer_association.analysis_type}</div>
                            )}
                        </div>
                    </div>
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

export default BitcoinScriptAnalysisDropdown;