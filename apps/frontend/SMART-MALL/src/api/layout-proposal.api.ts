import http from './http'
import type { LayoutProposalListItem, StoreLayoutData } from './merchant.api'
export type { LayoutProposalListItem } from './merchant.api'

export interface LayoutProposalDetail {
  proposalId: string
  areaId: string
  areaName?: string
  floorId?: string
  floorName?: string
  merchantId: string
  merchantName?: string
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  submitNote?: string
  rejectReason?: string
  areaBoundaries?: unknown
  layoutData?: StoreLayoutData
  createdAt?: string
  updatedAt?: string
  reviewedAt?: string
}

export async function getPendingLayoutProposals(): Promise<LayoutProposalListItem[]> {
  return http.get<LayoutProposalListItem[]>('/admin/layout-proposals/pending')
}

export async function getLayoutProposalDetail(proposalId: string): Promise<LayoutProposalDetail> {
  return http.get<LayoutProposalDetail>(`/admin/layout-proposals/${proposalId}`)
}

export async function approveLayoutProposal(proposalId: string): Promise<void> {
  await http.post<void>(`/admin/layout-proposals/${proposalId}/approve`)
}

export async function rejectLayoutProposal(proposalId: string, reason: string): Promise<void> {
  await http.post<void>(`/admin/layout-proposals/${proposalId}/reject`, { reason })
}

export const layoutProposalApi = {
  getPendingLayoutProposals,
  getLayoutProposalDetail,
  approveLayoutProposal,
  rejectLayoutProposal,
}

export default layoutProposalApi
