import { Router } from 'express';
import { extractUserId } from '../middleware/permissions';
import { uploadDocument } from '../middleware/upload';
import {
  // Templates
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  uploadTemplateFile,
  
  // Documents
  getDocuments,
  getDocumentById,
  generateDocument,
  generateProposalDocument,
  downloadDocument,
  updateDocumentStatus,
  deleteDocument,
  
  // Versions
  getDocumentVersions,
  
  // Signatures
  getDocumentSignatures,
  createSignatureRequest,
  signDocumentDigitally,
  signDocumentElectronically,
  rejectSignature,
  verifyDigitalSignature,
  getPendingSignatures,
  
  // Audit
  getDocumentAuditLog,
} from '../controllers/DocumentController';

const router = Router();

// Aplicar autenticação em todas as rotas
router.use(extractUserId);

// =============================================
// Templates
// =============================================

router.get('/templates', getTemplates);
router.get('/templates/:id', getTemplateById);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);
router.post('/templates/:id/upload', uploadDocument.single('template'), uploadTemplateFile);

// =============================================
// Documents
// =============================================

router.get('/documents', getDocuments);
router.get('/documents/:id', getDocumentById);
router.post('/documents/generate', generateDocument);
router.post('/documents/proposta/:proposta_id', generateProposalDocument);
router.get('/documents/:id/download', downloadDocument);
router.patch('/documents/:id/status', updateDocumentStatus);
router.delete('/documents/:id', deleteDocument);

// =============================================
// Versions
// =============================================

router.get('/documents/:id/versions', getDocumentVersions);

// =============================================
// Signatures
// =============================================

router.get('/documents/:id/signatures', getDocumentSignatures);
router.post('/documents/:id/signatures', createSignatureRequest);
router.post('/documents/:id/sign/digital', uploadDocument.fields([
  { name: 'certificate', maxCount: 1 },
  { name: 'privateKey', maxCount: 1 }
]), signDocumentDigitally);
router.post('/signatures/sign/:token', signDocumentElectronically);
router.post('/signatures/reject/:token', rejectSignature);
router.get('/signatures/:signature_id/verify', verifyDigitalSignature);
router.get('/signatures/pending', getPendingSignatures);

// =============================================
// Audit
// =============================================

router.get('/documents/:id/audit', getDocumentAuditLog);

export default router;
