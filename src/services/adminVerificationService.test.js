import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getVerifications,
  getImageSignedUrl,
  approveVerification,
  rejectVerification,
} from './adminVerificationService';
import * as adminApiClient from './adminApiClient';

vi.mock('./adminApiClient', () => ({
  adminGet: vi.fn(),
  adminMutate: vi.fn(),
  buildQuery: vi.fn((params) => {
    if (!params) return '';
    const q = new URLSearchParams(params).toString();
    return q ? `?${q}` : '';
  }),
}));

describe('adminVerificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVerifications', () => {
    it('calls adminGet with query params', async () => {
      const mockResult = { content: [], totalElements: 0, totalPages: 0 };
      adminApiClient.adminGet.mockResolvedValueOnce(mockResult);

      const filters = { status: 'PENDING', page: '0', size: '15' };
      const res = await getVerifications(filters);

      expect(adminApiClient.adminGet).toHaveBeenCalledWith(
        '/api/v1/admin/verification?status=PENDING&page=0&size=15'
      );
      expect(res).toEqual(mockResult);
    });
  });

  describe('getImageSignedUrl', () => {
    it('calls adminGet for the specified side', async () => {
      const mockSigned = { url: 'https://s3.aws.com/presigned-url', expiresAt: '2026-08-26T12:00:00Z' };
      adminApiClient.adminGet.mockResolvedValueOnce(mockSigned);

      const res = await getImageSignedUrl('uuid-123', 'front');

      expect(adminApiClient.adminGet).toHaveBeenCalledWith('/api/v1/admin/verification/uuid-123/image/front');
      expect(res).toEqual(mockSigned);
    });
  });

  describe('approveVerification', () => {
    it('calls adminMutate with POST method', async () => {
      adminApiClient.adminMutate.mockResolvedValueOnce({ id: 'uuid-123', status: 'APPROVED' });

      const res = await approveVerification('uuid-123');

      expect(adminApiClient.adminMutate).toHaveBeenCalledWith('/api/v1/admin/verification/uuid-123/approve', 'POST');
      expect(res).toEqual({ id: 'uuid-123', status: 'APPROVED' });
    });
  });

  describe('rejectVerification', () => {
    it('calls adminMutate with POST method and reason payload', async () => {
      adminApiClient.adminMutate.mockResolvedValueOnce({ id: 'uuid-123', status: 'REJECTED' });

      const res = await rejectVerification('uuid-123', 'Document blurry');

      expect(adminApiClient.adminMutate).toHaveBeenCalledWith(
        '/api/v1/admin/verification/uuid-123/reject',
        'POST',
        { reason: 'Document blurry' }
      );
      expect(res).toEqual({ id: 'uuid-123', status: 'REJECTED' });
    });
  });
});
