import { Router } from 'express';
import * as ClientPortalController from '../controllers/ClientPortalController';

const router = Router();

// Autenticação
router.post('/login', ClientPortalController.login);
router.get('/me', ClientPortalController.getCurrentUser);

// Propostas
router.get('/proposals', ClientPortalController.getProposals);
router.get('/proposals/:id', ClientPortalController.getProposalDetails);

// Documentos
router.get('/documents', ClientPortalController.getDocuments);
router.get('/documents/:id/download', ClientPortalController.downloadDocument);

export default router;
