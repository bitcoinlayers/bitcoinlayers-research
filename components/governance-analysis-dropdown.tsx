"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ExternalLinkIcon, Shield, Users, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import Link from "next/link";
import { AnalysisReport, GovernanceDetails } from "@/util/load-analysis-report";

interface Props {
    analysis: AnalysisReport | null;
    contractAddress: string;
}

const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const GovernanceItem = ({ name, details }: { name: string; details: GovernanceDetails }) => {
    if (!details) return null;

    return (
        <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
                {details.is_gnosis_safe && <Users className="h-4 w-4 text-blue-500" />}
                {details.is_proxy && <Shield className="h-4 w-4 text-purple-500" />}
                {details.roles && Object.keys(details.roles).length > 0 && <Key className="h-4 w-4 text-green-500" />}
                <h4 className="font-medium text-sm capitalize">{name}</h4>
            </div>
            
            <div className="space-y-2 text-xs">
                <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Address:</span>
                    <Link
                        href={`https://etherscan.io/address/${details.address || 'Unknown'}`}
                        target="_blank"
                        className="flex items-center gap-1 hover:underline text-blue-600"
                    >
                        {truncateAddress(details.address || 'Unknown')}
                        <ExternalLinkIcon className="h-3 w-3" />
                    </Link>
                </div>

                {details.is_gnosis_safe && details.governance_details && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                        <div className="font-medium text-blue-700 dark:text-blue-300 mb-1">
                            🔐 {details.governance_details.multisig_type}
                        </div>
                        <div className="text-blue-600 dark:text-blue-400">
                            Threshold: {details.governance_details.threshold}/{details.governance_details.total_owners} signatures
                        </div>
                        {details.governance_details.owners && details.governance_details.owners.length > 0 && (
                            <div className="mt-1">
                                <span className="text-blue-600 dark:text-blue-400">
                                    {details.governance_details.owners.length} signers
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {details.is_proxy && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                        <div className="font-medium text-purple-700 dark:text-purple-300">
                            🔗 Upgradeable Proxy
                        </div>
                        {details.implementation && (
                            <div className="text-purple-600 dark:text-purple-400 text-xs">
                                Implementation: {truncateAddress(details.implementation)}
                            </div>
                        )}
                    </div>
                )}

                {details.roles && Object.keys(details.roles).length > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
                        <div className="font-medium text-green-700 dark:text-green-300 mb-1">
                            🎭 Contract Roles ({Object.keys(details.roles).length})
                        </div>
                        <div className="space-y-1">
                            {Object.entries(details.roles).slice(0, 2).map(([roleName, roleInfo]) => (
                                <div key={roleName} className="text-green-600 dark:text-green-400 text-xs">
                                    {roleName}: {truncateAddress(roleInfo.address)} ({roleInfo.type})
                                </div>
                            ))}
                            {Object.keys(details.roles).length > 2 && (
                                <div className="text-green-500 dark:text-green-400 text-xs">
                                    +{Object.keys(details.roles).length - 2} more roles
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Function Results */}
                {details.function_results && Object.keys(details.function_results).length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                        <div className="font-medium text-orange-700 dark:text-orange-300 mb-1">
                            ⚙️ Function Results ({Object.keys(details.function_results).length})
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(details.function_results).slice(0, 4).map(([funcName, result]) => (
                                <div key={funcName} className="text-orange-600 dark:text-orange-400 text-xs">
                                    <span className="font-mono">{funcName}():</span> {typeof result === 'string' && result.startsWith('0x') ? truncateAddress(result) : String(result)}
                                </div>
                            ))}
                            {Object.keys(details.function_results).length > 4 && (
                                <div className="text-orange-500 dark:text-orange-400 text-xs">
                                    +{Object.keys(details.function_results).length - 4} more functions
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Discovered Addresses */}
                {details.discovered_addresses && details.discovered_addresses.length > 0 && (
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 p-2 rounded">
                        <div className="font-medium text-cyan-700 dark:text-cyan-300 mb-1">
                            🔍 Discovered Addresses ({details.discovered_addresses.length})
                        </div>
                        <div className="space-y-1 max-h-24 overflow-y-auto">
                            {details.discovered_addresses.slice(0, 3).map((addr: string, idx: number) => (
                                <div key={idx} className="text-cyan-600 dark:text-cyan-400 text-xs">
                                    <Link
                                        href={`https://etherscan.io/address/${addr}`}
                                        target="_blank"
                                        className="hover:underline flex items-center gap-1"
                                    >
                                        {truncateAddress(addr)}
                                        <ExternalLinkIcon className="h-2 w-2" />
                                    </Link>
                                </div>
                            ))}
                            {details.discovered_addresses.length > 3 && (
                                <div className="text-cyan-500 dark:text-cyan-400 text-xs">
                                    +{details.discovered_addresses.length - 3} more addresses
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Analysis Metadata */}
                {(details.network || details.analysis_date) && (
                    <div className="bg-gray-50 dark:bg-gray-900/20 p-2 rounded text-xs text-gray-600 dark:text-gray-400">
                        {details.network && <div>Network: {details.network}</div>}
                        {details.analysis_date && <div>Analyzed: {details.analysis_date}</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default function GovernanceAnalysisDropdown({ analysis, contractAddress }: Props) {
    const [isOpen, setIsOpen] = useState(false);

    if (!analysis) {
        return (
            <div className="text-xs text-muted-foreground mt-2">
                No governance analysis available
            </div>
        );
    }

    const totalRoles = Object.keys(analysis.roles || {}).length;
    const totalGovernanceContracts = Object.keys(analysis.governance_analysis || {}).length;
    
    const hasMultisigs = analysis.governance_analysis ? 
        Object.values(analysis.governance_analysis).some(gov => gov.is_gnosis_safe) : false;
    const hasProxies = analysis.is_proxy || (analysis.governance_analysis ? 
        Object.values(analysis.governance_analysis).some(gov => gov.is_proxy) : false);

    const summaryIcons = [];
    if (hasMultisigs) summaryIcons.push(<Users key="multisig" className="h-3 w-3 text-blue-500" />);
    if (hasProxies) summaryIcons.push(<Shield key="proxy" className="h-3 w-3 text-purple-500" />);
    if (totalRoles > 0) summaryIcons.push(<Key key="roles" className="h-3 w-3 text-green-500" />);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
            <CollapsibleTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-xs h-auto py-2 px-3 mt-2 border border-dashed border-muted-foreground/30 hover:border-muted-foreground/60"
                >
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {summaryIcons}
                        </div>
                        <span>
                            Governance Analysis ({totalRoles} roles, {totalGovernanceContracts} contracts)
                        </span>
                    </div>
                    {isOpen ? (
                        <ChevronUp className="h-3 w-3" />
                    ) : (
                        <ChevronDown className="h-3 w-3" />
                    )}
                </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="mt-3 space-y-3">
                {/* Main Contract Info */}
                <div className="border rounded-lg p-3 bg-background">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="text-sm font-medium">Main Contract</div>
                        {analysis.verified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                Verified
                            </span>
                        )}
                        {analysis.is_proxy && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                                Proxy
                            </span>
                        )}
                    </div>
                    
                    {analysis.is_proxy && analysis.implementation_address && (
                        <div className="text-xs text-muted-foreground mb-2">
                            Implementation: {truncateAddress(analysis.implementation_address)}
                        </div>
                    )}

                    {/* Direct Roles */}
                    {analysis.roles && Object.keys(analysis.roles).length > 0 && (
                        <div className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">Key Roles:</div>
                            {Object.entries(analysis.roles).map(([roleName, roleInfo]) => (
                                <div key={roleName} className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground capitalize">{roleName}:</span>
                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`https://etherscan.io/address/${roleInfo.address}`}
                                            target="_blank"
                                            className="flex items-center gap-1 hover:underline text-blue-600"
                                        >
                                            {truncateAddress(roleInfo.address)}
                                            <ExternalLinkIcon className="h-3 w-3" />
                                        </Link>
                                        <span className="text-muted-foreground">({roleInfo.type})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Governance Analysis */}
                {analysis.governance_analysis && Object.keys(analysis.governance_analysis).length > 0 && (
                    <>
                        <div className="text-sm font-medium text-muted-foreground">
                            Governance Contracts:
                        </div>
                        <div className="space-y-2">
                            {Object.entries(analysis.governance_analysis).map(([name, details]) => (
                                <GovernanceItem key={name} name={name} details={details} />
                            ))}
                        </div>
                    </>
                )}
            </CollapsibleContent>
        </Collapsible>
    );
} 