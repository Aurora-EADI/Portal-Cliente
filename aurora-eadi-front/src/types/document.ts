export enum DocumentStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED'
}

export interface Document {
    id: string
    userId: string
    companyId: string
    name: string
    fileType: 'pdf' | 'jpg' | 'png'
    fileUrl: string
    uploadedAt: string
    status: DocumentStatus
    rejectionReason?: string
    dateIssue?: string
    dateExpiration?: string
}
